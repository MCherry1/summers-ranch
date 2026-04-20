import type { AdminUser, AnimalRecord } from "~/schemas";

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
