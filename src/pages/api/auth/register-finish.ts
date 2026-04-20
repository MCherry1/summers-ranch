import type { APIRoute } from "astro";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { env } from "cloudflare:workers";
import { getAdminUserByEmail } from "~/lib/admin-users";
import {
  appendCredential,
  deriveDeviceType,
  deriveNickname,
  getRpConfig,
  readChallenge,
  type StoredCredential,
} from "~/lib/auth/webauthn";
import {
  buildSessionCookie,
  createSessionToken,
  writeSession,
} from "~/lib/auth/session";

/**
 * POST /api/auth/register-finish
 *
 * Input: { email, attResp }
 * Verifies the attestation, stores the credential, issues a session
 * cookie. The first successful registration also activates the user.
 */
export const POST: APIRoute = async ({ request }) => {
  let email: string;
  let attResp: unknown;
  try {
    const body = (await request.json()) as { email?: unknown; attResp?: unknown };
    email = String(body.email ?? "").trim();
    attResp = body.attResp;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (!email || !attResp) {
    return json({ error: "Missing registration payload." }, 400);
  }

  const user = getAdminUserByEmail(email);
  if (!user) return json({ error: "Unknown email." }, 404);

  const cfEnv = env as unknown as Env;
  const { rpID, origin } = getRpConfig(cfEnv);

  const expectedChallenge = await readChallenge(cfEnv, email);
  if (!expectedChallenge) {
    return json({ error: "Challenge expired — try again." }, 400);
  }

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
    const message = err instanceof Error ? err.message : "Verification failed";
    return json({ error: message }, 400);
  }

  if (!verification.verified || !verification.registrationInfo) {
    return json({ error: "Could not verify this device." }, 400);
  }

  const { credential } = verification.registrationInfo;
  const userAgent = request.headers.get("user-agent") ?? "";

  const stored: StoredCredential = {
    credentialID: credential.id,
    publicKey: bytesToBase64Url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports as string[] | undefined,
    nickname: deriveNickname(userAgent),
    deviceType: deriveDeviceType(userAgent),
    addedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };

  await appendCredential(cfEnv, user.id, stored);

  const token = createSessionToken();
  await writeSession(token, user.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildSessionCookie(token),
    },
  });
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
