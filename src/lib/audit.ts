/**
 * Per-field audit log for admin edits — spec §12.7.
 *
 * Each entry captures a single field change on a single entity:
 *   - target type (animal | user | site)
 *   - target id
 *   - field path (dotted, for nested fields: "performanceData.weaningWeight")
 *   - old value, new value (JSON-serialized)
 *   - actor user id
 *   - timestamp
 *
 * Stored in AUDIT_LOG KV keyed as:
 *   edit:<targetType>:<targetId>:<isoTimestamp>:<randomSuffix>
 *
 * The random suffix prevents two near-simultaneous writes from
 * overwriting each other if the ISO timestamp collides.
 *
 * Sensitive-action audit (user add/remove, role change, ownership
 * transfer, etc.) from §17.4 lives in the same KV but under a
 * different prefix ("event:") — see lib/audit-events.ts later.
 */

export type AuditTarget = "animal" | "user" | "site";

export interface FieldEdit {
  target: AuditTarget;
  targetId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  actorUserId: string;
  timestamp: string;
}

async function getEnv(): Promise<Env | null> {
  try {
    const mod = await import("cloudflare:workers");
    return mod.env as Env;
  } catch {
    return null;
  }
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function logFieldEdit(entry: FieldEdit): Promise<void> {
  const env = await getEnv();
  if (!env?.AUDIT_LOG) return;  // soft-fail — don't break the edit if log is down
  const key = `edit:${entry.target}:${entry.targetId}:${entry.timestamp}:${randomSuffix()}`;
  await env.AUDIT_LOG.put(key, JSON.stringify(entry));
}

/**
 * Read the audit trail for a specific target, newest first. Used by
 * the admin edit pages to show "last changed by X on Y".
 */
export async function readTargetAuditTrail(
  target: AuditTarget,
  targetId: string,
  limit = 50
): Promise<FieldEdit[]> {
  const env = await getEnv();
  if (!env?.AUDIT_LOG) return [];

  const prefix = `edit:${target}:${targetId}:`;
  const result: FieldEdit[] = [];

  let cursor: string | undefined;
  do {
    const listing = await env.AUDIT_LOG.list({ prefix, cursor, limit: 100 });
    for (const key of listing.keys) {
      const raw = await env.AUDIT_LOG.get(key.name);
      if (!raw) continue;
      try {
        result.push(JSON.parse(raw) as FieldEdit);
      } catch {
        // skip malformed
      }
      if (result.length >= limit) break;
    }
    if (result.length >= limit || listing.list_complete) break;
    cursor = listing.cursor;
  } while (cursor);

  // Newest first
  result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return result.slice(0, limit);
}
