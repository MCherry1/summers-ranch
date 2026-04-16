# CLAUDE.md — Summers Ranch (v2-rebuild branch)

*You are on the `v2-rebuild` branch. The `main` branch still hosts the live
prototype at mrsummersranch.com and should not be touched during the rebuild.*

---

## What this branch is

A schema-first rebuild of the Summers Ranch website. The live prototype on
`main` works but its architecture — tag-as-primary-key cattle records, JSON
edited in-browser via GitHub API, GitHub Actions as a photo pipeline —
collapsed under the real-world calf lifecycle and has maintenance issues at
3,677 lines of hand-written JS. This branch replaces it with Astro +
TypeScript + Zod, Cloudflare Pages for hosting, Cloudflare R2 for media, and
Cloudflare Workers for processing (Phase 2).

The core architectural shift: **immutable `animalId` as the primary key**.
Every animal gets a UUID at birth. Tags (`displayTag`) can change over time
— calves share the dam's tag until weaning, then get their own — without any
data migration. `tagHistory[]` tracks prior tags. Photos link to animals by
`animalId` via `CattleMediaLink` records, so retagging, tag reuse, and
provisional calf tags all become non-events.

The site has not been shown to the ranch owner (Marty) yet. It's a surprise
gift from his son-in-law Matt. Don't put real owner data in seed files and
don't post to social channels.

---

## Authoritative documents

Read in this order when starting a new session:

1. `Website_Review-and-Redesign/README.md` — entry point
2. `Website_Review-and-Redesign/PROJECT-SYNOPSIS-AND-HISTORY.md` — context
3. `Website_Review-and-Redesign/RECOMMENDED-ARCHITECTURE.md` — stack + schemas
4. `Website_Review-and-Redesign/BEHAVIOR-PRESERVATION-CHECKLIST.md` — acceptance
5. `Website_Review-and-Redesign/PHASE-1-IMPLEMENTATION.md` — build steps
6. `Website_Review-and-Redesign/phase-1-kickoff/PHASE-1-KICKOFF-BRIEF.md` — locked decisions

The `spec/` folder holds `design-spec.md` (Modern Homestead aesthetic). It's
still relevant — the palette and typography carry over.

The `docs/` folder is **legacy v1 prototype material** — read-only reference
only. See `docs/README.md` for the full caveat. Do not follow its
instructions on this branch.

---

## Stack

- **Astro 4.x** — static site generator, zero JS by default, optional
  islands for interactivity
- **TypeScript strict** — `noImplicitAny`, `strictNullChecks`,
  `noUncheckedIndexedAccess`
- **Zod 3.x** — runtime schema validation for all data; TypeScript types
  inferred from schemas, never hand-written
- **No framework** (React/Svelte/Vue) in Phase 1. Interactivity uses vanilla
  TS in Astro client scripts. Ask before adding any dependency.

Path aliases: `@/*` → `src/*`, `@schemas` → `src/schemas/index.ts`,
`@lib/*` → `src/lib/*`.

---

## File layout (on this branch)

```
/
├── src/
│   ├── schemas/          # Zod schemas: animal, media, link, derived
│   ├── lib/
│   │   ├── data.ts       # Zod-validated seed loader (single source of truth)
│   │   ├── public-view.ts  # PublicAnimal/PublicMediaAsset — privacy at type level
│   │   ├── media-url.ts  # Phase 1 placeholder URL resolver
│   │   └── derive/       # pure fns: canonical views, ribbons, nudges, age
│   ├── components/       # home/, cattle/, layout/, ui/
│   ├── layouts/          # BaseLayout.astro
│   ├── pages/            # index, about, contact, gallery/, herd/
│   └── styles/           # tokens.css, global.css
├── data/seed/            # animals.json, media.json, links.json, id-reference.json
├── public/placeholders/  # generated SVG placeholders (Phase 1 only)
├── scripts/              # generate-placeholders.mjs
└── (legacy prototype files: *.html, admin-key.json, cattle-data.json,
    ranch-calendar.json, site-config.json, js/, images/, docs/, spec/)
```

**Legacy files at repo root** (`about.html`, `admin*.html`, `cattle.html`,
`contact.html`, `gallery.html`, `index.html`, `roadmap.html`, `js/`,
`images/`, `docs/`, `admin-key.json`, `cattle-data.json`,
`ranch-calendar.json`, `site-config.json`) are the v1 prototype. They do
not run on v2-rebuild. They get deleted at cutover, not during development.
Do not modify them and do not wire them into Astro's build.

---

## Core invariants

- **`animalId` is immutable.** Never rename, never reuse. Tags, names,
  status can all change; `animalId` never does.
- **Schemas are the source of truth.** TypeScript types come from
  `z.infer<typeof ...>`. Never hand-write a type that duplicates a schema.
- **Privacy is enforced at the type layer.** Pages import `PublicAnimal`,
  never `Animal`. The public type omits sale details, removal details,
  pregnancy internals, and EXIF/GPS. You literally cannot render a private
  field on a public page.
- **Better empty than wrong.** If a field is null, hide the row/section
  entirely. Do not render "—" or "Unnamed" or default to "Hereford"/"Breeding."
- **No emoji in UI copy.** Exceptions: the birthday hat affordance and
  "Junior Ranch Hand" for Theodore. Everything else uses SVG icons.
- **Build fails on bad data.** Every JSON is parsed through Zod at import
  time. If the seed drifts, `npm run build` fails with a path-qualified error.

---

## Current phase

**Phase 1 — public-facing site rendered from seed data, deployed to a
Cloudflare Pages preview.** No admin, no Workers, no R2, no live ingestion.

Checkpoints:
1. Scaffold + schemas + seed loading (commit `01aeb6b`) — done
2. BaseLayout + home page — in progress
3. Herd index (`/herd`)
4. Cattle detail (`/herd/[animalId]`) + tag redirect
5. About + Gallery + Contact + Cloudflare Pages preview

**Phase 2** is admin panel + R2 + Workers + iOS Shortcut integration.
Don't build Phase 2 work on this branch yet.

---

## Working norms

- **Branch:** develop on `v2-rebuild`. Leave `main` alone.
- **Commits:** scoped, imperative subject, body explains "why."
- **Ask Matt (the user)** before: adding dependencies, deviating from the
  canonical schemas, changing visual tokens beyond what the design spec
  prescribes, deferring a BEHAVIOR-PRESERVATION-CHECKLIST item to Phase 2.
- **You can decide without asking:** Astro component organization, CSS
  strategy within scoped styles, internal naming, placeholder image
  tactics, test framework choice.
- **Marty is the end user.** iPhone-only for admin, prefers number keyboards,
  will see the site with fresh eyes. Small details (warmth, craftsmanship,
  no corporate-speak) matter.

---

## If you need help

`Website_Review-and-Redesign/phase-1-kickoff/PHASE-1-KICKOFF-BRIEF.md`
section 10 lists the things to ask Matt about. Section 11 defines
"Phase 1 complete." When in doubt, ask.
