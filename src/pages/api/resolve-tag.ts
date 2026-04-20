import type { APIRoute } from "astro";
import { getAllAnimalsLive } from "~/lib/cattle-live";
import {
  getUserByUploadToken,
  resolveBearerToken,
} from "~/lib/auth/upload-token";
import { currentUser } from "~/lib/auth/session";
import { sexLabel } from "~/lib/derive/naming";
import { formatAge } from "~/lib/derive/age";

/**
 * GET /api/resolve-tag?tag=<input>
 *
 * Used by the iOS Shortcut picker (§14.2) and the web upload fallback
 * (§14.4) to resolve a typed tag to a list of candidate animals.
 * Returns at most ~8 candidates — exact match plus fuzzy (prefix /
 * substring) matches, ranked by match quality.
 *
 * Auth: either a Bearer upload-token (Shortcut) or an admin session
 * cookie (web fallback with upload-photos capability).
 *
 * Response shape:
 *   {
 *     matches: Array<{ animalId, label }>,
 *     canAddNew: boolean
 *   }
 *
 * `label` is the identity-labeled string the Shortcut shows in its
 * picker: "Sweetheart (Cow, 9yr)" or "Bull #801 (Bull, 3yr)".
 * `canAddNew` is always true currently — every authenticated caller
 * can create a pending-tag stub.
 */

export const GET: APIRoute = async (context) => {
  // Auth: Bearer token wins if present; session is the fallback.
  const bearer = resolveBearerToken(context.request);
  const byToken = bearer ? getUserByUploadToken(bearer) : null;
  const bySession = byToken ? null : await currentUser(context.request);
  const user = byToken ?? bySession;
  if (!user) {
    return json({ error: "Unauthorized." }, 401);
  }
  if (user.role === "contributor" && user.trustState === "revoked") {
    // Silent success per spec §12.5 — don't reveal the revocation to
    // the device. Return an empty match list.
    return json({ matches: [], canAddNew: false });
  }

  const input = (context.url.searchParams.get("tag") ?? "").trim();
  if (!input) {
    return json({ error: "Missing tag parameter." }, 400);
  }

  const all = await getAllAnimalsLive();
  const normalized = input.toUpperCase();

  const scored = all
    .filter((a) => !a.isReference)
    .map((a) => {
      const tagUpper = a.tag.toUpperCase();
      let rank = 99;
      if (tagUpper === normalized) rank = 0;          // exact match
      else if (tagUpper.startsWith(normalized)) rank = 1;
      else if (tagUpper.includes(normalized)) rank = 2;
      else if (a.name && a.name.toUpperCase().includes(normalized)) rank = 3;
      else return null;
      return { animal: a, rank };
    })
    .filter((m): m is { animal: typeof all[number]; rank: number } => m !== null)
    .sort((a, b) => a.rank - b.rank || a.animal.tag.localeCompare(b.animal.tag))
    .slice(0, 8);

  const matches = scored.map(({ animal }) => ({
    animalId: animal.id,
    label: identityLabel(animal),
  }));

  return json({ matches, canAddNew: true });
};

function identityLabel(animal: {
  name: string | null;
  tag: string;
  sex: "cow" | "bull" | "heifer" | "steer" | "calf";
  dateOfBirth: string | null;
}): string {
  const head = animal.name ?? `${sexLabel(animal.sex)} #${animal.tag}`;
  const age = formatAge(animal.dateOfBirth);
  const details = [sexLabel(animal.sex), age].filter(Boolean).join(", ");
  return details ? `${head} (${details})` : head;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
