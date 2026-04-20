import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { requireCapability } from "~/lib/auth/guards";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/team/[id]/reset-passkey
 *
 * Owner-assisted recovery per spec §17.6. Clears a user's registered
 * passkeys and issues a one-time invite link that lets them register
 * a new passkey at /admin/login?invite=<id>.
 *
 * Owner only; cannot be used on another Owner (there's only one) or
 * on oneself (Owner has their own recovery codes).
 *
 * This is a sensitive action — logged with full context.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "manage-team-full");
  if (guard instanceof Response) return guard;
  const actor = guard;

  const { id } = context.params;
  if (!id) return json({ error: "Missing user id." }, 400);

  const target = await getAdminUserLive(id);
  if (!target) return json({ error: "User not found." }, 404);

  if (target.id === actor.id) {
    return json(
      { error: "Use your own recovery codes on /admin/settings/devices." },
      400
    );
  }
  if (target.role === "owner") {
    return json(
      { error: "Owner recovers via recovery codes, not this reset." },
      400
    );
  }

  const env = cfEnv as unknown as Env;

  // Clear all of the target's registered credentials. On next login
  // they'll hit the registration branch (no credentials → register).
  await env.PASSKEYS.delete(`passkeys:${target.id}`);

  // Issue a 48-hour single-use invite token so the target can jump
  // back in from wherever they're reading the message.
  const inviteId = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  await env.INSTALL_TOKENS.put(
    `invite:${inviteId}`,
    JSON.stringify({
      forUserId: target.id,
      createdAt: now,
      expiresAt,
      consumedAt: null,
      kind: "passkey-reset",
    }),
    { expirationTtl: 48 * 3600 }
  );

  const origin = env.EXPECTED_ORIGIN ?? new URL(context.request.url).origin;
  const inviteUrl = `${origin}/admin/login?invite=${inviteId}`;

  await logFieldEdit({
    target: "user",
    targetId: target.id,
    field: "passkeyDevices.ownerResetAll",
    oldValue: "(previous credentials cleared)",
    newValue: { inviteIssuedBy: actor.id, expiresAt },
    actorUserId: actor.id,
    timestamp: now,
  });

  return json({
    ok: true,
    inviteUrl,
    inviteHint:
      "Passkeys cleared. Copy this invite link and share it with the user. It's good for 48 hours and single-use. They'll register a fresh passkey at /admin/login.",
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
