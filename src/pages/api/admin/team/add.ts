import type { APIRoute } from "astro";
import { z } from "zod";
import { env as cfEnv } from "cloudflare:workers";
import type { AdminUser } from "~/schemas";
import { Role } from "~/schemas";
import { requireAdmin } from "~/lib/auth/guards";
import {
  getAllAdminUsersLive,
} from "~/lib/admin-users-live";
import { writeCreatedUser } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/team/add
 *
 * Spec §17.4 / §17.5. Adds a team member.
 *
 *   Owner: may add any role
 *   Admin: may add Contributors only (§12.4)
 *   others: 403
 *
 * For Contributor: generates a plaintext upload token immediately and
 * returns it in the response — the caller shows it once on-screen
 * with "Send to phone" options. After this response, the token is
 * only available by rotation.
 *
 * For Owner/Admin/Editor: generates a one-time invite token stored in
 * INSTALL_TOKENS KV (48-hour TTL per §17.4). Returns an invite URL
 * the caller can copy/share. The target clicks it, passkey-registers,
 * and is activated.
 */

const Body = z.object({
  displayName: z.string().min(1).max(80),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  role: Role,
  trustState: z.enum(["default", "review-required"]).optional(),
});

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const actor = guard;

  let payload: unknown;
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body." },
      400
    );
  }

  const input = parsed.data;

  // RBAC
  if (actor.role === "owner") {
    // any role permitted
  } else if (actor.role === "admin") {
    if (input.role !== "contributor") {
      return json(
        { error: "Admins can only add Contributors. Ask the Owner for other roles." },
        403
      );
    }
  } else {
    return json({ error: "Not permitted." }, 403);
  }

  // Non-Contributor roles must have an email
  if (input.role !== "contributor" && !input.email) {
    return json(
      { error: "Email is required for Owner / Admin / Editor roles." },
      400
    );
  }

  // Email uniqueness check
  const all = await getAllAdminUsersLive();
  if (input.email) {
    const lower = input.email.toLowerCase();
    const clash = all.find((u) => u.email.toLowerCase() === lower);
    if (clash) {
      return json({ error: "Another user already has that email." }, 400);
    }
  }

  // Only one Owner ever per §12.4.
  if (input.role === "owner") {
    return json(
      { error: "Only one Owner per site. Use ownership transfer instead." },
      400
    );
  }

  const now = new Date().toISOString();
  const newId = `${input.role}-${crypto.randomUUID().slice(0, 8)}`;
  const uploadToken = generateToken();

  const newUser: AdminUser = {
    id: newId,
    role: input.role,
    displayName: input.displayName,
    email: input.email || `${newId}@placeholder.invalid`,
    phone: input.phone ?? null,
    timeZone: "America/Los_Angeles",
    adminAccentColor: null,
    passkeyDevices: [],
    recoveryCodes: null,
    activationStatus: "not-yet-activated",
    uploadToken,
    trustState:
      input.role === "contributor"
        ? (input.trustState ?? "default")
        : "default",
    notificationPrefs: {
      "new-inquiry-received": { email: true, sms: Boolean(input.phone) },
      "contributor-uploaded": { email: false, sms: false },
      "pending-tag-requires-resolution": { email: true, sms: false },
      "upload-issue-detected": { email: false, sms: false },
      "nudge-surfaced": { email: false, sms: false },
    },
    createdAt: now,
    createdByUserId: actor.id,
  };

  await writeCreatedUser(newUser);

  await logFieldEdit({
    target: "user",
    targetId: newId,
    field: "team.created",
    oldValue: null,
    newValue: {
      role: input.role,
      displayName: input.displayName,
      createdBy: actor.id,
    },
    actorUserId: actor.id,
    timestamp: now,
  });

  // Compose the response. Contributors get their upload token once.
  // Non-Contributors get an invite link carrying a one-time install
  // token stored in INSTALL_TOKENS KV.
  if (input.role === "contributor") {
    return json({
      ok: true,
      user: newUser,
      uploadToken,
      inviteHint:
        "Contributor created. Send this upload token to their phone so they can install the Shortcut. Shown once — rotate if you need to.",
    });
  }

  // Admin / Editor — issue invite link
  const env = cfEnv as unknown as Env;
  const inviteId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  await env.INSTALL_TOKENS.put(
    `invite:${inviteId}`,
    JSON.stringify({
      forUserId: newId,
      createdAt: now,
      expiresAt,
      consumedAt: null,
    }),
    { expirationTtl: 48 * 3600 }
  );

  const origin =
    env.EXPECTED_ORIGIN ?? new URL(context.request.url).origin;
  const inviteUrl = `${origin}/admin/login?invite=${inviteId}`;

  return json({
    ok: true,
    user: newUser,
    inviteUrl,
    inviteHint:
      "Invite sent via you — copy this link and share it by iMessage, email, or in person. It's good for 48 hours and single-use.",
  });
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
