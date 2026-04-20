# CLAUDE.md — Summers Ranch (v2)

Agent orientation for mrsummersranch.com. Read this first. Then read the
authoritative spec at
`Website_Review-and-Redesign/phase-1-kickoff/CARD-REDESIGN-SPEC.md`
and the visual-craft guide at
`Website_Review-and-Redesign/phase-1-kickoff/POLISH-AND-AESTHETICS.md`.

## What this is

Summers Ranch is a family-owned registered Hereford cattle operation in
Sutter Creek, California. Marty and Roianne Summers have run the herd
since 1998. This website is a gift from their son-in-law Matt. It serves
as (a) a public catalog of the herd, (b) a sales surface for available
animals, (c) an operational tool Marty and Roianne maintain themselves,
and (d) a personal archive of the animals over time. V1 was a flat
static site; V2 is the considered rebuild.

## Stack

- **Astro 4** (strict TypeScript). Static site with a handful of
  server-rendered endpoints.
- **Zod** for all schemas. Runtime validation at data boundaries.
- **Cloudflare Pages** hosts the static site. **Workers** handle
  `/api/*` and `/install/shortcut`. **R2** stores photos. **KV** holds
  install tokens, audit log, pending transfers, nudges.
- **No UI framework.** Astro's islands + vanilla TS + per-component
  `<style>` blocks. No React, no Vue, no Tailwind.
- **Google Fonts** (Playfair Display, Work Sans, Cinzel, Lato) — the
  only runtime dependency beyond our own code.

## Design principles (from spec §1)

1. **The cow is the hero.** Photography leads, UI chrome recedes.
2. **Better empty than wrong.** Null fields hide; no "Not set" labels.
3. **Stale content worse than no content.** Nudges before gaps go live.
4. **Operational innovation over presentation flash.** Admin tools
   matter as much as the public surface.
5. **Restraint over expression.** Warm but serious. Never gimmicky.
6. **Discovery not duty.** Progressive disclosure, no hamburgers until
   you need them.

## Aesthetic direction

Refined editorial, not SaaS. Kinfolk, Aesop, Apple Photos, Hereford
World. Full craft guide in `POLISH-AND-AESTHETICS.md`. Defaults:
burgundy used sparingly, 1px dividers in `--color-cream-deep`, square
corners (1-3px radius), left-aligned beats centered, generous
whitespace beats dense info, Playfair italic + burgundy for emphasized
phrases in titles. Ribbons stay ceremonial — gold Available, DOD blue,
SOD red, baby-blue/pink birthday — never themed by mode.

When spec and POLISH disagree on an aesthetic detail, POLISH wins.
Otherwise spec wins. When unsure, ask Matt.

## Where things live

```
src/
  styles/tokens.css     — visual system, single source of truth
  styles/global.css     — thin normalizer on top of tokens
  schemas/              — Zod + TS types for all data
  layouts/BaseLayout    — shell, webfonts, OG meta
  components/           — reusable UI
  components/cattle/    — Card, card-back sections, ribbon-aware wrappers
  components/ribbons/   — ribbon primitives, px units throughout
  pages/                — routes
  lib/                  — shared derivations (age, naming, throne calc)
  shortcuts/            — master iOS Shortcut file
functions/              — Cloudflare Workers (Pages Functions)
  api/                  — /api/upload, /api/resolve-tag, /api/inquiry, …
  install/shortcut.ts   — byte-substitutes personalized token
  admin/                — admin-only endpoints
data/
  seed/                 — canonical JSON committed to repo
  production/           — runtime-mutable (KV-backed) when scale demands
public/                 — static assets served at root
Website_Review-and-Redesign/
  phase-1-kickoff/      — spec + polish + style-lock + archives
```

## Conventions

- **Inline-edit everywhere in admin.** Auto-save on blur, no "Save"
  button, per-field audit trail. See spec §12.7.
- **Plain-language labels.** "American Hereford papers" not
  "Registration." "Calves from this cow" not "Progeny." Admin and
  public see the same labels.
- **Never show placeholder data for null fields.** If a field is null,
  its row doesn't render.
- **No fake cattle data, ever.** This was a hard rule in v1's CLAUDE.md
  and stays a hard rule: never generate tag numbers, lineage, or
  animal details. Marty and Roianne provide those.
- **No fake scores.** If prescription/aesthetic scores haven't been
  computed, they're null — not zero, not a placeholder.
- **Prose over bullets in repo docs.** Bullets in specs are fine;
  agent-facing prose reads better in paragraphs.
- **Docs discipline:** only README.md, CLAUDE.md, and CONTRIBUTING.md
  in the repo root. Any other documentation goes in the admin-only
  Documents section (spec §16) once it exists.

## Phase 1 vs Phase 2+

**Phase 1 (what we're building):** public surfaces, card system, herd,
gallery, compare placeholder, admin authentication via WebAuthn
passkeys, inline-edit, four-tier RBAC, inquiries inbox, documents,
review/pending-tags/upload-issues queues, iOS Shortcut photo pipeline
with throne mechanics and staleness nudges.

**Phase 2+ (deferred, per spec §24):** timeline/gallery/editorial/beauty
rubrics, ML classification, HEIC→WebP server pipeline, EXIF strip, full
compare build, dark-mode UI, filter-aware OG composites, Media and
Calendar admin surfaces, Android upload, richer PWA features, tooltip
and documents content passes.

If something feels needed but is on the Phase 2 list, escalate to Matt
rather than pulling it forward.

## Ribbon system

Ribbons are ceremonial. They do not change by theme, mode, or filter.
All ribbon text uses **px units, not rem** — iOS text scaling will
break a rem-based graphic. Full ribbon rules in spec §19.

## Branch and commit discipline

- Development happens on `v2-phase-1` until Phase 1 is launch-ready,
  then cutover promotes it to `main` (wiping the current v1 `main`).
- Commit frequently with descriptive messages. Push after each logical
  unit of work.
- Never push to `main` without explicit approval.
- Never force-push `v2-rebuild` or any other reference branch.

## When ambiguous

Ask Matt. He's direct, he dictates by voice, and he reads technical
tradeoffs as product/user consequences. Say "I don't know" when you
don't. Cite sources when making claims about industry convention.
