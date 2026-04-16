# Phase 1 Kickoff Brief — for the Coding Agent

*You are the coding agent picking up the Summers Ranch rebuild. This document is your starting point.*

---

## 1. Read these first, in this order

Before touching any code, read:

1. `../README.md` — entry point
2. `../PROJECT-SYNOPSIS-AND-HISTORY.md` — context
3. `../RECOMMENDED-ARCHITECTURE.md` — authoritative technical direction
4. `../BEHAVIOR-PRESERVATION-CHECKLIST.md` — acceptance criteria
5. `../PHASE-1-IMPLEMENTATION.md` — step-by-step build plan

Then this document. It fills in the gaps and locks the decisions the user (Matt) has already made.

---

## 2. Locked decisions (don't re-ask)

These were discussed and confirmed with Matt at handoff. Do not re-litigate.

| Decision | Choice |
|---|---|
| Repo | Same repo (`summers-ranch`), new branch `v2-rebuild` |
| Branch behavior | Completely different file structure on `v2-rebuild` vs `main` is expected. `main` stays untouched during rebuild. |
| Legacy cleanup | Old prototype files get deleted at cutover, not during development. Git history preserves v1 if ever needed. |
| Hosting | Cloudflare Pages for public site, Cloudflare R2 for media (Phase 2), Cloudflare Workers for processing (Phase 2). GitHub Pages continues hosting the live prototype at `mrsummersranch.com` until cutover. |
| Domain cutover | Not until v2 is production-ready. Use Cloudflare's preview URLs during development. |
| Admin password at launch | Same as current admin. |
| Launch target | Soft ~30-day target, no hard deadline. Don't cut corners. |
| Seed data | Provided in this folder. Use as-is. |

---

## 3. What Matt (the user) is responsible for

- **Cloudflare account** — Matt is setting this up on his end. He does not need to have created any Pages projects or R2 buckets — those happen together with you during development, so names match what the code expects. Ask him to confirm the account is ready before you try to deploy the first preview.
- **Cloudflare Pages connection** — when it's time, he'll authorize the OAuth connection between his Cloudflare dashboard and the GitHub repo. Walk him through it.
- **GitHub PAT** — already in place. If it expires, he knows how to regenerate.
- **Product and UX direction** — he has strong opinions about UX, will defer on technical architecture. Explain stack choices as you go.

---

## 4. What you're responsible for in Phase 1

Phase 1 = public-facing site rendered from seed data, deployed to a Cloudflare Pages preview URL. No admin panel, no live photo pipeline, no R2, no Workers.

Build order (from `PHASE-1-IMPLEMENTATION.md`, paraphrased and locked):

1. **Scaffold** on branch `v2-rebuild`. Astro 4.x, TypeScript strict, Zod.
2. **Design tokens + base layout** — port the Modern Homestead palette and typography from the existing prototype. See section 6 below for exact values.
3. **Zod schemas** for `Animal`, `MediaAsset`, `CattleMediaLink`, and derived types. Types inferred from schemas, not written separately. All data loading validates through Zod at build time.
4. **Load seed data** from the three JSON files in this folder (see section 5). Build fails if validation fails.
5. **Derivation library** — pure functions that compute canonical views, ribbons, age, nudges from raw data.
6. **Home page** first (simplest, proves the layout).
7. **Herd index** (`/herd`) — most important public page.
8. **Cattle detail** (`/herd/[animalId]`) — progressive disclosure, timeline, featured shots.
9. **Tag redirect** (`/herd/tag/[tag]`) — 301 to canonical URL using `tagHistory` lookup.
10. **About, Gallery, Contact** — port content from existing site.
11. **Deploy to Cloudflare Pages** preview.

Do **not** build in Phase 1: admin panel, Worker endpoints, R2 integration, live iPhone upload path, real data ingestion, buyer accounts, commerce.

---

## 5. Seed data — use these files

Three files in this folder, ready to drop into `data/seed/` in the new Astro project:

- **`seed-animals.json`** — 11 animals: 1 bull, 1 open heifer ready for breeding, 3 dams with 1/2/3 calves each, 6 calves. Every placeholder obviously named (`Placeholder Bull A`, `Placeholder Cow C`, etc.). Calves are unnamed (realistic).
- **`seed-media.json`** — 25 media assets covering side/head/three-quarter canonical views for most animals, with intentional gaps to exercise missing-view nudges.
- **`seed-links.json`** — CattleMediaLink records wiring animals to media.
- **`seed-animal-id-reference.json`** — human-readable map from placeholder key (e.g., `dam_b_830`) to the actual UUID, for debugging and if you need to reference specific animals in tests.

### What the seed exercises (use this as a test checklist)

| Behavior | Animal that exercises it |
|---|---|
| Full adult with all performance data | Bull `801` |
| Open heifer, first-breeding ready, no weaning/yearling weights yet | Heifer `812` |
| Dam with exactly one nursing calf, provisional tag | Dam `820` + her calf |
| Dam with nursing twins, same provisional tag, qualifiers "twin A"/"twin B" | Dam `830` + twin calves |
| Dam with three in-herd offspring across two generations | Dam `840` (weaned yearling `841` + current-season twin calves on tag `840`) |
| Weaning retag (tag 840 → 841) with full `tagHistory` | Yearling `841` |
| Multiple-calves-same-dam nudge | Dams `830` and `840` |
| Provisional tag + card label "Calf of #830" | Any calf with `isProvisionalTag: true` |
| Missing canonical views (triggers nudges) | Heifer `812` (no three-quarter); Dam `830` (only side) |
| Older timeline photos to test chronological growth view | Bull `801`, Yearling `841` |
| Mixed-sex twins | Dam `830`'s calves |
| Photos with varying quality ratings | Yearling `841`'s older photos |
| Lineage display with `animalId`-based sire/dam references | Any calf (all sired by `801`) |

### Important notes about the seed

- **Placeholder image paths only.** All `originalKey` / `publicKey` / `cardKey` / `thumbKey` values reference `placeholders/…jpg` paths that don't exist yet. You need to either:
  - (a) Generate simple SVG placeholder images at those paths for visual development, OR
  - (b) Swap in a small set of permission-free stock photos of Herefords during development.
  - Decision is yours — whatever lets the pages actually render. These get replaced in Phase 2 when the real R2 pipeline comes online. Don't over-invest.
- **No real Marty data is in the seed.** Every name is an obvious placeholder. Every registration number starts with `P44000` (fictional). Every tattoo starts with `PLH` (placeholder).
- **Tag numbers are in the 800s.** Chosen to avoid any collision with real tag numbers the current prototype uses (100s–200s), so if anyone compares across versions there's no confusion.
- **Dates are authored against today = 2026-04-16.** Nursing calves are March 2026, weaned yearling is March 2025. Adjust if you build significantly later, but nothing else should need to change.

---

## 6. Design tokens — port exactly from the prototype

```css
:root {
  /* Palette */
  --color-earth: #4a3928;
  --color-saddle: #8b6914;
  --color-gold: #c8941e;
  --color-rust: #8a3921;
  --color-sage: #6b7f5e;
  --color-stone: #7a756f;
  --color-cream: #faf6ef;
  --color-linen: #ede5d3;
  --color-warm-white: #fffdf9;

  /* Typography */
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'Lato', sans-serif;
}
```

Full token set and layout spec in `../PHASE-1-IMPLEMENTATION.md` section "Design tokens and layouts."

---

## 7. Behavior checklist subset for Phase 1

The full checklist is in `../BEHAVIOR-PRESERVATION-CHECKLIST.md`. Phase 1 must land the following subset:

### Home page
- Hero image (placeholder OK in Phase 1)
- Family story excerpt with link to About
- Theodore mascot section with "Junior Ranch Hand" label (placeholder image OK)
- "The Herd" teaser with 3 random animals → `/herd`
- Navigation + footer with auto-year
- Mobile responsive

### Herd index (`/herd`)
- Grid of cards, one per `publicVisible: true` animal
- Each card: displayTag, name if present, status badge if set, breed if set, primary photo, age calculated from birthDate
- Primary status ribbon + secondary highlight ribbon
- Soft cycle through canonical views every 6s (desktop hover only, respects `prefers-reduced-motion`, static on mobile)
- Calves show "Calf of #830" style label when `isProvisionalTag: true`
- Filter tabs: All, For Sale, Breeding Stock, Calves, Reference
- Sort: tag, age, status
- Smart card cropping using `boundingBox` if present

### Cattle detail (`/herd/[animalId]`)
- Hero photo (canonical side if available, else best available)
- Featured Shots: side, head, three-quarter thumbnails when available (hidden when not)
- Basic info: tag, name, breed, sex, born, dam, sire (sire/dam rendered as links when `animalId` is set, plain text when only a display fallback)
- Expandable sections (only visible if populated): Performance, Temperament & Calving, Lineage, Acquisition (only if `showSourcePublicly`), Notes
- Growth timeline of all public media in chronological order with captured dates
- Lightbox on photo click
- "Inquire About This Animal" CTA only if `status === 'sale'`

### Tag redirect (`/herd/tag/[tag]`)
- Look up animalId by matching `displayTag` OR any entry in `tagHistory[].normalizedTag`
- 301 redirect to canonical `/herd/[animalId]`

### About, Gallery, Contact
- Port existing copy from current prototype (in `../../about.html`, `../../gallery.html`, `../../contact.html` on the `main` branch)
- Contact form points to Formspree ID `mzdybyjl`
- Gallery in Phase 1 can be a static placeholder page if no non-cattle media exists yet — note in a comment that this renders from `MediaAsset` records with `sourceKind: 'share-sheet-gallery'` once live data exists

### Accessibility + privacy floor
- Keyboard navigation works everywhere
- Alt text on all images
- `prefers-reduced-motion` respected
- Sale and removal details never rendered publicly, ever (enforce at the schema/selector layer, not just by not showing them)
- GPS never in page output
- `noindex` is NOT needed on public pages — don't add it by accident

---

## 8. Things not in the four core docs that you should know

**Current prototype URL structure to preserve for external links:** The current site uses `/cattle.html?tag=215` style URLs. Those don't need to redirect — it's a hard cutover at launch, no external inbound links matter since the site hasn't really been promoted. Don't spend time on legacy URL preservation beyond what's in `PHASE-1-IMPLEMENTATION.md`.

**Theodore:** Matt's son, the mascot. Born 2025-01-11. Appears on home + about as "Junior Ranch Hand." Treat him like a family photo placement — not a data entity.

**Calendar system:** Phase 1 does NOT need the full calendar/seasonal system. A static home-page banner is fine. The behavior-driven calendar detection is Phase 2+ (it needs admin + real data to be meaningful). If you have time and it feels natural, a read-only "Current season on the ranch" line driven by a simple hardcoded config is acceptable.

**"No emoji in UI copy"** means no emoji in headings, body copy, buttons, or labels. The birthday-hat emoji and the Junior Ranch Hand affordances are the named exceptions; everything else uses icons (SVG) or plain text.

**"Better empty than wrong"** is a strict rule. If a field is null, hide the row/section entirely — don't render "—" or "Not set" or "Unnamed." The detail page should feel like a custom artifact for each animal, with sections materializing as data populates.

---

## 9. How to hand work back to Matt

Matt reviews at natural milestones. Reasonable checkpoints:

1. **After scaffold + schemas + seed loading** — "the build runs, types check, data validates, but no pages yet." Matt confirms the foundation.
2. **After home + herd index renders** — Matt sees actual design. Expect UX feedback.
3. **After cattle detail page renders** — Matt sees progressive disclosure in action. Expect copy/field-order feedback.
4. **After all Phase 1 pages + Cloudflare preview** — Matt signs off on Phase 1.

Between checkpoints: commit often, keep commits scoped, write PR-style summaries when hitting a checkpoint.

---

## 10. Things to ask Matt about before committing

Per the core docs: ask before making architectural decisions not already approved. Below are decisions likely to come up that are **not yet approved** — check before proceeding:

1. Any deviation from the schemas in `RECOMMENDED-ARCHITECTURE.md`. If you find a case they don't cover, flag it, don't silently extend.
2. Adding new dependencies beyond Astro + Zod + @astrojs/check (and whatever Astro brings transitively).
3. Changes to the visual design tokens beyond what `PHASE-1-IMPLEMENTATION.md` prescribes.
4. Deferring any behavior checklist item to Phase 2 — list it, ask first.
5. Anything that affects the iPhone Shortcut workflow (Phase 2 concern but may come up during Worker endpoint design).

Things you can just decide:
- Astro component organization (where files go within `src/components/`)
- CSS strategy (scoped styles, utility classes, whatever's cleanest in Astro)
- Internal naming conventions
- Placeholder image strategy for Phase 1
- Test framework choice (if you decide to add one — not required for Phase 1)

---

## 11. Definition of "Phase 1 complete"

All of the following must be true:

- [ ] `v2-rebuild` branch exists with clean Astro scaffold
- [ ] `npm run build` succeeds with zero TypeScript errors, zero Zod validation errors
- [ ] All 11 seed animals render on `/herd` as cards
- [ ] All 11 cattle detail pages render at `/herd/[animalId]`
- [ ] Tag-based URL `/herd/tag/840` redirects to the canonical URL for dam `#840`
- [ ] Tag-based URL `/herd/tag/841` correctly resolves to the weaned-yearling animal (not the dam it used to share a tag with), via `tagHistory` lookup
- [ ] Home, About, Gallery, Contact pages render
- [ ] All acceptance criteria in section 7 above are met
- [ ] Lighthouse: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO
- [ ] Cloudflare Pages preview URL live and shared with Matt
- [ ] No regressions against the behavior checklist (Phase 1 subset)
- [ ] No emoji in UI copy (exceptions: birthday hat, junior ranch hand)

When all boxes are checked, write a short handoff note back to Matt summarizing what's done, what the preview URL is, and what Phase 2 will cover.

---

## 12. Bring-up checklist on your first session

1. Clone the repo (token is in project files)
2. Create and check out branch `v2-rebuild` off `main`
3. Read the five core docs (~45 minutes)
4. Read this document (~10 minutes)
5. Scaffold the Astro project at the root of `v2-rebuild` — existing `.html` files at root can stay; they won't interfere with Astro's build and they're getting deleted at cutover anyway
6. Drop the four seed JSONs into `data/seed/` as-is
7. Write Zod schemas, validate the seed loads clean
8. Commit. Confirm with Matt that this is the right starting point before continuing.

Go.
