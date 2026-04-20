import type {
  AdminUser,
  AnimalRecord,
  CattleMediaLink,
  MediaAsset,
  PendingOwnershipTransfer,
} from "~/schemas";

/**
 * KV overlay pattern — spec §23.4.
 *
 * Seed JSON files (data/seed/*.json) are the immutable baseline, read
 * at build time. Admin edits land as partial overlays in the OVERRIDES
 * KV namespace. Reads merge overlay over seed.
 *
 * Keys:
 *   animal:<animalId>       → Partial<AnimalRecord> (only the fields
 *                              admin has edited; missing fields fall
 *                              back to seed)
 *   user:<userId>           → Partial<AdminUser> (same pattern for
 *                              Profile edits)
 *
 * The audit trail for field-level changes lives in a separate KV
 * namespace (AUDIT_LOG) — see lib/audit.ts.
 *
 * Why this instead of mutating the JSON files at runtime:
 *   - Pages deploy is immutable. The worker can't rewrite data/seed.
 *   - KV is the Cloudflare-native way to persist small operational
 *     data. Low latency, no extra infra.
 *   - Migrating to D1 later is a straight swap of this abstraction.
 *
 * Env is lazily imported from cloudflare:workers so this module
 * builds cleanly during prerender when the runtime env is absent.
 */

async function getEnv(): Promise<Env | null> {
  try {
    const mod = await import("cloudflare:workers");
    return mod.env as Env;
  } catch {
    return null;
  }
}

// ── Animals ─────────────────────────────────────────────────────────

export async function getAnimalOverride(
  animalId: string
): Promise<Partial<AnimalRecord> | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(`animal:${animalId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<AnimalRecord>;
  } catch {
    return null;
  }
}

export async function getAllAnimalOverrides(): Promise<
  Map<string, Partial<AnimalRecord>>
> {
  const env = await getEnv();
  const result = new Map<string, Partial<AnimalRecord>>();
  if (!env?.OVERRIDES) return result;

  // list() supports prefix filtering; paginate until all seen.
  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({
      prefix: "animal:",
      cursor,
    });
    for (const key of listing.keys) {
      const id = key.name.slice("animal:".length);
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        result.set(id, JSON.parse(raw) as Partial<AnimalRecord>);
      } catch {
        // skip malformed
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  return result;
}

export async function writeAnimalOverride(
  animalId: string,
  patch: Partial<AnimalRecord>
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const existing = (await getAnimalOverride(animalId)) ?? {};
  const merged: Partial<AnimalRecord> = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await env.OVERRIDES.put(`animal:${animalId}`, JSON.stringify(merged));
}

/** Returns a new AnimalRecord with overrides merged on top of the seed. */
export function mergeAnimal(
  seed: AnimalRecord,
  override: Partial<AnimalRecord> | null
): AnimalRecord {
  if (!override) return seed;
  return { ...seed, ...override };
}

// ── Admin users ─────────────────────────────────────────────────────

export async function getUserOverride(
  userId: string
): Promise<Partial<AdminUser> | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(`user:${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<AdminUser>;
  } catch {
    return null;
  }
}

export async function writeUserOverride(
  userId: string,
  patch: Partial<AdminUser>
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const existing = (await getUserOverride(userId)) ?? {};
  const merged: Partial<AdminUser> = {
    ...existing,
    ...patch,
  };
  await env.OVERRIDES.put(`user:${userId}`, JSON.stringify(merged));
}

export function mergeUser(
  seed: AdminUser,
  override: Partial<AdminUser> | null
): AdminUser {
  if (!override) return seed;
  return { ...seed, ...override };
}

// ── Created users + tombstones ──────────────────────────────────────
// Team additions at runtime (spec §17.5) land as full records in KV
// keyed user-created:<userId>. Removals (seed or runtime) drop a
// tombstone at user-removed:<userId>. getAllAdminUsersLive merges:
//   seed baseline + created - tombstoned

export async function writeCreatedUser(user: AdminUser): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  await env.OVERRIDES.put(`user-created:${user.id}`, JSON.stringify(user));
}

export async function getCreatedUser(userId: string): Promise<AdminUser | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(`user-created:${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export async function getAllCreatedUsers(): Promise<AdminUser[]> {
  const env = await getEnv();
  const result: AdminUser[] = [];
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({
      prefix: "user-created:",
      cursor,
    });
    for (const key of listing.keys) {
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        result.push(JSON.parse(raw) as AdminUser);
      } catch {
        // skip malformed
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  return result;
}

export async function tombstoneUser(userId: string): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return;
  await env.OVERRIDES.put(
    `user-removed:${userId}`,
    JSON.stringify({ removedAt: new Date().toISOString() })
  );
}

export async function getAllTombstonedUserIds(): Promise<Set<string>> {
  const env = await getEnv();
  const result = new Set<string>();
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({
      prefix: "user-removed:",
      cursor,
    });
    for (const key of listing.keys) {
      const id = key.name.slice("user-removed:".length);
      result.add(id);
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  return result;
}

export async function deleteCreatedUser(userId: string): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return;
  await env.OVERRIDES.delete(`user-created:${userId}`);
}

// ── Site config overlay ─────────────────────────────────────────────
// Owner-only edits on SiteConfig (ranch name, tagline, contact info).
// Seed ships in data/seed/site-config.json; overlay adjusts at runtime.

import type { SiteConfig } from "~/schemas";

export async function getSiteOverride(): Promise<Partial<SiteConfig> | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get("site:config");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<SiteConfig>;
  } catch {
    return null;
  }
}

export async function writeSiteOverride(
  patch: Partial<SiteConfig>
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const existing = (await getSiteOverride()) ?? {};
  const merged: Partial<SiteConfig> = { ...existing, ...patch };
  await env.OVERRIDES.put("site:config", JSON.stringify(merged));
}

// ── Ownership transfers (§17.7) ─────────────────────────────────────
// Rare but consequential records stored in OVERRIDES under
// `transfer:<id>`. KV TTL matches the 7-day expiry so abandoned
// proposals auto-clean.

const TRANSFER_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function writeTransfer(
  transfer: PendingOwnershipTransfer
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const options =
    transfer.status === "pending"
      ? { expirationTtl: TRANSFER_TTL_SECONDS }
      : undefined;
  await env.OVERRIDES.put(
    `transfer:${transfer.id}`,
    JSON.stringify(transfer),
    options
  );
}

export async function readTransfer(
  id: string
): Promise<PendingOwnershipTransfer | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(`transfer:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOwnershipTransfer;
  } catch {
    return null;
  }
}

export async function getAllTransfers(): Promise<PendingOwnershipTransfer[]> {
  const env = await getEnv();
  const result: PendingOwnershipTransfer[] = [];
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({
      prefix: "transfer:",
      cursor,
    });
    for (const key of listing.keys) {
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        result.push(JSON.parse(raw) as PendingOwnershipTransfer);
      } catch {
        // skip malformed
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  result.sort((a, b) => b.proposedAt.localeCompare(a.proposedAt));
  return result;
}

// ── Media assets (new records, not overlays) ────────────────────────
// Uploaded photos create fresh MediaAsset + CattleMediaLink records.
// Reads merge seed + created; writes go straight to KV. Created records
// support patch writes (for classifier score updates, throne flips,
// admin overrides) via the same merge pattern as animals.

export async function getMediaOverride(
  mediaId: string
): Promise<Partial<MediaAsset> | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(`media:${mediaId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<MediaAsset>;
  } catch {
    return null;
  }
}

export async function writeMediaRecord(
  mediaId: string,
  record: MediaAsset | Partial<MediaAsset>
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const existing = (await getMediaOverride(mediaId)) ?? {};
  const merged = { ...existing, ...record };
  await env.OVERRIDES.put(`media:${mediaId}`, JSON.stringify(merged));
}

export async function getAllCreatedMedia(): Promise<MediaAsset[]> {
  const env = await getEnv();
  const result: MediaAsset[] = [];
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({ prefix: "media:", cursor });
    for (const key of listing.keys) {
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        const asset = JSON.parse(raw) as MediaAsset;
        // only include if the record is complete enough to render
        if (asset.id && asset.uri) result.push(asset);
      } catch {
        // skip malformed
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  return result;
}

// ── Links (new join records, not overlays) ──────────────────────────
// CattleMediaLink identity uses a synthetic key of <animalId>:<mediaAssetId>
// since the schema has no link.id field.

function linkKey(animalId: string, mediaAssetId: string): string {
  return `link:${animalId}:${mediaAssetId}`;
}

export async function getLinkOverride(
  animalId: string,
  mediaAssetId: string
): Promise<Partial<CattleMediaLink> | null> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return null;
  const raw = await env.OVERRIDES.get(linkKey(animalId, mediaAssetId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<CattleMediaLink>;
  } catch {
    return null;
  }
}

export async function writeLinkRecord(
  link: CattleMediaLink | Partial<CattleMediaLink> & { animalId: string; mediaAssetId: string }
): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) {
    throw new Error("OVERRIDES KV binding not available");
  }
  const key = linkKey(link.animalId, link.mediaAssetId);
  const existing = (await getLinkOverride(link.animalId, link.mediaAssetId)) ?? {};
  const merged = { ...existing, ...link };
  await env.OVERRIDES.put(key, JSON.stringify(merged));
}

export async function getAllCreatedLinks(): Promise<CattleMediaLink[]> {
  const env = await getEnv();
  const result: CattleMediaLink[] = [];
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({ prefix: "link:", cursor });
    for (const key of listing.keys) {
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        const link = JSON.parse(raw) as CattleMediaLink;
        if (link.animalId && link.mediaAssetId) result.push(link);
      } catch {
        // skip malformed
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  return result;
}

// ── Upload issues (queue of flagged uploads) ────────────────────────

export interface UploadIssue {
  id: string;                 // stable uuid
  type:
    | "invalid-tag"           // Shortcut referenced a non-existent animal
    | "classification-failed" // Claude call failed after retry
    | "not-cattle"            // classifier flagged subjectPresent: false
    | "duplicate"             // same image hash already present
    | "corrupt-file";         // server couldn't read the image
  mediaAssetId: string | null;
  animalId: string | null;
  uploaderUserId: string;
  uploadedAt: string;
  message: string;
  resolved: boolean;
}

export async function writeUploadIssue(issue: UploadIssue): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return;
  await env.OVERRIDES.put(`issue:${issue.id}`, JSON.stringify(issue));
}

export async function getAllUploadIssues(): Promise<UploadIssue[]> {
  const env = await getEnv();
  const result: UploadIssue[] = [];
  if (!env?.OVERRIDES) return result;

  let cursor: string | undefined;
  do {
    const listing = await env.OVERRIDES.list({ prefix: "issue:", cursor });
    for (const key of listing.keys) {
      const raw = await env.OVERRIDES.get(key.name);
      if (!raw) continue;
      try {
        result.push(JSON.parse(raw) as UploadIssue);
      } catch {
        // skip
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  result.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return result;
}

export async function resolveUploadIssue(id: string): Promise<void> {
  const env = await getEnv();
  if (!env?.OVERRIDES) return;
  const raw = await env.OVERRIDES.get(`issue:${id}`);
  if (!raw) return;
  try {
    const issue = JSON.parse(raw) as UploadIssue;
    issue.resolved = true;
    await env.OVERRIDES.put(`issue:${id}`, JSON.stringify(issue));
  } catch {
    // ignore
  }
}
