import { z } from "zod";
import { AdminUser } from "~/schemas";
import adminUsersJson from "../../data/seed/admin-users.json";

/**
 * Admin roster loader. The JSON file is the baseline — who is
 * permitted to log in and at what role. Passkey credentials live in
 * KV at runtime (not here) because they're added per-device and
 * per-user without redeploying.
 *
 * Validates on import; malformed entries fail the build.
 */

const AdminUsers = z.array(AdminUser);

export const adminUsers: AdminUser[] = AdminUsers.parse(adminUsersJson);

const byId = new Map(adminUsers.map((u) => [u.id, u]));
const byEmail = new Map(adminUsers.map((u) => [u.email.toLowerCase(), u]));

export function getAdminUser(id: string): AdminUser | null {
  return byId.get(id) ?? null;
}

export function getAdminUserByEmail(email: string): AdminUser | null {
  return byEmail.get(email.toLowerCase()) ?? null;
}

/**
 * Owner lookup — there is exactly one per site per spec §12.4.
 * Used by recovery flows and provisioning.
 */
export function getOwner(): AdminUser | null {
  return adminUsers.find((u) => u.role === "owner") ?? null;
}
