# Summers Ranch — Agent Handoff Checklist

## Purpose

This document is the **first thing** a new coding agent should read before touching the Summers Ranch rebuild.

It is not a full spec. It is a practical operating checklist:
- what to read first
- what to trust
- what is stale but still useful
- what must be preserved
- what to build first
- what not to build yet

---

## 1. Read in this order

### First-pass reading order
1. `MASTER-IMPLEMENTATION-BRIEF.md`
2. `ASTRO-MIGRATION-DECISION.md`
3. `CANONICAL-DATA-MODEL-SPEC-v2.md`
4. `PHOTO-PIPELINE-ARCHITECTURE.md`
5. `MEDIA-INGESTION-STATE-MACHINE-SPEC.md`
6. `SUMMERS-RANCH-REPO-REORG-ROADMAP.md`
7. `FUTURE-PRIVATE-LAYER-ARCHITECTURE.md`
8. `AHA-REGISTRATION-WORKFLOW.md`
9. `AHA-REGISTRATION-IMPLEMENTATION-SPEC.md`
10. `INTEGRATION-OPTIONS-AHA-CATTLEMAX.md`

### Then read the current repo documents
11. `README.md`
12. `CLAUDE.md`
13. `spec/design-spec.md`
14. `docs/PHOTO-GUIDE.md`
15. `docs/IOS-SHORTCUT-GUIDE.md`
16. current `site-config.json`
17. current `cattle-data.json`
18. inspect current public pages and admin flow in the repo

---

## 2. What is authoritative now

Treat these as the current source of truth for the rebuild direction:

- `MASTER-IMPLEMENTATION-BRIEF.md`
- `CANONICAL-DATA-MODEL-SPEC-v2.md`
- `PHOTO-PIPELINE-ARCHITECTURE.md`
- `MEDIA-INGESTION-STATE-MACHINE-SPEC.md`
- `ASTRO-MIGRATION-DECISION.md`

If older documents conflict with these, prefer the newer documents above.

---

## 3. What is stale but still valuable

These older/current repo docs are **not useless**. They contain important design goals, tone, workflows, and practical context. But parts of them reflect an earlier build path.

### `spec/design-spec.md`
Still valuable for:
- visual tone
- design philosophy
- ranch-site research notes
- page intent
- palette/typography/aesthetic goals

Potentially stale for:
- exact implementation path
- some older page assumptions
- older file-structure assumptions
- older infrastructure assumptions

### `CLAUDE.md`
Still valuable for:
- family/business context
- surprise-gift origin
- owner workflow assumptions
- admin intent
- practical constraints around non-technical users

Potentially stale for:
- exact phase model
- exact admin implementation details
- assumptions from the raw HTML prototype era

### `docs/PHOTO-GUIDE.md` and `docs/IOS-SHORTCUT-GUIDE.md`
Still valuable for:
- real-world operator workflow
- how the ranch user actually thinks about uploads
- existing shortcut assumptions
- current naming/inbox logic

Potentially stale for:
- direct-to-repo permanence
- exact future processing architecture

---

## 4. Core product truths that must be preserved

Do **not** design against these truths.

### Human workflow truth
The primary real operator is:
- not technically savvy
- on an iPhone
- comfortable with Share Sheet workflows
- not interested in Git, file naming, or debugging

### Product truth
The site is not only a brochure site.
It is:
1. public ranch brand site
2. public herd catalog
3. private/admin ranch workflow surface
4. media ingestion and management system

### Media truth
The photo pipeline is central.
This is not an accessory feature.

### Data truth
Cattle identity must be based on an internal immutable ID, not visible tag alone.

### UX truth
The public site must feel deliberate on both mobile and desktop.
It should not merely “shrink” to mobile.

---

## 5. Hard rules for the rebuild

### Identity rule
Every animal gets an immutable internal `animalId`.

### Tag rule
Visible tags can change.
Visible tags are not the true primary key.

### Calf rule
Calves may temporarily share the dam’s visible tag.
That must not break identity or history.

### Media rule
Photo history attaches to `animalId`, not merely the current visible tag string.

### Public herd-card rule
Public herd cards should center on:
- tag
- name if present
- lightweight ribbons/badges
- three canonical public views:
  - side
  - head-on
  - three-quarter

### Detail-page rule
Cattle detail pages must support chronological growth/timeline viewing.

### Privacy rule
Useful EXIF/metadata may be retained privately in structured records, but must not be exposed publicly in image delivery.

### Architecture rule
The rebuild should be:
- Astro
- TypeScript
- schema-first
- static-first for public pages
- compatible with a future private/authenticated layer

---

## 6. What to preserve from the current prototype

Preserve the **intent**, not the exact code.

Keep and reinterpret:
- the public page hierarchy
- the ranch tone
- the family-forward branding
- the general cattle browsing concept
- the admin intent
- the existing iPhone upload workflow concept
- the inbox-processing concept
- the current practical field ideas already present in cattle data

Do **not** assume the current file structure, JSON shape, or raw HTML organization should survive unchanged.

---

## 7. What to build first

### Phase 1 — Foundations
Build first:
- Astro project structure
- TypeScript setup
- schema layer
- canonical data model
- shared layouts/components/tokens
- public/admin/private architectural boundaries

### Phase 2 — Media/data foundations
Build next:
- `animalId`-based cattle model
- media asset model
- cattle-media linking model
- ribbon/derived-state model
- seasonal hero/gallery selection model
- media state machine

### Phase 3 — Public site rebuild
Then build:
- home
- about
- herd index
- cattle detail
- gallery
- contact

### Phase 4 — Admin/media tools
Then build:
- media review surfaces
- stale-photo nudges
- override canonical images
- reorder/hide/delete/reassign controls
- cattle field editing

### Phase 5 — Ingestion architecture improvements
Then improve:
- keep Share Sheet UX
- move toward storage/inbox architecture that is safer than repo-as-ingest

---

## 8. What not to build yet

Do **not** lead with these unless specifically instructed:
- full buyer portal
- full order history
- merch commerce system
- broad role/permission matrix
- heavy SSR everywhere
- database-first full application architecture for all features
- a giant React SPA
- pixel-perfect migration of every prototype page/detail before the data model is corrected

These are future-compatible goals, not first-build goals.

---

## 9. Option B vs Option C — instruction for the next agent

Do not misread the recommendation.

### What is being recommended
Build the current rebuild as a **strong Option B foundation**:
- schema-first
- media-first
- object-storage/inbox-compatible
- future-auth-compatible
- future-commerce-compatible

### What is not being recommended
This is **not** a recommendation to trap the site in a forever-static simple brochure mode.

### Why
The goal is to avoid building unnecessary authenticated/private complexity **before** the real ranch workflow and media system are stable.

### Requirement
The rebuild must leave a clean path to future Option C features without forcing a later full rewrite.

---

## 10. Media-system instructions for the next agent

The next agent must understand this clearly:

### Current prototype
- iPhone Shortcut uploads to repo inbox
- GitHub Actions processes inbox
- files are renamed, classified, sorted

### Strategic direction
The **inbox pattern is good**.
The **repo as permanent ingest target is provisional**.

### Therefore
The new architecture should preserve:
- Share Sheet simplicity
- inbox pattern
- automated classification
- automated derivative selection

But should avoid permanently coupling:
- raw upload intake
- source control
- public deploy state

---

## 11. Public herd UX requirements

The next agent must preserve these intentions:

### Herd index
- many cards visible at once
- light information density
- tag is primary
- name if present
- ribbons communicate high-value status quickly
- card softly cycles through the canonical three views

### Cattle detail
- full photo history over time
- chronological growth/timeline feeling
- progressive disclosure of details
- more information available without overwhelming the first view

### Mobile
- cards must feel deliberately mobile-designed
- ribbons and touch interactions must remain clear on phones
- primary actions should be easy for older/non-technical users

---

## 12. Questions the next agent does **not** need to reopen unless necessary

Do not waste time re-litigating these unless implementation reveals a concrete problem:

- Use Astro
- Use TypeScript
- Use immutable `animalId`
- Use visible tag as editable/display identity with history
- Preserve Share Sheet upload as primary ranch-user workflow
- Build for future private features, but do not center v1 around them
- Treat media ingestion as a first-class subsystem

---

## 13. Questions the next agent may still need to refine

These can be refined during implementation:
- exact ribbon set and priority behavior
- exact staleness thresholds by cattle age/status
- exact AI confidence cutoffs and fallback behavior
- exact seasonal hero/media cadence
- exact detail-page timeline presentation mechanics
- exact admin screen layout

These are implementation refinements, not foundational questions.

---

## 14. Success criteria for the rebuild

The rebuild is successful if:
- the public site looks polished and intentional on mobile and desktop
- cattle identity is stable even across tag changes and calf stages
- photo history survives retagging and lifecycle changes
- the iPhone-first upload workflow remains simple
- the media system can scale without folder chaos
- the site can later support buyer/admin/private features without a fresh rewrite
- the underlying data model is clearer than the current prototype

---

## 15. Final instruction to the next agent

Do not treat this as a design-only site refresh.

Treat it as a **media-centric ranch platform rebuild** with:
- a polished public face
- a structured cattle catalog
- a private admin surface
- and an ingestion system built for a real non-technical ranch operator.
