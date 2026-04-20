import type { APIRoute } from "astro";
import { Role } from "~/schemas";
import { requireCapability } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { writeUserOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/team/[id]/role
 *
 * Owner-only. Changes a user's role. Cannot promote anyone to Owner
 * via this endpoint — Owner change goes through the two-step
 * ownership transfer flow (§17.7, deferred).
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "manage-team-full");
  if (guard instanceof Response) return guard;
  const actor = guard;

  const { id } = context.params;
  if (!id) return json({ error: "Missing id." }, 400);

  const target = await getAdminUserLive(id);
  if (!target) return json({ error: "User not found." }, 404);

  let payload: { role?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const parsed = Role.safeParse(payload.role);
  if (!parsed.success) return json({ error: "Invalid role." }, 400);
  const nextRole = parsed.data;

  if (nextRole === "owner") {
    return json(
      { error: "Use ownership transfer to promote to Owner." },
      400
    );
  }
  if (target.role === "owner") {
    return json({ error: "Can't demote the Owner directly." }, 400);
  }

  if (target.role === nextRole) {
    return json({ ok: true, noop: true });
  }

  await writeUserOverride(id, { role: nextRole });

  await logFieldEdit({
    target: "user",
    targetId: id,
    field: "role",
    oldValue: target.role,
    newValue: nextRole,
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
