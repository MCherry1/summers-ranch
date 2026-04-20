# Deployment secrets and environment variables

This document covers the environment variables and secrets the site needs at runtime. Not design — infrastructure.

**Who sets these:** Matt (Owner). These are site-level credentials, not per-user.

---

## Required secrets

### `ANTHROPIC_API_KEY` — photo classification

Used by `/api/upload` and the async classifier worker (see spec §14.7.1) to call Claude for cattle photo classification.

**Where to set:**

Cloudflare Pages dashboard → Pages → summers-ranch → Settings → Environment variables → Production.

- Variable name: `ANTHROPIC_API_KEY`
- Type: Secret (encrypted, never logged)
- Value: Matt's API key from https://console.anthropic.com

**Keep Matt's Claude Code API key separate.** If you use Claude Code (the terminal agent) during development, generate a distinct API key for it and put it somewhere that doesn't cross with the site's production key. That way a bug in local dev can't blow through the production budget. Each key can have its own spending cap in the Anthropic console.

**Cost envelope:** ~$0.004 per photo classified. Summers Ranch will classify a few hundred photos per year. Budget: under $5/year for classification. Set Anthropic console spending limit to $10/month as a safety fence — alerts if something runs away.

**Rotation:** rotate annually, or immediately if the key is ever accidentally committed to the repo or exposed in logs.

---

## Model selection — env-driven, not hardcoded

The site calls Claude for one task today (photo classification) and may add more over time. **The model ID is never hardcoded in source.** Instead, each task reads from a named environment variable.

### Task aliases

| Env var | Purpose | Current default |
|---|---|---|
| `CLAUDE_MODEL_CLASSIFIER` | Photo classification (spec §14.7.1) | `claude-haiku-4-5-20251001` |
| *(future)* `CLAUDE_MODEL_DRAFTER` | AI-assisted inquiry reply drafts, if added | (not set; probably Sonnet tier when added) |
| *(future)* `CLAUDE_MODEL_EDITORIAL` | Editorial atmospheric pick-review, if added | (not set; probably Opus tier when added) |

**Naming per task, not one global variable.** Different tasks have different cost/quality tradeoffs. The classifier runs thousands of times per year and must stay at Haiku tier. An editorial reviewer running 20 times a year could afford Opus. One global `CLAUDE_MODEL` variable would force bad tradeoffs.

### Where task aliases are set

Same Cloudflare Pages environment variables as secrets:
- Production: Cloudflare Pages → Settings → Environment variables → Production
- Preview: same but under Preview (lets you test a new model on preview deploys before flipping production)
- Local dev: `.dev.vars` file

Source code always reads `env.CLAUDE_MODEL_*` with a hardcoded fallback default in case the env var is unset. The fallback default is a known-good model ID so the site never fails just because an env var is missing.

### Quarterly model review — automated email nudge

Every 90 days, a scheduled Cloudflare Worker (`/functions/cron/quarterly-model-review.ts`) fires and emails the Owner a model review summary. No documentation hunting; everything the Owner needs to decide is in the email.

**Trigger:** Cloudflare Cron Trigger, `0 10 */90 * *` (10am UTC every 90 days; align to Sunday by starting first run on a Sunday).

**What the worker does:**

1. Reads currently-configured `CLAUDE_MODEL_*` environment variables
2. Fetches Anthropic's current models list via API (`GET /v1/models`)
3. Fetches comparative benchmark data from a public leaderboard source:
   - **Primary:** Artificial Analysis API (`https://artificialanalysis.ai/api/v1/models`) — has vision-specific benchmark scores
   - **Fallback:** parses the public Anthropic model list page for tier and release-date information only (no benchmarks)
4. For each configured model, checks:
   - Is there a newer model in the same tier (Haiku stays Haiku, Sonnet stays Sonnet)?
   - Price comparison (same, cheaper, more expensive)
   - Vision benchmark delta if available (MMMU, DocVQA are the relevant ones for photo classification)
   - Is the current model in Anthropic's deprecation list?
5. Composes a single email with recommendations
6. Sends via the same email dispatch mechanism used for inquiries (spec §13.3)

**Email format** (approximate):

```
Subject: Summers Ranch — Quarterly model review, [Month Year]

Summers Ranch currently uses:
- Classifier: Claude Haiku 4.5 (claude-haiku-4-5-20251001)

Newer in same tier?
- Yes: Claude Haiku 5.0 released [date]
- Price: [comparison]
- Vision benchmark (MMMU): [new score] vs [old score] — [delta interpretation]
- Deprecation notice: [none / date]

Recommendation: [upgrade / hold / urgent upgrade if deprecation]

To upgrade:
  Cloudflare Pages → summers-ranch → Settings → Environment variables 
  → Production → change CLAUDE_MODEL_CLASSIFIER to [new model ID]
  No deploy needed.

To ignore: do nothing.

Next review: [date + 90 days].
```

If nothing has changed (no new model in tier, no deprecation), the email is much shorter: *"No action needed. Current model remains the best choice. Next review: [date]."*

**Rationale:**

- Matt is not a daily web-developer user. Calendar-reminder-to-read-documentation doesn't match his ongoing involvement pattern.
- Leaderboard data from Artificial Analysis is comparable across providers and tracks vision benchmarks that correlate with classification task quality, even though nobody benchmarks cattle conformation specifically.
- The email arrives in the inbox Matt already checks for inquiry notifications — it's not a new channel requiring attention.
- Approve/decline is a 30-second manual env var change; the worker does the hard work of determining whether a change is worth considering.

**What the email will never say:**

The email never says "upgrade automatically." It always requires human action. This is deliberate — model upgrades carry real risk of subtle behavior changes that could degrade classification on Summers Ranch's specific photos. Keeping the decision human prevents a silent regression.

**Deprecation is handled separately.** A weekly deprecation check (not this quarterly review) runs much more frequently and handles urgent deprecation cases automatically — either by migrating to the successor Anthropic recommends or by sending an urgent email if no clean successor exists. See spec §14.7.2 for that mechanism.

**Failure modes:**

- If the Artificial Analysis API is unreachable, the email falls back to Anthropic-only data (model names, release dates) without benchmarks. Still useful; recommendation becomes more conservative without benchmark data.
- If the email dispatch fails, the worker logs the error and retries on the next run in 90 days. Low-priority enough that a missed quarterly doesn't matter.
- If a new model in the tier is detected but no benchmark data is available yet (brand new release), the email flags this and recommends waiting until the next quarterly when benchmarks have stabilized.

**Implementation estimate:** ~200 lines of Cloudflare Worker TypeScript. Phase 1 is reasonable — implements alongside the classifier itself.

### Defensive fallbacks

Two safety nets protect the site if a deprecation or model change slips through unnoticed:

1. **Startup health check (Phase 2+):** on worker cold start, fire a minimal 10-token test prompt to the configured model. If the model returns `"model not found"` or similar, log a loud warning and fall back to the hardcoded default in source. This catches silent deprecations.

2. **Request-level fallback:** if a real classification call fails specifically with a model-not-found error (distinguished from transient 5xx by error code), catch it, log, and retry once with the source-level hardcoded default. The photo still gets classified; the admin gets notified to update the env var.

Both defenses mean the site doesn't go down if the configured model evaporates — it just complains loudly while falling back to a known-good.

### Upgrade without code change

The happy path when a new Haiku ships:

1. Read Anthropic's release notes for the new Haiku
2. Check price and capability against current Haiku
3. If it's as cheap and better: Cloudflare Pages → Preview env var → `CLAUDE_MODEL_CLASSIFIER=claude-haiku-5-0-<date>`
4. Test a few uploads in preview environment, verify classifications are good
5. Promote the same env var to Production
6. Update `DEPLOYMENT-SECRETS.md`'s "current default" row above

No code change. No PR. No deploy. Just an env var flip.

---

### `CF_API_TOKEN` — automated env var updates

Used by the weekly deprecation check (spec §14.7.2) to automatically update `CLAUDE_MODEL_*` environment variables in Cloudflare Pages when a deprecation is detected and a clean successor is available.

**Where to set:**

Cloudflare Pages dashboard → Pages → summers-ranch → Settings → Environment variables → Production.

- Variable name: `CF_API_TOKEN`
- Type: Secret (encrypted)
- Value: a Cloudflare API token with `Account Settings: Edit` permission scoped to the summers-ranch Pages project

**How to create:**

1. Log in to Cloudflare dashboard → User Profile → API Tokens
2. Create Token → Custom token
3. Permissions: `Account → Cloudflare Pages → Edit`
4. Account Resources: Include → Summers Ranch account
5. TTL: no expiry (or set one and rotate annually)
6. Copy the token; add to Pages env vars as `CF_API_TOKEN`

**If this token isn't configured:** the weekly deprecation check degrades to email-only mode. It'll still send Matt an urgent email if it detects a deprecation, but won't automatically update the env var after the 7-day grace window. Matt would need to update manually.

**Security note:** this token can read and write environment variables, so treat it as sensitive. Rotate annually. Revoke immediately if ever exposed.

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
