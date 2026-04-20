import type { APIRoute } from "astro";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { env } from "cloudflare:workers";
import { getAdminUserByEmail } from "~/lib/admin-users";
import {
  getRpConfig,
  readChallenge,
  readCredentials,
  writeCredentials,
} from "~/lib/auth/webauthn";
import {
  buildSessionCookie,
  createSessionToken,
  writeSession,
} from "~/lib/auth/session";

/**
 * POST /api/auth/authenticate-finish
 *
 * Input: { email, authResp }
 * Verifies the assertion against the user's stored credential, bumps
 * the counter, updates lastUsedAt, issues a session cookie.
 */
export const POST: APIRoute = async ({ request }) => {
  let email: string;
  let authResp: unknown;
  try {
    const body = (await request.json()) as { email?: unknown; authResp?: unknown };
    email = String(body.email ?? "").trim();
    authResp = body.authResp;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (!email || !authResp) {
    return json({ error: "Missing authentication payload." }, 400);
  }

  const user = getAdminUserByEmail(email);
  if (!user) return json({ error: "Unknown email." }, 404);

  const cfEnv = env as unknown as Env;
  const { rpID, origin } = getRpConfig(cfEnv);

  const expectedChallenge = await readChallenge(cfEnv, email);
  if (!expectedChallenge) {
    return json({ error: "Challenge expired — try again." }, 400);
  }

  const credentials = await readCredentials(cfEnv, user.id);
  // Find the matching credential by ID (the client sends the ID).
  const respId =
    (authResp as { id?: string }).id ??
    (authResp as { rawId?: string }).rawId;
  const match = credentials.find((c) => c.credentialID === respId);
  if (!match) {
    return json({ error: "No matching passkey — this device isn't registered." }, 400);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      // deno-lint-ignore no-explicit-any
      response: authResp as any,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: match.credentialID,
        publicKey: base64UrlToBytes(match.publicKey),
        counter: match.counter,
        transports: match.transports as AuthenticatorTransport[] | undefined,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return json({ error: message }, 400);
  }

  if (!verification.verified) {
    return json({ error: "That didn't work — try again." }, 400);
  }

  // Bump counter + lastUsedAt
  match.counter = verification.authenticationInfo.newCounter;
  match.lastUsedAt = new Date().toISOString();
  await writeCredentials(cfEnv, user.id, credentials);

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

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
