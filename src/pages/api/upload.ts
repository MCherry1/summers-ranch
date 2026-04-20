import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import type { MediaAsset, CattleMediaLink } from "~/schemas";
import { getAnimalLive } from "~/lib/cattle-live";
import {
  writeMediaRecord,
  writeLinkRecord,
  writeUploadIssue,
} from "~/lib/overrides";
import { classifyAndPersist } from "~/lib/classifier";
import { recomputeKings } from "~/lib/king";
import {
  getUserByUploadToken,
  resolveBearerToken,
} from "~/lib/auth/upload-token";
import { currentUser } from "~/lib/auth/session";

/**
 * POST /api/upload
 *
 * Spec §14.1-14.3. Receives a binary image from the iOS Shortcut
 * (or the web upload fallback). Persists to R2, creates MediaAsset
 * and CattleMediaLink records via KV, enqueues the classifier, and
 * returns 202 immediately — the Shortcut doesn't wait for
 * classification.
 *
 * Required request:
 *   Authorization: Bearer <upload_token>    (Shortcut)
 *     — or a valid session cookie            (web fallback)
 *   X-Animal-Id: <resolved animalId>
 *   X-Batch-Id: <uuid>
 *   Content-Type: image/jpeg | image/png | image/webp | image/heic | image/avif
 *   Body: raw image bytes
 *
 * Contributor trust states (§12.5):
 *   default          → uploads auto-publish
 *   review-required  → uploads land, visible only in /admin/review/
 *   revoked          → server silently succeeds but persists nothing
 */

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const POST: APIRoute = async (context) => {
  const env = cfEnv as unknown as Env;

  // ── Auth ──────────────────────────────────────────────────────────
  const bearer = resolveBearerToken(context.request);
  const byToken = bearer ? getUserByUploadToken(bearer) : null;
  const bySession = byToken ? null : await currentUser(context.request);
  const user = byToken ?? bySession;
  if (!user) {
    return json({ error: "Unauthorized." }, 401);
  }

  // Revoked contributors: silent success — body never persists, but
  // we return 202 so the Shortcut reports success to the device.
  if (user.role === "contributor" && user.trustState === "revoked") {
    return json({ ok: true, accepted: false }, 202);
  }

  // ── Validate headers ──────────────────────────────────────────────
  const animalId = context.request.headers.get("x-animal-id");
  const batchId = context.request.headers.get("x-batch-id");
  const mediaType = context.request.headers.get("content-type") ?? "";

  if (!animalId) {
    return json({ error: "Missing X-Animal-Id header." }, 400);
  }
  if (!batchId) {
    return json({ error: "Missing X-Batch-Id header." }, 400);
  }
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return json(
      { error: `Unsupported Content-Type: ${mediaType}` },
      415
    );
  }

  const animal = await getAnimalLive(animalId);
  if (!animal) {
    // Record the issue but don't fail loudly — the Shortcut already
    // committed the tag pick. The admin resolves via /admin/upload-issues.
    await writeUploadIssue({
      id: crypto.randomUUID(),
      type: "invalid-tag",
      mediaAssetId: null,
      animalId: animalId,
      uploaderUserId: user.id,
      uploadedAt: new Date().toISOString(),
      message: `Upload referenced animal id "${animalId}" which doesn't exist.`,
      resolved: false,
    });
    return json({ error: "Unknown animal." }, 404);
  }

  // ── Read the body ─────────────────────────────────────────────────
  if (!env.PHOTOS) {
    return json({ error: "R2 PHOTOS binding not configured." }, 500);
  }

  const bytes = await readFullyWithLimit(context.request, MAX_BYTES);
  if (!bytes) {
    return json({ error: "Upload exceeded size limit." }, 413);
  }

  // ── Persist to R2 ─────────────────────────────────────────────────
  const mediaAssetId = crypto.randomUUID();
  const ext = extensionFor(mediaType);
  const r2Key = `${animal.id}/${mediaAssetId}${ext}`;
  try {
    await env.PHOTOS.put(r2Key, bytes, {
      httpMetadata: { contentType: mediaType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `R2 write failed: ${message}` }, 500);
  }

  const capturedAt =
    context.request.headers.get("x-captured-at") ?? new Date().toISOString();
  const originalFilename =
    context.request.headers.get("x-original-filename") ?? `${mediaAssetId}${ext}`;

  // ── Create the MediaAsset + CattleMediaLink records ───────────────
  const asset: MediaAsset = {
    id: mediaAssetId,
    uri: `/r2/${r2Key}`,   // admin-visible path; Phase 2 may route via a public CDN
    orientation: "portrait",  // Phase 2: compute from actual dimensions
    aspectRatio: 0.75,        // ditto — 3:4 default until dimensions land
    capturedAt,
    uploadedAt: new Date().toISOString(),
    uploadedByUserId: user.id,
    batchId,
    detectedShotType: "other",  // classifier overwrites
    livePhotoPair: null,
    originalFilename,
    cardFrontEligible: false,
    timelineEligible: false,
    galleryHerdCandidate: false,
    galleryRanchCandidate: false,
    editorialCandidate: false,
    prescriptionScore: null,
    prescriptionSubscores: null,
    aestheticScore: null,
    aestheticSubscores: null,
    timelineScore: null,
    galleryScore: null,
    editorialScore: null,
  };

  const link: CattleMediaLink = {
    animalId: animal.id,
    mediaAssetId,
    cardFrontKing: false,
    cardFrontKingSince: null,
    cardFrontKingLostAt: null,
    cardFrontBeautyKing: false,
    cardFrontBeautyKingSince: null,
    cardFrontBeautyKingLostAt: null,
    forceInclude: false,
    forceIncludeExpiresAt: null,
    forceExclude: false,
    linkedAt: new Date().toISOString(),
    linkedByUserId: user.id,
  };

  await writeMediaRecord(mediaAssetId, asset);
  await writeLinkRecord(link);

  // ── Fire-and-forget classify + recompute kings ────────────────────
  // Astro adapter exposes the Cloudflare ExecutionContext via
  // locals.runtime.cfContext — schedule the classifier so we return 202
  // immediately without blocking the Shortcut.
  const ctx = context.locals.runtime?.cfContext;
  const classificationType = normalizeMediaType(mediaType);
  const classifyJob = async () => {
    await classifyAndPersist({
      env,
      asset,
      imageBytes: bytes,
      mediaType: classificationType,
    });
    await recomputeKings(animal.id);
  };

  if (ctx?.waitUntil) {
    ctx.waitUntil(classifyJob());
  } else {
    // Dev fallback — fire without waiting.
    void classifyJob();
  }

  return json(
    {
      ok: true,
      mediaAssetId,
      r2Key,
      animalId: animal.id,
    },
    202
  );
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extensionFor(mediaType: string): string {
  switch (mediaType) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/heic": return ".heic";
    case "image/heif": return ".heif";
    case "image/avif": return ".avif";
    default: return "";
  }
}

function normalizeMediaType(
  raw: string
): "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/avif" {
  if (raw === "image/heif") return "image/heic";
  if (
    raw === "image/jpeg" ||
    raw === "image/png" ||
    raw === "image/webp" ||
    raw === "image/heic" ||
    raw === "image/avif"
  ) {
    return raw;
  }
  return "image/jpeg";
}

async function readFullyWithLimit(
  request: Request,
  limit: number
): Promise<ArrayBuffer | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const buffer = new ArrayBuffer(total);
  const out = new Uint8Array(buffer);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}
