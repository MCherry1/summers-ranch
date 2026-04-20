import type { APIRoute } from "astro";
import { z } from "zod";
import { AdminUser } from "~/schemas";
import { requireAdmin } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { writeUserOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/user/[id]/field
 *
 * Body: { field: string, value: unknown }
 *
 * Profile self-edit. A user can always edit their own record (name,
 * email, phone, timezone, adminAccentColor). Only Owner can edit
 * other users' records via this endpoint (per §12.4). Role changes
 * and sensitive operations (trust state, ownership transfer, etc.)
 * go through separate endpoints with stricter gating.
 */

// Self-editable fields — every authenticated user can change these
// on their own record.
const SELF_FIELDS: Record<string, z.ZodTypeAny> = {
  displayName: AdminUser.shape.displayName,
  email: AdminUser.shape.email,
  phone: AdminUser.shape.phone,
  timeZone: AdminUser.shape.timeZone,
  adminAccentColor: AdminUser.shape.adminAccentColor,
};

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const actor = guard;

  const { id } = context.params;
  if (!id) return json({ error: "Missing user id." }, 400);

  const targetUser = await getAdminUserLive(id);
  if (!targetUser) return json({ error: "User not found." }, 404);

  // Only the user themselves or an Owner can hit this endpoint.
  // Admin-edits-another-user flows (role changes, team management)
  // belong on dedicated endpoints with their own permission checks.
  if (actor.id !== id && actor.role !== "owner") {
    return json({ error: "Not permitted to edit this user." }, 403);
  }

  let payload: { field?: unknown; value?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const field = String(payload.field ?? "");
  if (!(field in SELF_FIELDS)) {
    return json({ error: `Unknown or non-editable field: ${field}` }, 400);
  }

  const schema = SELF_FIELDS[field]!;
  const parsed = schema.safeParse(payload.value);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid value.";
    return json({ error: message }, 400);
  }

  const newValue = parsed.data;
  const oldValue = (targetUser as Record<string, unknown>)[field];

  if (oldValue === newValue) {
    return json({ ok: true, user: targetUser, noop: true });
  }

  await writeUserOverride(id, { [field]: newValue } as Partial<
    typeof targetUser
  >);

  await logFieldEdit({
    target: "user",
    targetId: id,
    field,
    oldValue,
    newValue,
    actorUserId: actor.id,
    timestamp: new Date().toISOString(),
  });

  const updated = await getAdminUserLive(id);
  return json({ ok: true, user: updated });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
