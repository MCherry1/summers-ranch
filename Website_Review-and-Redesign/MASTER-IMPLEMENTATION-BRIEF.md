# Summers Ranch — Master Implementation Brief

> **IMPORTANT UPDATE (April 2026):** Mark has confirmed that NO legacy data or media needs to be preserved. All photos in the current prototype are test photos; all cattle records are placeholder data. The rebuild is a true fresh slate — not a migration. Treat the current prototype purely as a visual/UX reference, not as a source of data to port. See PROJECT-SYNOPSIS-AND-HISTORY.md and PHASE-1-IMPLEMENTATION.md for the current direction.

## Purpose

This document consolidates the active planning set for the Summers Ranch rebuild/refactor.

It is meant to be the **single handoff brief** for a coding agent that will review the existing repo, absorb the prior specs, and execute a coherent rebuild in sequence.

This brief supersedes the older “brochure-site only” framing. Those older docs still contain useful design goals, language, and aesthetic direction, but the actual product is now larger and more specific:

- a public-facing family ranch brand site
- a public herd catalog with researchable cattle cards
- a private/admin workflow for cattle and media
- a media-first ingestion pipeline centered on iPhone uploads
- a future-friendly private layer for buyers, shop, and direct web uploads

## Active source documents to absorb

The coding agent should treat these as source material:

### Current planning docs
- `ASTRO-MIGRATION-DECISION.md`
- `SUMMERS-RANCH-REPO-REORG-ROADMAP.md`
- `PHOTO-PIPELINE-ARCHITECTURE.md`
- `CANONICAL-DATA-MODEL-SPEC-v2.md`
- `MEDIA-INGESTION-STATE-MACHINE-SPEC.md`
- `FUTURE-PRIVATE-LAYER-ARCHITECTURE.md`
- `AHA-REGISTRATION-WORKFLOW.md`
- `AHA-REGISTRATION-IMPLEMENTATION-SPEC.md`
- `INTEGRATION-OPTIONS-AHA-CATTLEMAX.md`

### Existing repo docs/specs that may be partially stale but still useful
These should **not** be followed literally if they conflict with the new architecture, but they still contain valuable design and UX intent:
- `spec/design-spec.md`
- `CLAUDE.md`
- `docs/PHOTO-GUIDE.md`
- `docs/IOS-SHORTCUT-GUIDE.md`
- any existing admin/cattle/gallery specs in the repo

## High-level product definition

Summers Ranch is **not just a brochure site**.

The rebuilt product should be understood as four connected systems:

1. **Public brand site**
   - home
   - about/story/family
   - gallery
   - contact
   - seasonal forward-facing media and hero curation

2. **Public herd catalog**
   - herd index page with cattle cards
   - card-level visual state and ribbons
   - soft cycling between canonical views
   - cattle detail pages with growth-over-time media timeline
   - progressive disclosure of deeper cattle data

3. **Private ranch/admin layer**
   - cattle record editing
   - media review and curation
   - stale photo nudges
   - registration-readiness support
   - selective public/private visibility controls
   - future direct browser uploads and management

4. **Media ingestion and processing system**
   - iPhone Share Sheet as the primary real-world input path
   - inbox-based processing
   - AI-assisted classification and crop/centering
   - routing into cattle/gallery/hero/seasonal pools
   - persistent metadata and structured media records

## Core strategic decision

### Build direction
**Rebuild now using Astro + light TypeScript, static-first, schema-first.**

### Why
Because the project is still effectively pre-launch, but the data/media complexity is already large enough that continuing with an unstructured HTML prototype will create drift and cleanup costs.

Astro is a strong fit because it is designed for fast, content-focused sites and, by default, builds sites with zero JavaScript runtime code unless interactivity is explicitly added. Cloudflare’s Astro guide describes Astro that way directly. citeturn0search3turn0search5

### Recommended platform shape now
- **Astro** for public pages and admin surface
- **TypeScript** with strict typing
- **schema validation** for cattle/media/site data
- **Cloudflare Pages** for deploys and previews
- **Cloudflare R2** for media/object storage
- **Workers** for upload/processing glue where needed
- **D1 or equivalent** only when the private layer genuinely needs relational data

Cloudflare Pages supports Astro directly and provides build/deploy automation and previews. R2 is S3-compatible object storage, designed for unstructured files and strong consistency, making it a better long-term media inbox than a git repo. D1 is a serverless SQL database and is appropriate later if the private layer needs database-backed features. citeturn0search3turn0search2turn0search0turn0search1

## Clarification: Option B vs Option C

### What Option B means here
Option B is **not** “half-assing it.”

It means building the right foundations now without forcing the full private application stack before it is actually needed:
- typed schemas
- immutable internal IDs
- durable media storage outside git
- upload processing state machine
- clean public/admin/private boundaries
- static-first rendering for public content

### What Option C would mean now
Option C means building the full private app layer immediately:
- full auth
- buyer accounts
- order history
- shop backend
- browser uploads from day one
- richer relational backend
- more dynamic rendering and more operational complexity immediately

### Why not do Option C immediately?
Not because it is impossible.
Because it adds **failure surfaces, design surface area, and operational complexity** before the current hardest problem is solved.

The hardest real problem today is:
- getting photos in from iPhone simply
- classifying them
- attaching them to the right animal identity
- selecting the right public views
- presenting them gracefully on mobile and desktop

That is primarily a **media/data pipeline problem**, not yet an auth/commerce/order-history problem.

### The commitment that avoids a painful rewrite later
The system should be built now so that Option C can be added later **without redoing identity, media, or public rendering foundations**.

That means:
- internal immutable `animalId`
- tag history
- media asset records
- cattle-media links
- state-machine ingestion
- object storage instead of repo-as-inbox
- future-ready separation between public/admin/private layers

If these foundations are done correctly now, adding buyer accounts, a shop, or browser uploads later becomes an extension, not a rewrite.

## Product and UX principles

### 1. Media-first, not text-first
The public experience should make strong use of photography, movement, and implied seasonality.

### 2. Progressive disclosure
Never dump all cattle information on the user at once.

The stack of detail should be:
- herd index = minimal visible info
- cattle card expanded/detail = more operational info
- deeper sections = pedigree, registry, performance, lifecycle, etc.

### 3. Mobile-first, but not mobile-only
The site must feel intentionally designed for both:
- older phone-first ranch users
- desktop-first research-oriented buyers

### 4. Automation first, admin override second
The system should make strong automatic choices by default, but always allow admin override.

### 5. Private metadata, public cleanliness
Useful metadata can be retained privately for AI and internal analytics, but public assets should be stripped of unnecessary EXIF/GPS/device data.

## Herd catalog behavior (required)

### Herd index page
The herd page shows all cattle cards together.

Each card should:
- show the current visible tag
- show the name if present
- surface a small amount of public-ready information only
- support sorting by tag number
- use subtle ribbons/badges to communicate state
- softly cycle through three canonical current views:
  - side view
  - head-on view
  - three-quarter view

These three card images should be the **most recent acceptable images** of each type for that animal.

### Cattle detail page
When a user clicks into a cow:
- all eligible photos appear in date order
- the page can show the cow “growing up” over time
- dates are retained for public display
- deeper information is revealed progressively
- public presentation remains visually clean and not overwhelming

## Identity model (non-negotiable)

### Real primary key
The system’s actual identity key is **not the tag**.

It is an immutable internal site identifier:
- `animalId`

### Why
Because tag numbers are mostly stable but not perfectly immutable.

Examples that must be supported:
- a calf temporarily sharing its dam’s visible tag
- a calf later being re-tagged with its own independent visible tag
- the entire media and record history remaining attached to the same animal identity

### Required identity rules
- `animalId` is permanent
- `displayTag` is the current visible/public tag
- `tagHistory[]` stores earlier visible tag states
- calves get their own `animalId` immediately even if they share the dam’s visible tag convention
- media history always attaches to `animalId`, never to raw tag text alone

## Ribbon/badge model

The cattle card system should support at least two ribbon zones:

### Primary status ribbon
Examples:
- for sale
- sold
- breeder
- retained
- heifer replacement
- pending

### Secondary highlight ribbon
Examples:
- birthday
- featured
- auction/show note
- seasonal note
- expected calf / special status later if needed

These should be generated from derived state, not manually baked into graphics.

## Media system requirements

### Primary intake path
The primary real-world intake path is:
- iPhone photos
- Share Sheet
- minimal prompts
- tag-driven routing

### Secondary intake paths
Also support later:
- gallery/general uploads from iPhone
- DSLR/drone uploads for hero and gallery
- direct browser uploads from admin area

### Current inbox model
The current prototype already uses:
- inbox folder
- GitHub Actions processing
- rename/classify/sort pipeline

That concept is good.

### Long-term adjustment
Keep the inbox concept, but move away from using the deploy repo itself as the intake queue.

Preferred long-term flow:
- Share Sheet/browser upload
- upload endpoint or storage inbox
- processing worker/job
- structured media records written/updated
- Astro site consumes processed/approved state

R2 is strongly consistent for writes, reads, metadata updates, deletions, and listings, which makes it suitable as a durable media inbox and object store. citeturn0search0turn0search2

## Media classification and selection requirements

### Required AI-assisted classification
At minimum:
- side view
- head-on view
- three-quarter view
- group/gallery/general hero candidates
- confidence scoring
- crop/centering hints

### Required admin override actions
- hide
- delete
- reorder
- reassign to another animal
- override shot type
- choose canonical image
- review low-confidence items

### Staleness nudges
The system should notify/admin-nudge based on age and status.

Example logic direction:
- newborn calves: very frequent nudges
- growing calves: still frequent
- mature adults: less frequent

## Gallery and seasonal curation

The site should support a parallel media lane for non-cattle-specific imagery.

Examples:
- herd-wide photos
- scenic ranch shots
- drone footage
- seasonal hero rotations
- monthly or seasonal front-page media swaps

This lane can share processing infrastructure with cattle media but should remain conceptually distinct in the data model.

## Existing design goals to preserve from older repo docs/specs

Even where the older specs are stale in implementation terms, preserve these design intents:
- warm, editorial, rural-premium tone
- strong hero photography
- earthy, authentic palette
- clear family story and trust-building content
- simple navigation
- buyer-oriented research flow
- responsive mobile behavior
- subtle motion, not flashy motion
- easy-to-find contact information
- public cattle presentation that feels more modern and informative than typical ranch sites

## Registration and pedigree direction

The public cattle system and admin schema should remain compatible with the AHA/Hereford registration and pedigree workflow planning already documented.

That means the rebuild should leave room for:
- registration-readiness checks
- pedigree fields
- Whole Herd TPR-related support fields
- future export or assisted submission workflows

But this should remain subordinate to the core ranch workflow unless the owners are ready to operationalize it.

## Future private layer (explicitly planned now)

The system should be built so that these can be added later without architectural replacement:
- buyer accounts
- saved lists / favorites
- order history
- lightweight merch shop
- private buyer portal
- direct browser uploads
- richer admin permissions

### Important constraint
These are **future-capable**, not required to be first-launch blockers.

## Recommended implementation sequence

### Phase 0 — Absorb and audit
- read all current planning docs
- read existing repo docs/specs
- audit what is truly reusable
- identify stale assumptions

### Phase 1 — Foundations
- Astro scaffold
- TypeScript strict mode
- layout system
- design tokens
- global navigation/footer
- mobile/desktop design system
- base schemas

### Phase 2 — Canonical data model
- animal schema
- media asset schema
- cattle-media link schema
- ribbon/derived state schema
- seasonal/gallery selection schema

### Phase 3 — Media pipeline model
- define inbox and processing states
- classify/upload flow
- connect to storage strategy
- support current iPhone-first workflow
- preserve option for later browser uploads

### Phase 4 — Public site rebuild
- home
- about
- herd index
- cattle detail
- gallery
- contact

### Phase 5 — Private/admin rebuild
- cattle editing
- media review
- stale-photo nudges
- visibility control
- curation tools

### Phase 6 — Registration support hooks
- add AHA-related readiness fields and workflow surfaces

### Phase 7 — Optional future private layer
- auth
- buyer portal
- shop
- order history
- richer uploads

## Non-goals for the initial rebuild

Do not over-focus the first pass on:
- full commerce stack
- elaborate account systems
- overly complex social/community features
- turning the whole site into a heavy SPA
- forcing every route to be server-rendered

## Acceptance criteria for the rebuild

A successful first major rebuild should satisfy all of the following:

### Public
- site feels intentional on mobile and desktop
- herd cards are visually clean and sortable
- cards softly cycle through canonical current views
- detail pages support chronological growth viewing
- seasonal/gallery content can be curated cleanly

### Admin
- non-technical ranch use remains realistic
- Share Sheet workflow remains first-class
- media review tools exist or have a clear implementation path
- stale-photo logic exists
- ribbons/statuses are derived consistently

### Architecture
- immutable internal IDs are in place
- tag changes do not break history
- media is modeled as first-class structured data
- build is schema-driven
- storage is designed to move away from repo-as-inbox
- future auth/shop/buyer features can be added without replacing the foundation

## Final instruction to the coding agent

Do not treat this as “port the existing HTML site into Astro.”

Treat this as a **clean rebuild informed by the prototype**.

The prototype, older specs, and current docs are inputs.
The objective is a coherent, durable architecture that matches the actual product now understood:

**a media-first, cattle-centered, family-brand ranch platform with a strong public experience and a future-ready private layer.**
