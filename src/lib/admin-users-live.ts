import type { AdminUser } from "~/schemas";
import { adminUsers as seedUsers, getAdminUser as getSeedUser } from "./admin-users";
import {
  getAllCreatedUsers,
  getAllTombstonedUserIds,
  getCreatedUser,
  getUserOverride,
  mergeUser,
} from "./overrides";

/**
 * Overlay-aware AdminUser accessor — async variant of admin-users.ts
 * that merges KV data over the seed baseline.
 *
 * Resolution order:
 *   1. Created users (team additions at runtime) live entirely in KV
 *   2. Seed users with a per-user override get merged
 *   3. Tombstoned users (seed or created) are filtered out
 *
 * Used when rendering any admin surface so edits and team changes
 * appear immediately.
 */

export async function getAdminUserLive(id: string): Promise<AdminUser | null> {
  const tombstones = await getAllTombstonedUserIds();
  if (tombstones.has(id)) return null;

  const seed = getSeedUser(id);
  if (seed) {
    const override = await getUserOverride(id);
    return mergeUser(seed, override);
  }

  // Not in seed — check created users
  const created = await getCreatedUser(id);
  if (!created) return null;
  const override = await getUserOverride(id);
  return mergeUser(created, override);
}

export async function getAllAdminUsersLive(): Promise<AdminUser[]> {
  const tombstones = await getAllTombstonedUserIds();
  const created = await getAllCreatedUsers();

  const merged: AdminUser[] = [];
  for (const seed of seedUsers) {
    if (tombstones.has(seed.id)) continue;
    const override = await getUserOverride(seed.id);
    merged.push(mergeUser(seed, override));
  }
  for (const user of created) {
    if (tombstones.has(user.id)) continue;
    const override = await getUserOverride(user.id);
    merged.push(mergeUser(user, override));
  }
  return merged;
}
