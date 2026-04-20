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
  OVERRIDES: KVNamespace;   // runtime-mutable AnimalRecord + AdminUser overlays

  // Build-time config (set as env vars in Cloudflare Pages)
  RP_ID?: string;           // WebAuthn relying party ID, e.g. "mrsummersranch.com"
  RP_NAME?: string;         // Display name for prompts
  EXPECTED_ORIGIN?: string; // Full origin including protocol
}
