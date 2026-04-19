/**
 * WebAuthn helpers — shared between /api/auth/options,
 * /api/auth/register-finish, and /api/auth/authenticate-finish.
 *
 * Passkey credentials are stored in the PASSKEYS KV namespace, keyed
 * by userId → array of stored credentials. Challenges are stored
 * transiently in CHALLENGES (30s TTL) keyed by `challenge:<email>`.
 *
 * Relying Party config comes from env vars set in Cloudflare Pages:
 *   RP_ID — domain only, e.g. "mrsummersranch.com"
 *   RP_NAME — display name, e.g. "Summers Ranch"
 *   EXPECTED_ORIGIN — full origin, e.g. "https://mrsummersranch.com"
 */

/** Transport list as reported by the authenticator. Kept as string[]
 * so newer transports ("cable", "hybrid") round-trip without
 * narrowing to the DOM AuthenticatorTransport enum. */
export type TransportList = string[];

export interface StoredCredential {
  credentialID: string;        // base64url of the raw credential ID
  publicKey: string;           // base64url of the COSE public key
  counter: number;
  transports?: TransportList | undefined;
  nickname: string;
  deviceType: string;
  addedAt: string;
  lastUsedAt: string | null;
}

const CHALLENGE_TTL_SECONDS = 60;

export function challengeKey(email: string): string {
  return `challenge:${email.toLowerCase()}`;
}

export function passkeyKey(userId: string): string {
  return `passkeys:${userId}`;
}

export async function storeChallenge(
  env: Env,
  email: string,
  challenge: string
): Promise<void> {
  await env.CHALLENGES.put(challengeKey(email), challenge, {
    expirationTtl: CHALLENGE_TTL_SECONDS,
  });
}

export async function readChallenge(
  env: Env,
  email: string
): Promise<string | null> {
  const key = challengeKey(email);
  const value = await env.CHALLENGES.get(key);
  if (value) {
    // single-use — delete immediately after read
    await env.CHALLENGES.delete(key);
  }
  return value;
}

export async function readCredentials(
  env: Env,
  userId: string
): Promise<StoredCredential[]> {
  const raw = await env.PASSKEYS.get(passkeyKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredCredential[];
  } catch {
    return [];
  }
}

export async function writeCredentials(
  env: Env,
  userId: string,
  credentials: StoredCredential[]
): Promise<void> {
  await env.PASSKEYS.put(passkeyKey(userId), JSON.stringify(credentials));
}

export async function appendCredential(
  env: Env,
  userId: string,
  credential: StoredCredential
): Promise<void> {
  const existing = await readCredentials(env, userId);
  existing.push(credential);
  await writeCredentials(env, userId, existing);
}

export function getRpConfig(env: Env): {
  rpID: string;
  rpName: string;
  origin: string;
} {
  return {
    rpID: env.RP_ID ?? "localhost",
    rpName: env.RP_NAME ?? "Summers Ranch",
    origin: env.EXPECTED_ORIGIN ?? "http://localhost:4321",
  };
}

/** Nickname heuristic from the client's user-agent at registration. */
export function deriveNickname(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows device";
  if (ua.includes("android")) return "Android device";
  return "Device";
}

/** Best-effort device-type label stored alongside the credential. */
export function deriveDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("android")) return "Android";
  return "Other";
}
