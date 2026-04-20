import type { AestheticSubscores, MediaAsset, PrescriptionSubscores, ShotType } from "~/schemas";
import { writeMediaRecord } from "~/lib/overrides";
import { writeUploadIssue } from "~/lib/overrides";

/**
 * Claude vision classifier per spec §14.7.1.
 *
 * Model selection — env-driven per spec. Source fallback is the
 * known-good default; Cloudflare Pages env var `CLAUDE_MODEL_CLASSIFIER`
 * overrides.
 *
 * If the API key is absent, the classifier logs an issue and returns
 * without writing scores. The photo still uploads and remains visible
 * with whatever default values it was created with — the admin can
 * retry classification later once the key is configured.
 *
 * Error handling per §14.7.1:
 *   - API failure → retry once with exponential backoff; persistent
 *     failure → write upload issue, leave media unclassified
 *   - Malformed JSON → same failure path
 *   - subjectPresent: false → write "not-cattle" issue, admin decides
 */

const SOURCE_FALLBACK_MODEL = "claude-haiku-4-5-20251001";

export interface ClassificationResult {
  detectedShotType: ShotType;
  subjectPresent: boolean;
  prescriptionSubscores: PrescriptionSubscores | null;
  aestheticSubscores: AestheticSubscores;
  eligibility: {
    cardFrontEligible: boolean;
    timelineEligible: boolean;
    galleryHerdCandidate: boolean;
    galleryRanchCandidate: boolean;
    editorialCandidate: boolean;
  };
  notes: string;
}

const CLASSIFICATION_PROMPT = `You are classifying a photograph of cattle for a registered Hereford ranch catalog site. Analyze the image and return JSON only (no prose, no markdown fences, just raw JSON parseable by JSON.parse).

Classify the shot type, then score on the two rubrics below.

Schema:
{
  "detectedShotType": "side-profile" | "head" | "three-quarter" | "action" | "scenic" | "with-dam" | "detail" | "landscape" | "other",
  "subjectPresent": boolean,
  "prescriptionSubscores": {
    "angle": number,
    "legs": number,
    "fullBody": number,
    "height": number,
    "head": number,
    "cleanliness": number,
    "background": number,
    "lighting": number
  } | null,
  "aestheticSubscores": {
    "technical": number,
    "composition": number,
    "lightingCharacter": number,
    "colorTonal": number
  },
  "eligibility": {
    "cardFrontEligible": boolean,
    "timelineEligible": boolean,
    "galleryHerdCandidate": boolean,
    "galleryRanchCandidate": boolean,
    "editorialCandidate": boolean
  },
  "notes": string
}

Only populate prescriptionSubscores when detectedShotType is "side-profile". Return null for other shot types. Each subscore is 0.0 to 1.0.

If subjectPresent is false, set detectedShotType to "landscape" or "other" as appropriate, and set most eligibility flags to false except possibly galleryRanchCandidate.

Return JSON only. No prose, no markdown, no code fences.`;

interface ClassifyArgs {
  env: Env;
  asset: MediaAsset;
  imageBytes: ArrayBuffer;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/avif";
}

export async function classifyAndPersist(args: ClassifyArgs): Promise<void> {
  const { env, asset } = args;

  if (!env.ANTHROPIC_API_KEY) {
    // Graceful skip — record an issue so admin knows to configure the
    // key, but don't fail the upload.
    await writeUploadIssue({
      id: crypto.randomUUID(),
      type: "classification-failed",
      mediaAssetId: asset.id,
      animalId: null,
      uploaderUserId: asset.uploadedByUserId,
      uploadedAt: asset.uploadedAt,
      message:
        "ANTHROPIC_API_KEY not configured. Photo uploaded but not classified. Set the key in Cloudflare Pages env vars to enable classification.",
      resolved: false,
    });
    return;
  }

  let result: ClassificationResult | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await callClaude(args);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === 0) {
        await sleep(800); // single retry after brief backoff
      }
    }
  }

  if (!result) {
    await writeUploadIssue({
      id: crypto.randomUUID(),
      type: "classification-failed",
      mediaAssetId: asset.id,
      animalId: null,
      uploaderUserId: asset.uploadedByUserId,
      uploadedAt: asset.uploadedAt,
      message: `Classifier failed: ${lastError ?? "unknown error"}`,
      resolved: false,
    });
    return;
  }

  if (!result.subjectPresent) {
    await writeUploadIssue({
      id: crypto.randomUUID(),
      type: "not-cattle",
      mediaAssetId: asset.id,
      animalId: null,
      uploaderUserId: asset.uploadedByUserId,
      uploadedAt: asset.uploadedAt,
      message: result.notes || "Classifier didn't find cattle in this image.",
      resolved: false,
    });
    // Still write the classification so admin can decide what to do.
  }

  const prescriptionScore = result.prescriptionSubscores
    ? computePrescriptionScore(result.prescriptionSubscores)
    : null;
  const aestheticScore = computeAestheticScore(result.aestheticSubscores);

  await writeMediaRecord(asset.id, {
    ...asset,
    detectedShotType: result.detectedShotType,
    prescriptionScore,
    prescriptionSubscores: result.prescriptionSubscores,
    aestheticScore,
    aestheticSubscores: result.aestheticSubscores,
    cardFrontEligible: result.eligibility.cardFrontEligible,
    timelineEligible: result.eligibility.timelineEligible,
    galleryHerdCandidate: result.eligibility.galleryHerdCandidate,
    galleryRanchCandidate: result.eligibility.galleryRanchCandidate,
    editorialCandidate: result.eligibility.editorialCandidate,
  });
}

async function callClaude(args: ClassifyArgs): Promise<ClassificationResult> {
  const { env, imageBytes, mediaType } = args;
  const model = env.CLAUDE_MODEL_CLASSIFIER || SOURCE_FALLBACK_MODEL;

  const base64 = arrayBufferToBase64(imageBytes);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: CLASSIFICATION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API ${response.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = payload.content?.find((b) => b.type === "text")?.text ?? "";
  const cleaned = text.trim().replace(/^```(?:json)?|```$/g, "").trim();

  let parsed: ClassificationResult;
  try {
    parsed = JSON.parse(cleaned) as ClassificationResult;
  } catch {
    throw new Error(`Malformed classification JSON: ${text.slice(0, 200)}`);
  }

  return parsed;
}

export function computePrescriptionScore(s: PrescriptionSubscores): number {
  return (
    s.angle * 25 +
    s.legs * 20 +
    s.fullBody * 15 +
    s.height * 12 +
    s.head * 8 +
    s.cleanliness * 8 +
    s.background * 6 +
    s.lighting * 6
  );
}

export function computeAestheticScore(s: AestheticSubscores): number {
  return (
    s.technical * 35 +
    s.composition * 30 +
    s.lightingCharacter * 20 +
    s.colorTonal * 15
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode(...Array.from(slice));
  }
  return btoa(binary);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
