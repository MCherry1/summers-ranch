import type { APIRoute } from "astro";
import { getAdminUserByEmail } from "~/lib/admin-users";
import { getAdminUserLive } from "~/lib/admin-users-live";
import { writeUserOverride } from "~/lib/overrides";
import {
  buildSessionCookie,
  createSessionToken,
  writeSession,
} from "~/lib/auth/session";
import { consumeCode } from "~/lib/recovery";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/auth/recovery
 *
 * Owner-only recovery path per spec §17.6. Email + recovery code →
 * session cookie + redirect hint to /admin/settings/devices so the
 * Owner can register a fresh passkey immediately.
 *
 * Non-Owner roles never hit this endpoint — their recovery is
 * Owner-assisted via /admin/team/[id]/reset-passkey.
 *
 * Defensive: returns a uniform "invalid" error for unknown email,
 * wrong code, already-used code, or non-Owner account. Doesn't
 * distinguish to prevent enumeration.
 */

export const POST: APIRoute = async ({ request }) => {
  let email: string;
  let code: string;
  try {
    const body = (await request.json()) as { email?: unknown; code?: unknown };
    email = String(body.email ?? "").trim();
    code = String(body.code ?? "").trim();
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  if (!email || !code) {
    return json({ error: "Email and recovery code are required." }, 400);
  }

  // Seed-layer lookup to decide whether this identity is even eligible
  // for recovery. Live merge comes after to get the current codes array.
  const seedUser = getAdminUserByEmail(email);
  if (!seedUser) {
    return json({ error: "Couldn't verify that combination." }, 400);
  }

  const user = await getAdminUserLive(seedUser.id);
  if (!user || user.role !== "owner") {
    return json({ error: "Couldn't verify that combination." }, 400);
  }

  const codes = Array.isArray(user.recoveryCodes) ? [...user.recoveryCodes] : [];
  if (codes.length === 0) {
    return json({ error: "No recovery codes on file." }, 400);
  }

  const consumed = await consumeCode(code, codes);
  if (!consumed) {
    return json({ error: "Couldn't verify that combination." }, 400);
  }

  // Persist the marked-used code list.
  await writeUserOverride(user.id, { recoveryCodes: codes });

  await logFieldEdit({
    target: "user",
    targetId: user.id,
    field: "recoveryCodes.consumed",
    oldValue: null,
    newValue: `1 code used; ${codes.filter((c) => !c.used).length} remaining`,
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  // Issue session so the Owner can navigate to Devices and add a new
  // passkey. The old passkeys still work if the Owner recovers them
  // later; they're not cleared automatically on code use.
  const token = createSessionToken();
  await writeSession(token, user.id);

  return new Response(
    JSON.stringify({ ok: true, nextPath: "/admin/settings/devices" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildSessionCookie(token),
      },
    }
  );
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
