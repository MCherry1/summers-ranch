import type { APIRoute } from "astro";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { env as cfEnv } from "cloudflare:workers";
import { requireAdmin } from "~/lib/auth/guards";
import {
  getRpConfig,
  readCredentials,
} from "~/lib/auth/webauthn";

/**
 * POST /api/admin/passkey/add-start
 *
 * Starts a WebAuthn registration flow for the already-signed-in user.
 * Different from /api/auth/options in that the user is authenticated
 * by session (not email input) and the registration must exclude
 * their existing credentials so the authenticator doesn't offer a
 * duplicate.
 *
 * Returns: registration options JSON for @simplewebauthn/browser.
 * Challenge stored in CHALLENGES KV under `challenge:add:<email>`.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  const env = cfEnv as unknown as Env;
  const { rpID, rpName } = getRpConfig(env);

  const existing = await readCredentials(env, user.id);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.displayName,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.credentialID,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  });

  // Scope the challenge under an "add:" prefix so it can't collide
  // with an authentication challenge for the same email.
  await env.CHALLENGES.put(
    `challenge:add:${user.email.toLowerCase()}`,
    options.challenge,
    { expirationTtl: 60 }
  );

  return new Response(JSON.stringify({ options }), {
    headers: { "Content-Type": "application/json" },
  });
};
