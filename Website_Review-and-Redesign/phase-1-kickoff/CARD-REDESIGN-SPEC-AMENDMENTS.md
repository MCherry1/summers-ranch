# Card Redesign Spec — Amendments Log

*Running log of decisions made after `CARD-REDESIGN-SPEC.md` was committed on 2026-04-17. Will be folded into the main spec as a batch after the remaining workshops complete. Until then, this file is the source of truth for any decision that contradicts the main spec.*

*Last updated: 2026-04-17*

---

## Amendments locked (superseding the main spec)

### A1. Flip animation scrapped — slide only

**Supersedes:** Section 2 "The back of the card is not card-shaped" still holds, but Section 5.6 "Flip animation details" is replaced entirely.

**What changes:**

The card flip animation (3D rotateY with backface-visibility) is removed from the spec entirely. The card front and back are transitioned via **horizontal slide** only.

**Reasoning:**

The front of the card is page-fill (roughly screen-shaped, photo-dominant). The back is a long-scroll document. A flip implies two symmetric faces of a rigid object; we have a short presentation and a long document, which the flip metaphor misrepresents. A flip to a long scroll would reveal content already falling off the bottom of the screen mid-animation, which is visually broken.

The baseball-card metaphor is preserved in the softer sense — front-and-back as distinct sides of one animal's presentation, binder-organized herd, corner ribbons, restrained visual vocabulary. What's scrapped is specifically the 3D rotate animation. The gimmickier expressions of the metaphor move to the Phase 2+ Media Generation module, where physical printed baseball cards *will* be explicitly gimmicky in a way that suits the handout context.

**New behavior (replaces Section 5.6):**

- Horizontal slide transition between front and back
- On swipe left: front slides off-screen to the left, back slides in from the right
- On swipe right (from back): back slides off to the right, front slides in from the left
- On button tap (Details › or × close): same slide animation, played through without finger tracking
- Interactive tracking during swipe: card tracks finger proportionally (50% drag = half-offscreen)
- Commit thresholds: 50% of viewport width dragged OR release velocity > 500 px/s → commits to the transition
- Below thresholds → spring back to original face
- Animation duration: ~250-300ms ease-out on commit or spring-back
- `prefers-reduced-motion`: instant swap, no slide animation
- 20px dead zone at screen edges to respect OS back-gestures

**No more three-tier implementation priority.** The slide is the production default; there is no "aspirational flip tier 2." Flip is removed from scope.

---

### A2. AHA distinction auto-detection scrapped — manual checkbox permanent

**Supersedes:** The deferred-spec item I proposed (automated DOD/SOD detection via hereford.org scraping).

**What changes:**

Automated distinction detection is removed from the roadmap. The manual admin checkbox (§3.4 tooltip copy plus §14.1 `distinctionBadges` data model) is the permanent mechanism.

**Reasoning:**

- Marty is trustworthy and happy to check a box
- The field is set-once; no polling needed
- AHA doesn't publish an API; scraping is fragile infrastructure for minor value
- The manual checkbox with tooltip educational content already serves the aspirational purpose (nudging Marty toward AHA engagement)

**Result:** Section 14.1 stays as-is. Section 20's deferred list does NOT gain an auto-detect item.

---

### A3. No watermarks on card photos

**Supersedes:** New decision, not a change to the spec (spec did not commit either way).

**What changes:**

Explicit decision: no watermarks applied to any card-displayed photos or gallery images.

**Reasoning:**

- Serious seedstock operations display clean, unmarked images
- Watermarks compete for attention with the photo content
- Sharing (screenshots to spouses, business partners) is desirable buyer behavior
- Any externally-shared media will include a site URL, which is better attribution than a watermark
- Watermark infrastructure is avoidable complexity

**Result:** Nothing changes in the main spec. This is a standing decision not to add watermarks.

---

### A4. Media Generation module added to deferred spec (Phase 2+)

**Supersedes:** Section 20 (Deferred for future specification) gains a new Phase 2+ item.

**What changes:**

Add to Section 20 under Phase 2+ features:

> **Media Generation module (Phase 2+)** — admin-only surface that generates printable/shareable materials from herd data. Content types include: printed baseball cards (2.5" × 3.5" trading card stock with QR code linking to `/herd/[animalId]`), brochures (multi-animal sale sheets), flyers (single-animal promotional), index-card handouts (minimal info cards for conversation starters at shows). Admin selects animals (e.g., filtering to "all currently for-sale animals"), selects output format, module generates downloadable print-ready files. Hardening is minimal since output is admin-facing. Optional future convenience: direct hyperlinking to common print-on-demand services Marty or Matt uses. QR codes on physical materials drive recipients to the live card.

**Related data-model note:** the existing `/herd/[animalId]` URL pattern is already QR-friendly (short, URL-safe). No schema changes needed for this feature.

---

### A5. MediaAsset schema gains orientation fields

**Supersedes:** Section 14.2 (MediaAsset schema additions).

**What changes:**

Add two fields to `MediaAsset`:

```typescript
interface MediaAsset {
  // ... existing fields from Section 14.2
  orientation: 'landscape' | 'portrait' | 'square'  // Derived from dimensions at ingest
  aspectRatio: number  // width/height, derived at ingest
}
```

**Reasoning:**

iPhone photos come in either portrait or landscape (4:3 aspect ratio). Different surfaces of the site want different orientations — hero slots need landscape, card fronts accommodate any orientation, gallery Wall supporting slots prefer variety. The curation engine needs to filter and prefer by orientation, which requires it to exist as structured data.

Both fields are computed at ingest time from image dimensions — no AI classification needed, no user input required.

---

### A6. Hero slots require landscape orientation

**Supersedes:** Section 8.2 (Slot roles) and Section 8.5 (Coverage nudges for the Wall).

**What changes:**

Add to Section 8.2:

> Hero slots require photos with `orientation: landscape`. Other slots (secondary, supporting) accept any orientation. Mobile adaptation (§8.8) may accept landscape hero shots rendered differently on vertical layouts.

Add to Section 8.5:

> Coverage nudges for hero slots check orientation eligibility. A coverage nudge fires when no photos exist that match the required category AND season AND `orientation: landscape`.

---

### A7. Card front handles three orientation cases distinctly

**Supersedes:** Section 3.1 (Core contents) and Section 3.5 (photo selection logic).

**What changes:**

Add to Section 3.1, after the cycling-photo bullet:

> Photo display handles orientation cases distinctly:
> - **Portrait photos** fill the card naturally
> - **Landscape photos** display at actual aspect ratio, centered, with the remaining vertical space filled by a subtle blurred version of the same photo (the common iOS/Instagram treatment)
> - **Square photos** centered, same blurred-fill treatment as landscape
> - Never aggressively crop to fill — cropping can hide the animal's conformation features

---

### A8. Phase 2 media pipeline requirements named explicitly

**Supersedes:** Section 20 (Deferred) — the Phase 2 "Media pipeline (Cloudflare Workers receiving iPhone Shortcut uploads)" line gets expanded.

**What changes:**

In Section 20's Phase 2 list, replace the bare "Media pipeline" line with:

> Media pipeline (Cloudflare Workers receiving iPhone Shortcut uploads). Requirements:
> - HEIC → JPEG conversion (iPhone default capture format; some browsers can't display HEIC)
> - WebP + AVIF output generation with JPEG fallback (modern efficient formats)
> - EXIF orientation tag respect (prevent 90° rotation bugs)
> - GPS metadata stripping (already committed in §12)
> - Multiple-size generation at ingest (thumbnail, card-display, full-size)
> - Video HEVC → H.264 transcoding (when video support added in any form)

---

### A9. Phase 1 placeholder media must include mixed orientations

**Supersedes:** Section 21.5 (Build order for Phase 1) and Section 21 implicitly.

**What changes:**

Add to the Foundation (Checkpoint 1) requirements:

> Placeholder images used during Phase 1 development must include a representative mix:
> - At least one landscape hero candidate
> - At least one portrait cattle photo
> - At least one landscape cattle photo
> - At least one square-ish photo
> - Multiple resolutions (high-res and mid-res)
>
> This ensures the responsive rendering, Wall composition, and card photo-handling code are all exercised during development rather than discovered when Marty uploads his first real photo.

---

### A10. Herd cards are static forever — no motion on the evaluation surface

**Supersedes:** Section 3.2 (Photo cycling behavior) is extended, not replaced.

**What changes:**

Add to Section 3.2:

> **Cards do not display video, animated images, or motion of any kind.** The front of a card cycles between still photos with a crossfade; this is the only motion on the card surface. Cattle evaluation is a still-photo activity — buyers assess conformation from posed stills, which is how shows, catalogs, and AHA registration all present animals. A moving cow is harder to evaluate than a static side-profile shot.
>
> This is a permanent design decision, not a Phase 1 limitation. Even in Phase 2+ when the media pipeline handles iPhone Live Photos, the video components of those captures are **never** displayed on cards. They are preserved in storage for potential use on atmospheric surfaces only (see A11).

**Reasoning:**

- Industry convention is stills for evaluation
- Motion on cards adds file size (10-30x) with negligible buyer value and potential negative (distraction from conformation review)
- Autoplay is finicky on mobile; older devices may struggle
- Matt's explicit call: "paying a lot to serve motion with, at best, minor increase in value"

---

### A11. Atmospheric surfaces are motion-eligible (Phase 2+) with deliberate enablement

**Supersedes:** Section 9.1 (Home page Structure) and Section 8 (Gallery / The Wall).

**What changes:**

Add to Section 9.1 as a new paragraph under "Above the fold":

> The full-viewport hero image may be still or motion depending on what's available and what the Phase 2+ workshop decides. Atmospheric video is eligible here. See A11 in the amendments file for details on when motion is acceptable.

Add as a new subsection §8.10 to Section 8 (The Wall):

> **§8.10 Motion eligibility**
>
> Wall slots (hero, secondary, supporting) may display short looping video clips *in addition to* stills, as of Phase 2+. This is the only public surface besides the Home page hero where motion is permitted. The herd card surface (§3) is permanently static.
>
> Motion guidelines for Wall slots:
> - Clip length: 2-5 seconds, looping seamlessly
> - Muted, autoplay (with graceful fallback when autoplay is blocked — display the static poster frame)
> - Respect `prefers-reduced-motion` — static poster frame only
> - Format: MP4 (H.264) as baseline, WebM as progressive enhancement
> - Poster frame is the still component of the source (typically the iPhone Live Photo still); this is what displays if video doesn't load or the user has reduced-motion preferences
>
> Motion content prioritization in Wall curation:
> - A slot may be filled with either still or motion content; the curation engine treats them as candidates in the same pool
> - Seasonal affinity and category rules apply equally to both
> - A small bias toward stills (to avoid the Wall feeling like a video collage) — roughly 1-2 motion clips in a 9-13 item Wall
>
> **Phase 2 enablement is a deliberate decision, not automatic.** When the pipeline is ready to surface motion, Matt makes a specific decision to enable it per-surface (Home hero, Wall). Default before that decision is still-only. If motion is deemed not-worth-it, it stays off indefinitely; the pipeline still preserves the MOV components (see A12) at zero cost.

Add a related note to Section 9.1:

> The Home hero can also use the **Ken Burns effect** — a slow zoom/pan applied to a still image to create atmospheric motion without actual video. This is much cheaper than video and often indistinguishable at typical viewing. Ken Burns may be used on still images in the hero slot regardless of the motion decision. Ken Burns and real video can coexist on the same slot or be layered for enhanced effect (e.g., a gentle zoom applied to an already-moving clip).

**Reasoning:**

- Motion on atmospheric surfaces is genuinely additive: wind in grass, cattle crossing pasture at sunset, Theodore playing
- These surfaces don't carry the evaluation accuracy burden that cards do
- Ken Burns gives 80% of the perceived-motion value at 0% of the video-pipeline cost, so we get "atmospheric motion" even in Phase 1 purely from still images
- Real video in Phase 2+ is a nice enhancement, not a requirement
- Deliberate enablement means we don't accidentally ship distracting video just because the pipeline supports it

---

### A12. Phase 2 media pipeline preserves iPhone Live Photo MOV components

**Supersedes:** Section 20 (Deferred) — extends A8 (Phase 2 media pipeline requirements).

**What changes:**

Add to Section 20's Phase 2 media pipeline requirements (extending the list from A8):

> - **iPhone Live Photo handling:** when a Live Photo is uploaded, ingest preserves both the HEIC still and the MOV motion components. The still becomes the card-eligible image; the MOV is transcoded to MP4/WebM and stored alongside for potential use on atmospheric surfaces. Neither component is discarded at ingest.

**Reasoning:**

- Storage cost is negligible (~50-300MB annually for Marty's upload volume)
- Preservation is reversible (we can decide later whether to use motion)
- Discarding is not reversible (once lost, capture data is gone)
- Matt's framing: "storage is cheap and it leaves us flexible"

**Implication for iOS Shortcut configuration (Phase 2 spec):**

The iOS Shortcut must send both the HEIC and the MOV to the Worker endpoint. Standard iOS Shortcut actions support this — the share sheet exposes the Live Photo container as a multi-component object. When designing the Shortcut, the "send to server" step must encode both components, not just the still.

This is a sub-detail for the future Share Sheet Mechanics workshop (P4), noted here so it's not forgotten.

---

### A13. v2 replaces v1 entirely at cutover; standard Astro layout at root

**Supersedes:** Section 21.1 (Branch strategy) is extended.

**What changes:**

At v2 cutover, the repository root adopts the standard Astro project layout:

```
/
├── src/
├── public/
├── data/
├── docs/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── CLAUDE.md
├── LICENSE.md
├── COPYRIGHT.md
├── README.md
├── CNAME
├── .github/
└── .gitignore
```

All v1 files (HTML files, root JSONs, old `js/` and `spec/` directories, old `images/` structure) are deleted from the working tree. v1 history is preserved in git only.

**Reasoning:** standard Astro layout matches developer and agent expectations; no subdirectory navigation overhead; v1 remains accessible via git history if ever needed.

---

### A14. Media folder structure: `{tag}-{slug}/` with animalId as the stable identity

**Supersedes:** Nothing in the main spec directly; establishes new structural convention.

**What changes:**

**Phase 1 placeholder images** live under:

```
public/images/cattle/{tag}-{name-slug}/
public/images/cattle/{tag}/              (unnamed animals)
public/images/ranch/                      (landscape, gallery, atmospheric)
public/images/people/                     (family, ranch hands)
public/images/theodore/                   (Junior Ranch Hand shots)
```

Examples:
- `public/images/cattle/801-big-red/`
- `public/images/cattle/812/`
- `public/images/cattle/840-sweetheart/`

**Slug rules:** lowercase, hyphens for spaces, special characters stripped. "Sweetheart Jr." becomes `sweetheart-jr`.

**Phase 2 production media (R2 object keys)** uses the stable animalId instead of the tag-name folder:

```
cattle/{animalId}/photo-{timestamp}.{ext}
ranch/{category}/photo-{timestamp}.{ext}
people/{slug}/photo-{timestamp}.{ext}
```

**Critical requirement for coding agent:** photo paths are NEVER hardcoded in component code. Photo lookup ALWAYS resolves via `animalId` → path mapping computed at build time (for Phase 1) or runtime (for Phase 2 R2). When an animal is retagged, renaming the folder with `git mv` requires zero code changes.

**Reasoning:** human-readable for navigation; stable identity for code; retag operations are folder-rename-only, not migration-events.

---

### A15. Copy organization: hybrid single-file per short page, folder-with-sections per long page

**Supersedes:** Section 18.1 (Page copy).

**What changes:**

User-facing text lives in `src/content/`, organized by page. Short pages get a single Markdown file; long pages (>~400 words or multiple distinct sections) get a folder with one file per section.

**Concrete structure:**

```
src/content/
├── home/                    (long: hero, welcome, theodore-moment, footer-cta)
│   ├── hero.md
│   ├── welcome.md
│   ├── theodore-moment.md
│   └── footer-cta.md
├── about/                   (long: intro, family-story, ranch-history, marty, roianne, theodore)
│   ├── intro.md
│   ├── family-story.md
│   ├── ranch-history.md
│   ├── marty.md
│   ├── roianne.md
│   └── theodore.md
├── contact.md               (short: form header, contact info)
├── gallery.md               (short: intro text, if any)
├── privacy.md               (long: potentially; single file if under threshold)
├── terms.md
├── navigation.md            (menu labels)
├── footer.md                (copyright, tagline)
├── tooltips/                (one file per admin field tooltip)
│   ├── weaning-weight.md
│   ├── birth-weight.md
│   ├── scrotal-circumference.md
│   └── ... etc
└── nudge-templates/         (one file per nudge message template)
    ├── stale-photo-for-sale.md
    ├── missing-birth-weight.md
    └── ... etc
```

Astro Content Collections natively handles this pattern — Markdown files are the source of truth, components import and render at build time.

**Reasoning:** Matt can open any file directly to edit copy. Tooltips and nudge templates are individually editable without diving into component code. Small pages don't get unnecessarily split.

---

### A16. `docs/` holds three authoritative documents only

**Supersedes:** Section 22 (Appendix: cross-reference to earlier handoff documents) is substantially revised.

**What changes:**

At v2 cutover, the `docs/` directory contains exactly three Markdown files:

- `docs/CARD-REDESIGN-SPEC.md` — authoritative product + technical spec (this document, post-amendment consolidation)
- `docs/HOW-TO-CHANGE-THINGS.md` — plain-language guide for Matt, pulled from Section 18 of the main spec
- `docs/DESIGN-HISTORY.md` — single narrative document written once at cutover, telling the story of how the v1 brochure site evolved through design rounds into v2. Reference material for future humans or agents who want context. Clearly labeled as historical narrative, not active spec.

**All other historical documents** from `Website_Review-and-Redesign/` (`PROJECT-SYNOPSIS-AND-HISTORY.md`, `RECOMMENDED-ARCHITECTURE.md`, `BEHAVIOR-PRESERVATION-CHECKLIST.md`, `PHASE-1-IMPLEMENTATION.md`, all appendix documents, this amendments file once folded in) are **deleted from the working tree** at cutover. They remain accessible in git history for anyone who wants them.

**Reasoning:** agents reading the repo should find exactly one authoritative spec. Ambiguity about which document is current creates the confusion risk Matt flagged. Git history preserves everything without cluttering the working tree.

**CLAUDE.md stays at repo root** (Claude Code reads it from root by default). It points at `docs/CARD-REDESIGN-SPEC.md` as the authoritative spec.

---

### A17. `data/` flat for Phase 1; split to seed/production for Phase 2

**Supersedes:** Nothing in the main spec directly.

**What changes:**

**Phase 1 structure:**

```
data/
├── animals.json
├── media.json
├── links.json
└── site-config.json
```

**Phase 2 structure (when admin write paths and R2 come online):**

```
data/
├── seed/                    (test fixtures for development)
│   ├── animals.json
│   ├── media.json
│   └── links.json
└── production/              (or moves to a DB; TBD at Phase 2 design time)
    └── (live data, possibly Cloudflare KV or D1 instead of files)
```

**Reasoning:** Phase 1 is simple; Phase 2 needs clear separation so test data doesn't pollute live records. The Phase 2 structure may evolve if production moves to a database rather than files (KV or D1) — spec the split conceptually, let Phase 2 design fill in specifics.

---

### A18. CLAUDE.md at repo root: ~100-200 line agent orientation

**Supersedes:** Section 21.4 (CLAUDE.md at repo root) expanded.

**What changes:**

At v2 cutover, `CLAUDE.md` at repo root is rewritten from scratch to contain:

- One-paragraph project description (what the site is, who it's for)
- Tech stack summary (Astro 5+, TypeScript strict, Zod, Cloudflare Pages/R2/Workers)
- Authoritative spec pointer: "For all product and technical decisions, see `docs/CARD-REDESIGN-SPEC.md`"
- Branch conventions (main = production live; feature branches for all work; PRs before merge)
- Directory structure pointer (where things live — short version)
- Agent guidelines:
  - Do not commit directly to main without PR review
  - Respect the architecture; ask Matt for product decisions
  - Use feature branches for all work
  - Update `docs/CARD-REDESIGN-SPEC.md` only as directed, never silently
  - Never hardcode animal folder paths; always resolve via animalId
  - Never discard Live Photo MOV components in Phase 2 ingest
- Matt's GitHub handle as primary contact

Length target: ~100-200 lines. Anything deeper lives in `docs/`.

**No `scripts/` directory is pre-created** (Q7). The coding agent may create it when a utility script is first needed.

---

### A19. Cutover deletion list

**Supersedes:** Section 21.3 (What to delete entirely) expanded.

**What changes:**

At v2 cutover, the coding agent deletes from the working tree:

- **All v1 HTML files:** `index.html`, `about.html`, `cattle.html`, `contact.html`, `gallery.html`, `admin.html`, `admin-setup.html`, `roadmap.html`, `index-v2.html`, any other `*.html` at root
- **Root JSON data files:** `site-config.json`, `cattle-data.json`, `ranch-calendar.json`, `admin-key.json`, anything else at root not tracked as Astro config
- **Old directories:** `js/`, `spec/`, any old `css/` or `styles/` at root level
- **Old images:** existing `images/` directory contents (to be rebuilt under `public/images/` with new structure per A14)
- **Website_Review-and-Redesign/ contents:** after extracting `CARD-REDESIGN-SPEC.md` and `HOW-TO-CHANGE-THINGS.md` to `docs/`, delete the rest from the working tree. Preserved in git history.
- **Old v2-rebuild branch:** not deleted from git (history), but no further commits on it; all future v2 work happens on a new branch

**Kept:**

- `CNAME` (domain configuration)
- `.github/` directory (workflows, if any worth preserving)
- `.gitignore` (update contents to match new structure, but keep the file)
- `package.json`, `package-lock.json` (updated as part of rebuild but not recreated from scratch)
- Anything under `node_modules/` is ignored by git anyway

---

### A20. LICENSE.md and COPYRIGHT.md drafted during repo cleanup commit

**Supersedes:** New addition, no prior coverage in main spec.

**What changes:**

Two new files added to repo root at cutover:

**`LICENSE.md`:** Two-license split.

- **Code** (everything under `src/`, `scripts/`, build config): Modified MIT-style license with commercial-use restriction. Grants:
  - Read, learn from, and non-commercially fork
  - Perpetual operational license to Summers Ranch (Marty and Matt's ranch operation)
  - Commercial use, redistribution, or derivative-work-based commercial products require written permission from Matt Cherry
- **Documentation, design specs, creative assets** (everything under `docs/`, `src/content/`, and design artifacts like the spec itself): Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). Summary: share and adapt for non-commercial purposes with attribution; derivatives must be shared under the same license.

**`COPYRIGHT.md`:** Short authorship declaration.

- Matt Cherry as primary author of product design, spec, and code architecture
- Transparent disclosure that AI assistance (Claude, via Anthropic's consumer interface) was used during design conversations and implementation. Human creative direction and curation establish the work as Matt's per current U.S. Copyright Office guidance.
- Date of first publication
- Points at LICENSE.md for usage terms
- Points at the git history as the authoritative record of authorship

**Reasoning:** Establishes clean IP footing before launch (per the earlier light-touch IP plan). Transparency about AI assistance aligns with current best practice in creative fields and the cattle industry's acceptance of AI-assisted tools.

**Both files drafted as part of the cutover commit, reviewed by Matt before merge.**

---

## Pending workshops (not yet locked)

These items are flagged for future workshopping. None of them block the current spec's Phase 1 build order.

### P1. Motion / video on cards — RESOLVED 2026-04-17

Resolved into amendments A10, A11, A12 (see below).

### P2. Repository layout — RESOLVED 2026-04-17

Resolved into amendments A13-A19 (see below).

### P3. Admin surface model

Matt has flagged the question: what does clicking "Admin" actually do? Is it a page, a mode, or both?

**Current thinking (not yet locked):**
- Likely both: `/admin` dashboard as landing, admin herd view as a mode of `/herd` with chrome
- Tension: the "Needs Attention" sort on admin herd view may make a separate dashboard redundant

**To be workshopped.**

### P4. Share sheet mechanics

Matt has flagged for workshop. Two distinct dimensions:

- **Outgoing:** social share previews (OpenGraph / Twitter cards) — what gets shared when someone taps their phone's share button on a herd card or page
- **Incoming:** iOS Shortcut photo upload pipeline from Marty's phone share sheet — how the share-sheet workflow sends photos into the Cloudflare Worker ingest

**To be workshopped. Incoming is more complex and more Phase 2; outgoing is simpler and may touch Phase 1.**

---

## IP plan (light-touch, per 2026-04-17 discussion)

Three concrete actions, in order of value:

1. **LICENSE.md and COPYRIGHT.md** to be drafted and committed during the repo-layout workshop. CC BY-NC-SA for docs/design, all-rights-reserved with Marty/Summers-Ranch perpetual operation license for code.
2. **Commit hygiene** — ensure all commits are attributed to Matt's real identity (already happening).
3. **Trademark filing** — "Summers Ranch" in the cattle/ranching USPTO class, filed post-launch once in commerce. $1,500-3,000 total with an attorney for filing.

Nothing beyond this is recommended until a specific scenario (someone reaches out, or Matt decides to commercialize) develops.

---

## How this file gets resolved

When all pending workshops (P1-P4) are locked and the amendments accumulated here reach a stable state:

1. I fold every amendment (A1-A9 plus whatever emerges from P1-P4) directly into `CARD-REDESIGN-SPEC.md` as edits to the relevant sections.
2. This amendments file gets deleted, or reduced to a single historical note saying "see git history for the amendment-consolidation commit."
3. The main spec file becomes the single source of truth again.

Until that consolidation happens, **this amendments file overrides the main spec** wherever they conflict. Coding agent and Matt both should check this file when questions arise.
