import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";
import { requireAdmin } from "~/lib/auth/guards";
import { readCredentials, writeCredentials } from "~/lib/auth/webauthn";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/passkey/rename
 *
 * Body: { credentialID: string, nickname: string }
 *
 * Renames a passkey nickname for the signed-in user. Free-text label
 * so the user can distinguish iPhone, laptop, work-laptop, etc.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  let payload: { credentialID?: unknown; nickname?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }
  const credentialID = String(payload.credentialID ?? "").trim();
  const nickname = String(payload.nickname ?? "").trim();
  if (!credentialID) return json({ error: "Missing credentialID." }, 400);
  if (!nickname) return json({ error: "Nickname can't be empty." }, 400);
  if (nickname.length > 80) {
    return json({ error: "Nickname too long (80 char max)." }, 400);
  }

  const env = cfEnv as unknown as Env;
  const credentials = await readCredentials(env, user.id);
  const target = credentials.find((c) => c.credentialID === credentialID);
  if (!target) return json({ error: "Credential not found." }, 404);

  const oldNickname = target.nickname;
  target.nickname = nickname;
  await writeCredentials(env, user.id, credentials);

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "passkeyDevices.rename",
    oldValue: oldNickname,
    newValue: nickname,
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
