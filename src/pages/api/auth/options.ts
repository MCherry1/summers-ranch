import type { APIRoute } from "astro";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { env } from "cloudflare:workers";
import { getAdminUserByEmail } from "~/lib/admin-users";
import {
  getRpConfig,
  readCredentials,
  storeChallenge,
} from "~/lib/auth/webauthn";

/**
 * POST /api/auth/options
 *
 * Input: { email }
 * Output (registration, no passkeys yet):
 *   { mode: "register", options: PublicKeyCredentialCreationOptionsJSON }
 * Output (authentication, passkeys exist):
 *   { mode: "authenticate", options: PublicKeyCredentialRequestOptionsJSON }
 *
 * Does not reveal whether an email is in the roster — returns a
 * uniform "unknown email" error for both missing-user and malformed
 * inputs to prevent enumeration.
 */
export const POST: APIRoute = async ({ request }) => {
  let email: string;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = String(body.email ?? "").trim();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter a valid email." }, 400);
  }

  const user = getAdminUserByEmail(email);
  if (!user) {
    // Uniform response — don't distinguish missing user from other errors
    return json({ error: "That email isn't on the admin roster." }, 404);
  }

  const cfEnv = env as unknown as Env;
  const { rpID, rpName } = getRpConfig(cfEnv);
  const credentials = await readCredentials(cfEnv, user.id);

  if (credentials.length === 0) {
    // First device for this user — registration flow
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
      excludeCredentials: [],
    });
    await storeChallenge(cfEnv, email, options.challenge);
    return json({ mode: "register", options });
  }

  // Existing passkey — authentication flow
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentials.map((c) => ({
      id: c.credentialID,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  });
  await storeChallenge(cfEnv, email, options.challenge);
  return json({ mode: "authenticate", options });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
