import type { APIRoute } from "astro";
import { requireAdmin } from "~/lib/auth/guards";
import { writeUserOverride } from "~/lib/overrides";
import { generateRecoverySet } from "~/lib/recovery";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/recovery/generate
 *
 * Owner-only. Generates a fresh set of 10 single-use recovery codes
 * per spec §17.6. Plaintext codes are returned ONCE in the response —
 * never persisted. Regeneration invalidates all previous codes
 * (whether used or not) by replacing the entire array.
 *
 * The codes are the Owner's only self-recovery mechanism. If they
 * lose every passkey and have no codes, the site has no Owner and
 * the only path back is a fresh deploy that re-seeds admin-users.json.
 * Generating the codes and storing them securely (1Password, paper
 * in a safe, etc.) is the one thing the Owner must do.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  if (user.role !== "owner") {
    return json({ error: "Only the Owner has recovery codes." }, 403);
  }

  const { plaintexts, records } = await generateRecoverySet();

  const hadPrevious =
    Array.isArray(user.recoveryCodes) && user.recoveryCodes.length > 0;

  await writeUserOverride(user.id, { recoveryCodes: records });

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "recoveryCodes.regenerated",
    oldValue: hadPrevious
      ? `${user.recoveryCodes!.length} previous codes invalidated`
      : "no previous codes",
    newValue: `${records.length} new codes issued`,
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  return json({ ok: true, codes: plaintexts });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
