import type { AdminUser } from "~/schemas";
import { getAdminUser } from "~/lib/admin-users";

/**
 * Session mechanics.
 *
 * A session is a random 256-bit token stored in the SESSIONS KV
 * namespace mapping to the admin userId. Cookie is HttpOnly, Secure,
 * SameSite=Lax, Path=/, expires in 30 days.
 *
 * Cookie name is intentionally generic ("sr_sess") so an observer
 * on the wire can't distinguish admin sessions from anything else
 * before the HTTPS handshake.
 *
 * Cloudflare bindings come from the `cloudflare:workers` virtual
 * module per Astro v6 + @astrojs/cloudflare v13 — `Astro.locals.
 * runtime.env` is gone.
 */

export const SESSION_COOKIE = "sr_sess";
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

/** Lazy env import — only evaluates at runtime, not at build-time
 * prerender where `cloudflare:workers` isn't available. */
async function getEnv(): Promise<Env | null> {
  try {
    const mod = await import("cloudflare:workers");
    return mod.env as Env;
  } catch {
    return null;
  }
}

/** Generate a fresh session token (32 random bytes, base64url). */
export function createSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function base64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Extract cookie value from the request. */
export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const pair of header.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Build the Set-Cookie header value for a new session. */
export function buildSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

/** Build the Set-Cookie header value that expires the session. */
export function buildClearCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

/**
 * Resolve the request's current admin user, or null if unauthenticated.
 * Safe to call from any SSR route; KV read is a single GET on the token.
 * Returns null during prerender (no runtime env).
 */
export async function currentUser(
  request: Request
): Promise<AdminUser | null> {
  const env = await getEnv();
  if (!env?.SESSIONS) return null;

  const token = readSessionCookie(request);
  if (!token) return null;

  const userId = await env.SESSIONS.get(token);
  if (!userId) return null;

  return getAdminUser(userId);
}

/**
 * Write a new session to KV with the configured TTL.
 */
export async function writeSession(
  token: string,
  userId: string
): Promise<void> {
  const env = await getEnv();
  if (!env?.SESSIONS) throw new Error("SESSIONS KV binding not available");
  await env.SESSIONS.put(token, userId, {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

/** Delete a session from KV (log out). */
export async function deleteSession(token: string): Promise<void> {
  const env = await getEnv();
  if (!env?.SESSIONS) return;
  await env.SESSIONS.delete(token);
}
