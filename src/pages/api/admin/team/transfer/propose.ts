import type { APIRoute } from "astro";
import { requireCapability } from "~/lib/auth/guards";
import { proposeTransfer } from "~/lib/transfer";

/**
 * POST /api/admin/team/transfer/propose
 *
 * Body: { toUserId: string, confirmDisplayName: string }
 *
 * Owner-only. Per spec §17.7 Step 1. The confirmDisplayName safety
 * check must match the target's displayName exactly (case-insensitive,
 * whitespace-trimmed) — keeps an accidental click from transferring
 * ownership to the wrong person.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "transfer-ownership");
  if (guard instanceof Response) return guard;
  const actor = guard;

  let payload: { toUserId?: unknown; confirmDisplayName?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const toUserId = String(payload.toUserId ?? "").trim();
  const confirmDisplayName = String(payload.confirmDisplayName ?? "").trim();
  if (!toUserId) return json({ error: "Missing toUserId." }, 400);
  if (!confirmDisplayName) {
    return json({ error: "Type the target's display name to confirm." }, 400);
  }

  const result = await proposeTransfer({
    fromUserId: actor.id,
    toUserId,
    confirmDisplayName,
  });

  if (!result.ok) {
    return json({ error: result.error }, 400);
  }

  return json({ ok: true, transfer: result.transfer });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
