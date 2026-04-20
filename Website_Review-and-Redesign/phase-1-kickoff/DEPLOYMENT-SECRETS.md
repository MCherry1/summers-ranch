# Deployment secrets and environment variables

This document covers the environment variables and secrets the site needs at runtime. Not design — infrastructure.

**Who sets these:** Matt (Owner). These are site-level credentials, not per-user.

---

## Required secrets

### `ANTHROPIC_API_KEY` — photo classification

Used by `/api/upload` and the async classifier worker (see spec §14.7.1) to call Claude Haiku 4.5 for cattle photo classification.

**Where to set:**

Cloudflare Pages dashboard → Pages → summers-ranch → Settings → Environment variables → Production.

- Variable name: `ANTHROPIC_API_KEY`
- Type: Secret (encrypted, never logged)
- Value: Matt's API key from https://console.anthropic.com

**Cost envelope:** ~$0.004 per photo classified. Summers Ranch will classify a few hundred photos per year. Budget: under $5/year for classification. Set Anthropic console spending limit to $10/month as a safety fence — alerts if something runs away.

**Rotation:** rotate annually, or immediately if the key is ever accidentally committed to the repo or exposed in logs.

### `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — SMS notifications

Used by the inquiry notification dispatcher (spec §17.2) to send SMS when configured users get new-inquiry notifications.

**Where to set:** same Cloudflare Pages environment variables.

- `TWILIO_ACCOUNT_SID` — from Twilio console
- `TWILIO_AUTH_TOKEN` — secret, from Twilio console
- `TWILIO_FROM_NUMBER` — the ranch's Twilio number in E.164 format (`+15551234567`)

**Cost envelope:** Twilio charges per SMS sent. At Summers Ranch volume (~10-30 inquiries per year × 3-5 admins receiving SMS), budget is $15-25/year. See spec §17.2 for the cost analysis.

### `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — R2 photo storage

Used by `/api/upload` to write uploaded photos to R2.

**Where to set:** Cloudflare Pages environment variables. Bindings from the R2 bucket happen automatically in the wrangler config (`wrangler.toml`) and don't need manual secrets unless accessing from outside Cloudflare Workers context.

If the app needs to read R2 from outside Workers (admin download flows, etc.), use a scoped R2 API token with read-only permissions.

---

## Local development

For local development, Matt's copy of these secrets lives in `.dev.vars` (a Wrangler convention) in the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_FROM_NUMBER=+1555...
```

**`.dev.vars` is git-ignored** via `.gitignore`. It must never be committed. Double-check that `.gitignore` includes `.dev.vars` before any first commit to a branch.

A sample file without values lives at `.dev.vars.example` (checked in) so new developers know what keys are expected.

---

## Not secrets — but also environment variables

These are config, not secrets. Also set via Cloudflare Pages environment variables but not encrypted:

- `PUBLIC_SITE_URL` — e.g., `https://mrsummersranch.com`. Used to construct canonical URLs and OpenGraph image URLs.
- `PUBLIC_CONTACT_EMAIL` — e.g., `info@mrsummersranch.com`. Public-facing, rendered in contact surfaces.
- `NODE_ENV` — `production` or `development`

---

## If you ever accidentally commit a secret

1. Do **not** just delete and push. The secret is in git history and visible to anyone who clones the repo.
2. **Rotate immediately.** Regenerate the leaked secret at its provider (Anthropic, Twilio, etc.) so the old value is invalidated.
3. Update the new secret in Cloudflare Pages environment variables.
4. Optionally: rewrite git history to remove the secret from past commits (using `git filter-branch` or the BFG Repo-Cleaner). This is a nice-to-have; the important step is rotation so the exposed secret no longer works.

Rotation is the fix. History scrubbing is cosmetic.

---

## Credential hygiene for contributors

Contributors (team members at the Contributor role per spec §12.4) upload via personalized iOS Shortcuts with embedded upload tokens. Those tokens are not Anthropic API keys, not Cloudflare credentials — they're site-internal authorization tokens scoped to `/api/upload` only. See spec §14.1-14.2 for how those tokens are generated, distributed, and rotated.

If a Contributor's phone is lost or stolen, rotate their upload token immediately via `/admin/settings/team/` (Owner or Admin action). This invalidates the lost token without requiring re-provisioning of other tokens.
