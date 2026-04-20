import type { AdminUser } from "~/schemas";
import { adminUsers as seedUsers, getAdminUser as getSeedUser } from "./admin-users";
import { getUserOverride, mergeUser } from "./overrides";

/**
 * Overlay-aware AdminUser accessor — async variant of admin-users.ts
 * that merges KV overrides over the seed baseline. Used when rendering
 * a fresh view of the current user (Profile page, admin header, etc.)
 * so edits appear immediately.
 */

export async function getAdminUserLive(id: string): Promise<AdminUser | null> {
  const seed = getSeedUser(id);
  if (!seed) return null;
  const override = await getUserOverride(id);
  return mergeUser(seed, override);
}

export async function getAllAdminUsersLive(): Promise<AdminUser[]> {
  const merged: AdminUser[] = [];
  for (const seed of seedUsers) {
    const override = await getUserOverride(seed.id);
    merged.push(mergeUser(seed, override));
  }
  return merged;
}
