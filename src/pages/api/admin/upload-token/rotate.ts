import type { APIRoute } from "astro";
import { requireAdmin } from "~/lib/auth/guards";
import { writeUserOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/upload-token/rotate
 *
 * Generates a new random upload token for the signed-in user and
 * returns the plaintext value ONCE in the response. The caller must
 * display it and offer the user a way to reinstall the Shortcut —
 * the token never appears in any later read (only its presence and
 * a masked preview).
 *
 * The previous token is invalidated immediately. The Shortcut on
 * the old phone will 401 until reinstalled with the new token.
 *
 * Per spec §22.1: "hashed in storage" is a Phase 2 concern; Phase 1
 * stores plaintext. Rotation still works the same — overwrite the
 * field with a fresh random value.
 */

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  const token = generateToken();

  await writeUserOverride(user.id, { uploadToken: token });

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "uploadToken.rotated",
    oldValue: "••• previous token invalidated",
    newValue: `••• new token issued (…${token.slice(-4)})`,
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      ok: true,
      token,   // shown once — never returned again
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
