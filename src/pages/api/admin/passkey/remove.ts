import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { requireAdmin } from "~/lib/auth/guards";
import { readCredentials, writeCredentials } from "~/lib/auth/webauthn";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/passkey/remove
 *
 * Body: { credentialID: string }
 *
 * Removes a passkey from the signed-in user. Refuses to remove the
 * last remaining credential — that would lock the user out. An Owner
 * can still reset their own credentials via recovery codes; other
 * users would need Owner-assisted recovery (§17.6).
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  let payload: { credentialID?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }
  const credentialID = String(payload.credentialID ?? "").trim();
  if (!credentialID) return json({ error: "Missing credentialID." }, 400);

  const env = cfEnv as unknown as Env;
  const credentials = await readCredentials(env, user.id);
  const target = credentials.find((c) => c.credentialID === credentialID);
  if (!target) return json({ error: "Credential not found." }, 404);

  if (credentials.length <= 1) {
    return json(
      {
        error:
          "Can't remove your only passkey. Add a second device first, then remove this one.",
      },
      400
    );
  }

  const next = credentials.filter((c) => c.credentialID !== credentialID);
  await writeCredentials(env, user.id, next);

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "passkeyDevices.remove",
    oldValue: { nickname: target.nickname },
    newValue: null,
    actorUserId: user.id,
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
