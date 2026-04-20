import type { z } from "zod";
import { RecoveryCode as RecoveryCodeSchema } from "~/schemas";

type RecoveryCode = z.infer<typeof RecoveryCodeSchema>;

/**
 * Recovery codes — spec §17.6.
 *
 * Owner-only self-recovery mechanism. 10 single-use codes generated
 * at Owner setup. Losing all passkeys → enter email + code → session
 * issued → user re-registers a passkey.
 *
 * Non-Owner recovery (§17.6) runs through the Team page — Owner taps
 * "Reset passkey registration" on a user row, the server clears that
 * user's PASSKEYS KV and issues a one-time invite link.
 *
 * Code format: `XXXX-XXXX-XXXX-XXXX` with 16 base32 chars total
 * (80 bits, vastly beyond brute force). Alphabet excludes visually
 * ambiguous characters (I/O/0/1) so users can read them off paper.
 *
 * Storage: SHA-256 hash of the plaintext code. Codes are high-entropy
 * random strings so salting/HMAC is not required for rainbow-table
 * resistance. The plaintext is returned from generate() exactly once
 * and never persisted.
 */

// 32 unambiguous base32 chars (no I / O / 0 / 1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_COUNT = 10;
const GROUPS = 4;
const GROUP_LENGTH = 4;
const CODE_LENGTH = GROUPS * GROUP_LENGTH; // 16

function randomChar(): string {
  const bytes = new Uint8Array(1);
  // Reject values that would bias modular arithmetic (256 % 32 = 0 so safe,
  // but make it explicit for future if we bump the alphabet size).
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  while (true) {
    crypto.getRandomValues(bytes);
    if (bytes[0]! < max) {
      return ALPHABET[bytes[0]! % ALPHABET.length]!;
    }
  }
}

function formatCode(raw: string): string {
  const groups: string[] = [];
  for (let i = 0; i < GROUPS; i++) {
    groups.push(raw.slice(i * GROUP_LENGTH, (i + 1) * GROUP_LENGTH));
  }
  return groups.join("-");
}

/** Generate a single new plaintext recovery code. */
export function generateCode(): string {
  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i++) raw += randomChar();
  return formatCode(raw);
}

/** Canonical form for hashing / comparison: strip separators, uppercase. */
export function canonicalize(input: string): string {
  return input.replace(/[^A-Za-z2-9]/g, "").toUpperCase();
}

/**
 * SHA-256 hex digest of the canonicalized code. Workers provide
 * Web Crypto; no extra dependency.
 */
export async function hashCode(plaintext: string): Promise<string> {
  const canonical = canonicalize(plaintext);
  const bytes = new TextEncoder().encode(canonical);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(buf);
  let hex = "";
  for (const b of view) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/**
 * Generate 10 fresh plaintext codes plus the RecoveryCode records
 * to store. Returns both so the caller can display plaintext ONCE
 * and persist the hash records.
 */
export async function generateRecoverySet(): Promise<{
  plaintexts: string[];
  records: RecoveryCode[];
}> {
  const plaintexts: string[] = [];
  const records: RecoveryCode[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    const plaintext = generateCode();
    const codeHash = await hashCode(plaintext);
    plaintexts.push(plaintext);
    records.push({ codeHash, used: false, usedAt: null });
  }
  return { plaintexts, records };
}

/**
 * Verify a submitted code against a set of stored records. Marks the
 * matching record used (mutating the caller's array). Returns true
 * if match found and not previously used.
 */
export async function consumeCode(
  submitted: string,
  records: RecoveryCode[]
): Promise<boolean> {
  const submittedHash = await hashCode(submitted);
  const match = records.find(
    (r) => !r.used && constantTimeEquals(r.codeHash, submittedHash)
  );
  if (!match) return false;
  match.used = true;
  match.usedAt = new Date().toISOString();
  return true;
}

/** Constant-time string comparison to avoid timing oracle on the hash. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
