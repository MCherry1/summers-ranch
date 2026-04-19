import type { APIRoute } from "astro";
import { buildClearCookie, deleteSession, readSessionCookie } from "~/lib/auth/session";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and deletes the server-side session.
 * Redirects back to /admin/login.
 */
export const POST: APIRoute = async ({ request }) => {
  const token = readSessionCookie(request);
  if (token) {
    await deleteSession(token);
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Set-Cookie": buildClearCookie(),
    },
  });
};
