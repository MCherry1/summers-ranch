import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { requireAdmin } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import {
  deleteCreatedUser,
  tombstoneUser,
} from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/team/[id]/remove
 *
 * Removes a team member. Cannot remove the Owner or yourself.
 *
 *   Owner: may remove Admin / Editor / Contributor
 *   Admin: may remove Contributors only
 *
 * Cleans up:
 *   - KV user-created record (if present)
 *   - Tombstones the id so a matching seed entry disappears too
 *   - Clears the PASSKEYS record so residual credentials can't
 *     authenticate a resurrected id
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const actor = guard;

  const { id } = context.params;
  if (!id) return redirect(context, 400, "Missing id.");

  const target = await getAdminUserLive(id);
  if (!target) return redirect(context, 404, "User not found.");

  if (target.id === actor.id) {
    return redirect(context, 400, "You can't remove yourself.");
  }
  if (target.role === "owner") {
    return redirect(
      context,
      400,
      "Transfer ownership before removing the Owner."
    );
  }
  if (actor.role === "admin" && target.role !== "contributor") {
    return redirect(
      context,
      403,
      "Admins can only remove Contributors."
    );
  }
  if (actor.role !== "owner" && actor.role !== "admin") {
    return redirect(context, 403, "Not permitted.");
  }

  const env = cfEnv as unknown as Env;
  await deleteCreatedUser(id);
  await tombstoneUser(id);
  await env.PASSKEYS.delete(`passkeys:${id}`);

  await logFieldEdit({
    target: "user",
    targetId: id,
    field: "team.removed",
    oldValue: { displayName: target.displayName, role: target.role },
    newValue: null,
    actorUserId: actor.id,
    timestamp: new Date().toISOString(),
  });

  return new Response(null, {
    status: 303,
    headers: { Location: "/admin/settings/team" },
  });
};

function redirect(
  _context: unknown,
  _status: number,
  message: string
): Response {
  const qs = new URLSearchParams({ error: message });
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/settings/team?${qs.toString()}` },
  });
}
