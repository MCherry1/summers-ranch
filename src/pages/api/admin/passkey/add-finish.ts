import type { APIRoute } from "astro";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { env as cfEnv } from "cloudflare:workers";
import { requireAdmin } from "~/lib/auth/guards";
import {
  appendCredential,
  deriveDeviceType,
  deriveNickname,
  getRpConfig,
  type StoredCredential,
} from "~/lib/auth/webauthn";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/passkey/add-finish
 *
 * Completes a WebAuthn add-device registration for the signed-in user.
 * On success, appends the new credential to PASSKEYS KV. Unlike the
 * login flow, this does NOT issue a new session cookie — the caller
 * is already authenticated.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  let attResp: unknown;
  try {
    const body = (await context.request.json()) as { attResp?: unknown };
    attResp = body.attResp;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }
  if (!attResp) return json({ error: "Missing attResp." }, 400);

  const env = cfEnv as unknown as Env;
  const { rpID, origin } = getRpConfig(env);

  const key = `challenge:add:${user.email.toLowerCase()}`;
  const expectedChallenge = await env.CHALLENGES.get(key);
  if (!expectedChallenge) {
    return json({ error: "Challenge expired — try again." }, 400);
  }
  await env.CHALLENGES.delete(key);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      // deno-lint-ignore no-explicit-any
      response: attResp as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      400
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return json({ error: "Could not verify this device." }, 400);
  }

  const { credential } = verification.registrationInfo;
  const userAgent = context.request.headers.get("user-agent") ?? "";

  const stored: StoredCredential = {
    credentialID: credential.id,
    publicKey: bytesToBase64Url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports as string[] | undefined,
    nickname: deriveNickname(userAgent),
    deviceType: deriveDeviceType(userAgent),
    addedAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  await appendCredential(env, user.id, stored);

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "passkeyDevices.add",
    oldValue: null,
    newValue: { nickname: stored.nickname, deviceType: stored.deviceType },
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  return json({ ok: true, nickname: stored.nickname });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
