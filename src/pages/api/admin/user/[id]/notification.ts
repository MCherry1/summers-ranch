import type { APIRoute } from "astro";
import { requireAdmin } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { writeUserOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/user/[id]/notification
 *
 * Body: { event: string, channel: "email" | "sms", value: boolean }
 *
 * Toggles a single notification preference for a user. Self-edit
 * only, or Owner editing another user's prefs. Email/SMS toggles
 * are stored side-by-side in user.notificationPrefs[event].
 *
 * The SMS toggle is guarded: if the user has no phone, the SMS
 * toggle can be switched off but not on — the UI disables it with
 * a hint, and the endpoint rejects an attempt to enable SMS without
 * a phone as a defense-in-depth check.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const actor = guard;

  const { id } = context.params;
  if (!id) return json({ error: "Missing user id." }, 400);

  const target = await getAdminUserLive(id);
  if (!target) return json({ error: "User not found." }, 404);

  if (actor.id !== id && actor.role !== "owner") {
    return json({ error: "Not permitted." }, 403);
  }

  let payload: { event?: unknown; channel?: unknown; value?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const event = String(payload.event ?? "").trim();
  const channel = payload.channel;
  const value = Boolean(payload.value);

  if (!event) return json({ error: "Missing event." }, 400);
  if (channel !== "email" && channel !== "sms") {
    return json({ error: "channel must be 'email' or 'sms'." }, 400);
  }

  if (channel === "sms" && value && !target.phone) {
    return json(
      { error: "SMS can't be enabled without a phone number on Profile." },
      400
    );
  }

  const prefs = { ...target.notificationPrefs };
  const current = prefs[event] ?? { email: false, sms: false };
  const updated = { ...current, [channel]: value };
  prefs[event] = updated;

  await writeUserOverride(id, { notificationPrefs: prefs });

  await logFieldEdit({
    target: "user",
    targetId: id,
    field: `notificationPrefs.${event}.${channel}`,
    oldValue: current[channel],
    newValue: value,
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
