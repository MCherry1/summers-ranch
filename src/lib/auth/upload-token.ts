import type { AdminUser } from "~/schemas";
import { adminUsers } from "~/lib/admin-users";

/**
 * Upload-token authentication for /api/upload and /api/resolve-tag.
 *
 * Per spec §14.1-14.2, the iOS Shortcut carries a per-user upload
 * token in an Authorization: Bearer header. Contributors, admins,
 * and owners all use this same mechanism — the token identifies
 * the user.
 *
 * The token is stored in admin-users.json as `uploadToken`. Phase 1
 * compares plaintext (tokens live only in JSON committed to a
 * private repo and in iOS keychains on each user's device). Phase 2
 * should hash and compare, with rotation. See spec §22.1 comment.
 *
 * Incoming request:
 *   Authorization: Bearer <token>
 * or the web-fallback path uses session cookies instead (see
 * /admin/upload).
 */

const TOKEN_PLACEHOLDER = "TO-BE-ROTATED-ON-FIRST-LOGIN";

export function resolveBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

export function getUserByUploadToken(token: string): AdminUser | null {
  // Reject the placeholder explicitly — the baseline seed ships with
  // this sentinel and accepting it would bypass auth until the user
  // actually sets a real token.
  if (token === TOKEN_PLACEHOLDER) return null;

  for (const user of adminUsers) {
    if (user.uploadToken && user.uploadToken === token) {
      return user;
    }
  }
  return null;
}
