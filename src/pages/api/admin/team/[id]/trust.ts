import type { APIRoute } from "astro";
import { z } from "zod";
import { requireAdmin } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { writeUserOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/team/[id]/trust
 *
 * Spec §12.5 — toggle a Contributor's trust state among
 * default / review-required / revoked. Owner and Admin may perform
 * this action; Editor cannot.
 *
 * This is the only endpoint where Admin can edit a non-own user
 * (per §12.4 capability matrix: Admin has Contributor management).
 */

const TrustState = z.enum(["default", "review-required", "revoked"]);

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const actor = guard;

  if (actor.role !== "owner" && actor.role !== "admin") {
    return json({ error: "Not permitted." }, 403);
  }

  const { id } = context.params;
  if (!id) return json({ error: "Missing id." }, 400);

  const target = await getAdminUserLive(id);
  if (!target) return json({ error: "User not found." }, 404);

  if (target.role !== "contributor") {
    return json(
      { error: "Trust state only applies to Contributors." },
      400
    );
  }

  let payload: { trustState?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const parsed = TrustState.safeParse(payload.trustState);
  if (!parsed.success) {
    return json({ error: "Invalid trust state." }, 400);
  }
  const nextState = parsed.data;

  if (target.trustState === nextState) {
    return json({ ok: true, noop: true });
  }

  await writeUserOverride(id, { trustState: nextState });

  await logFieldEdit({
    target: "user",
    targetId: id,
    field: "trustState",
    oldValue: target.trustState,
    newValue: nextState,
    actorUserId: actor.id,
    timestamp: new Date().toISOString(),
  });

  return json({ ok: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
