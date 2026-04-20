/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals {
    runtime: Runtime;
  }
}

interface Env {
  SESSIONS: KVNamespace;
  PASSKEYS: KVNamespace;
  CHALLENGES: KVNamespace;
  AUDIT_LOG: KVNamespace;
  INSTALL_TOKENS: KVNamespace;
  NUDGES: KVNamespace;
  OVERRIDES: KVNamespace;   // runtime-mutable AnimalRecord + AdminUser + MediaAsset + link overlays

  PHOTOS: R2Bucket;         // uploaded photos — keyed {animalId}/{mediaAssetId}.{ext}

  // Build-time config (set as env vars in Cloudflare Pages)
  RP_ID?: string;           // WebAuthn relying party ID, e.g. "mrsummersranch.com"
  RP_NAME?: string;         // Display name for prompts
  EXPECTED_ORIGIN?: string; // Full origin including protocol

  // Secrets (set as Secret-type env vars in Cloudflare Pages)
  ANTHROPIC_API_KEY?: string;  // photo classification; when absent, classifier skips gracefully

  // Model selection — env-driven per spec §14.7.1 (never hardcode).
  // Source-level fallback lives in lib/classifier.ts.
  CLAUDE_MODEL_CLASSIFIER?: string;

  // Notification dispatch (spec §13.3). When any of these are absent,
  // the corresponding channel skips gracefully — inquiries still land
  // in /admin/inquiries regardless.
  MAILCHANNELS_FROM_EMAIL?: string;   // e.g. "info@mrsummersranch.com"
  MAILCHANNELS_FROM_NAME?: string;    // e.g. "Summers Ranch"

  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;        // E.164, e.g. "+15551234567"
}
