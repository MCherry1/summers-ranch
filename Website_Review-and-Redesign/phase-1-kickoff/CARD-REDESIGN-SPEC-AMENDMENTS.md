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

### A21. Admin is its own URL space — public surfaces never change by login state

**Supersedes:** Section 6 (Admin mode differences) — the "same card with mode prop" concept is preserved, but the architecture around it is clarified.

**What changes:**

Admin is its own surface, not a transformation of the public site. Public surfaces (`/`, `/herd`, `/herd/[id]`, `/gallery`, `/about`, `/contact`) render identically regardless of whether any user is logged in as admin. Admin routes live under `/admin/*`:

- `/admin/` — Dashboard (login landing)
- `/admin/herd/` — admin herd view (same card component as `/herd/` with `mode="admin"`)
- `/admin/herd/[animalId]/` — admin front of card
- `/admin/herd/[animalId]/details/` — admin back of card with edit affordances
- `/admin/media/` — Media tab (Phase 2+)
- `/admin/calendar/` — Calendar tab (Phase 2+)
- `/admin/settings/` — admin settings (trusted device list, phone numbers, etc.)

**Design principle:** Marty can hand his phone to a buyer while logged in, and the buyer sees the public site. No hiding of admin state required; no UI transformation happens on public pages.

The card component still uses a `mode` prop — this doesn't change. What changes is that the mode is determined by the URL (`/admin/*` = admin mode; otherwise public mode), not by session state on public URLs.

**Admin button placement:** in the site footer, styled identically to other footer links (Privacy, Terms, Contact). Not half-opacity hidden text (the original site's mistake). Not page-bottom-fixed.

**Hamburger admin entry:** only appears when the user has a valid **known-device cookie** (see A22). Public visitors who have never logged in see the standard hamburger; first-time admin access is always via the footer. After a user's first successful login with "Remember me" checked, the hamburger gains an admin section on that device persistently, even after the session cookie expires.

**Hamburger states:**

*Logged out, never-logged-in device (or Remember-me never checked):*
```
Home
About
Herd
Gallery
Contact
```

*Known-device cookie present, session cookie expired:*
```
Home
About
Herd
Gallery
Contact
─────────────
Admin           (single entry — opens password modal)
```

*Known-device cookie present, session cookie valid (actively logged in):*
```
Home
About
Herd
Gallery
Contact
─────────────
Dashboard
Manage Herd
Media
Calendar
Settings
Log Out
```

**Admin-active indicator:** when the user has a valid session cookie (actively logged in), the hamburger icon itself displays a subtle dot/badge signaling admin-mode-active. Mostly a Matt-facing affordance for distinguishing admin sessions at a glance; Marty will likely ignore it.

**Login flow:** tapping the footer Admin link (or the hamburger Admin entry after session expiry) opens a **modal**, not a page. Password field with show/hide reveal button, Remember-me checkbox (unchecked by default), Submit button, × to dismiss. Current page stays rendered underneath. On successful login: modal dismisses, hamburger updates to full admin navigation, user stays on whatever page they were viewing. Marty can then navigate to `/admin/` via the Dashboard link.

**Password input behavior:**
- HTML5 `<input type="password">` for iOS Passwords / 1Password autofill support
- `autocomplete="current-password"` attribute
- Reveal button (eye icon) toggles display; hidden by default
- Paste allowed (password managers)

---

### A22. Auth mechanism: passwordless passkeys (WebAuthn) with biometric auth

**Supersedes:** Section 11.4 (Login page) is substantially revised. An earlier version of A22 proposing password-only auth is superseded by this one (see git history).

**What changes:**

Auth is **passwordless**, using WebAuthn passkeys with biometric authentication (Face ID, Touch ID, Windows Hello). No passwords exist anywhere in the system. This replaces the password-based approach previously proposed.

**Why passkeys, not passwords:**

- Marty's daily login becomes a Face ID glance — literally zero typing
- Cross-device via iCloud Keychain (Apple users) and 1Password or Microsoft sync (Windows users)
- Phishing-proof, credential-stuffing-proof, brute-force-proof — there is no credential to steal
- Face ID / Touch ID / Windows Hello IS the second factor by design (something you have = device, something you are = biometric)
- Genuinely more secure than password + TOTP, while simultaneously more usable

**Supported auth devices:**

- iPhone/iPad with Face ID or Touch ID (iOS 16+, any device from 2018+ qualifies; Marty's iPhone 12 is fully supported)
- Windows with Windows Hello (face, fingerprint, or PIN — any Windows 10+ machine)
- Macs with Touch ID or passkey via connected iPhone
- Any device with 1Password installed (1Password handles passkey storage and sync across all platforms, including Windows + iOS for users who don't want Apple ecosystem lock-in)

**Auth flow:**

*Initial setup of a user account* (admin provisioning, see A23):

1. Admin (Matt, or in future Marty if he's set up) generates a setup code for a new or existing user
2. Setup code is 8 alphanumeric characters, case-insensitive, one-time use, expires in 24 hours
3. Code delivered out-of-band (text, in-person, whatever works)

*First login on a device* (new user, or existing user adding a device):

1. User taps Admin link in footer
2. Modal appears: "Sign in" or "Set up this device"
3. Tap "Set up this device"
4. Modal prompts: select username from the admin list
5. User enters the 8-character setup code
6. Server validates code against pending setup for that user
7. Browser triggers WebAuthn registration ceremony (`navigator.credentials.create()`)
8. Device prompts for biometric (Face ID, Touch ID, Windows Hello)
9. On success: passkey created on device, public key and metadata stored in `admin-users.json` under that user's `registeredCredentials`
10. Session cookie set; user is logged in
11. Setup code consumed and discarded

*Subsequent logins on a previously-set-up device:*

1. User taps Admin link in footer (or Admin entry in hamburger if known-device cookie exists from prior session)
2. Browser triggers WebAuthn authentication ceremony (`navigator.credentials.get()`)
3. Device prompts for biometric
4. On success: server verifies signed challenge; session established
5. Logged in — typically 1-2 seconds total

*Adding a second device to an existing account:*

Two paths, both supported:

- **Self-serve from existing device:** logged-in user goes to Settings → "Add another device" → system generates a setup code → user opens the site on the new device and follows first-login flow
- **Admin-assisted:** owner (Matt) generates a setup code for the user from User Management → delivers out-of-band → user follows first-login flow

Cross-device passkey sync (e.g., iCloud Keychain on Apple devices) is a user-managed OS-level feature. When Marty sets up his iPhone, the passkey may automatically sync to his iPad via iCloud Keychain without needing a separate setup. When it does, the iPad works without additional registration. When it doesn't (e.g., iCloud Keychain disabled, or cross-ecosystem like Roianne's Windows + iOS), the user registers each device separately.

**Recovery mechanisms:**

*Primary recovery (user still has one working device):*
- User logs in on a working device
- Settings → "Add another device" to bring new device online
- Optional: remove old lost-device credential from the list

*Secondary recovery (user has lost all devices, but has recovery codes):*
- User holds 8 pre-generated one-time recovery codes, printed and stored securely
- At login, user selects "I've lost access to all my devices"
- Enters recovery code + proves identity (email or out-of-band verification with Matt)
- Can register a new passkey on a new device
- Recovery codes are regenerated; old ones discarded

*Ultimate backdoor (all recovery paths exhausted):*
- Matt logs into GitHub with his passkey
- Edits `data/admin-users.json` directly to remove the affected user's `registeredCredentials` entries
- Pushes change, Cloudflare rebuilds
- Affected user can now set up from scratch as if first-time, using a new setup code
- This backdoor is only accessible to users with GitHub passkey access (just Matt)

This three-tier recovery model covers every realistic failure case.

**Session management:**

- On successful passkey auth, session cookie set
- Session duration: 30 days if "Keep me signed in" toggle is checked during login, or session-only (expires on browser close) otherwise
- Known-device cookie (6 months) set when session is established with "Keep me signed in" — this drives whether hamburger shows the admin entry after session expiry (per A21)
- Session cookie: HTTP-only, Secure, SameSite=Strict
- "Log Out" in hamburger clears both session and known-device cookie for that device
- "Clear all trusted devices" in Settings → Security clears known-device cookies globally (forces footer re-entry on every device next time)

**Infrastructure:**

- Server-side WebAuthn via `@simplewebauthn/server` package running in Cloudflare Worker
- Client-side via standard browser `navigator.credentials` API; no library needed
- User records stored in `data/admin-users.json` in the repo (small file, low write frequency, fine to version-control)
- Setup codes stored in short-lived Cloudflare KV (24-hour TTL)
- Session tokens stored in Cloudflare KV keyed to the session cookie

**Critical implementation requirements for the coding agent:**

- Follow WebAuthn Level 3 spec (current standard)
- Relying Party ID should be `mrsummersranch.com` (or whatever primary domain)
- Require platform authenticators (user's device) or cross-platform authenticators (security keys, 1Password) — accept both
- Use resident credentials (passkeys proper), not merely WebAuthn credentials, so the user doesn't have to type a username during login
- Counter validation for replay protection
- Set `userVerification: "required"` — always require biometric/PIN on login, not just device presence

**Login event notifications** (unchanged from previous A22 draft):

- To `security@mrsummersranch.com` → Matt's personal email
- Triggers: novel IP login, country change, 5+ failed setup code attempts in 10 minutes, new passkey registered, passkey removed, "Clear all trusted devices" invoked
- Never sent to Marty (he's not the security monitor)

---

### A23. Admin user management and initial provisioning

**Supersedes:** New addition, no prior coverage.

**What changes:**

Admin users are defined in `data/admin-users.json`, version-controlled in the repo. The schema:

```typescript
interface AdminUser {
  id: string              // short username, e.g., "matt", "marty", "roianne"
  displayName: string     // human-readable name
  email: string           // for recovery and notifications; not used for login
  role: 'owner' | 'admin' // owner can manage other admin users; admin cannot
  registeredCredentials: RegisteredCredential[]
  recoveryCodesHash: string[]  // hashed recovery codes, one-time use
  createdAt: string       // ISO date
}

interface RegisteredCredential {
  credentialId: string    // WebAuthn credential ID
  publicKey: string       // Base64-encoded public key
  counter: number         // Anti-replay counter
  deviceName: string      // User-supplied or auto-detected ("iPhone 14", "Windows PC")
  createdAt: string
  lastUsedAt: string
  transports: string[]    // ["internal", "hybrid", "usb", etc.]
}
```

**Adding a new admin user (owner-only action):**

Navigate to Settings → User Management → Add Admin. Fill in: displayName, id (username), email, role. Save.

System generates:
- A setup code (random 8 alphanumeric, 24-hour TTL)
- 10 pre-generated recovery codes for the user (stored hashed server-side; plaintext shown once to the owner)

Owner delivers setup code to the new user out-of-band. Owner is responsible for securely delivering the recovery codes to the new user (printed, sent via secure channel, etc.) — the system shows them once and never stores them plaintext.

**Modifying an admin user:**

Owner can change any field except `registeredCredentials` (which is managed by the user via their own device management). Owner can revoke a user's access by removing all their credentials, which forces them to re-register via a new setup code.

**Removing an admin user:**

Owner can delete the user record. Next time that user tries to authenticate, no account exists — auth fails at the username-selection step.

**Self-service for non-owner admins:**

An admin (role: `admin`, not `owner`) can:
- View their own registered credentials
- Add new devices (self-generated setup codes)
- Remove devices they no longer use
- Regenerate their own recovery codes
- Log out globally

An admin cannot: add/remove/edit other admin users, change their own role.

**Default users at v2 cutover:**

- `matt` (Matt Cherry) — role: owner. Matt sets up his passkey first on his primary device.
- `marty` (Marty Summers) — role: admin. Matt generates a setup code, sends to Marty, Marty registers his iPhone and iPad.
- `roianne` (Roianne Summers) — role: admin. Matt generates a setup code, sends to Roianne, Roianne registers her Windows machine and iPhone separately.

Additional users added over time as needed.

**Recovery documentation:**

A file `docs/SECURITY-RECOVERY.md` (written during v2 cutover) documents:
- How to use a recovery code
- How to add a new device after total device loss
- How Matt can use the GitHub backdoor if all recovery paths fail
- How to revoke a compromised device

This document is Matt-facing and agent-facing, not user-facing. Marty and Roianne don't need to read it; if they ever need recovery help, they contact Matt.

---

### A24. Inquiries inbox built into admin; Formspree scrapped

**Supersedes:** Section 4.7 (Inquire CTA) and Section 10.2 (Contact) are extended; the Formspree dependency is removed.

**What changes:**

Contact form submissions no longer flow through Formspree. A **Cloudflare Worker** handles form submissions directly, writing inquiries to a structured data store and dispatching notifications per each admin user's preferences.

A new admin surface is added as a **Phase 1 deliverable**: the **Inquiries Inbox** at `/admin/inquiries/`.

**Rationale for keeping in Phase 1:** public contact forms exist in Phase 1 (general Contact page + Ask-About-This-Animal modal on for-sale cards), which means inquiries start arriving immediately after launch. They need somewhere to go. The inbox is small enough to build as part of Phase 1 without significantly expanding scope.

**Form submission paths (unchanged on public side):**

- `/contact` page — general contact form. Fields: name, email, phone (optional), subject, message.
- Ask-About-This-Animal modal on for-sale animal cards. Fields: name, email, phone (optional), message, with `animalId` and `animalTag` auto-attached.

Both submit to the same Worker endpoint. Worker normalizes and stores them in the same inquiries data store. All buyer inquiries, general or animal-specific, land in the same shared inbox.

**Inquiry data model:**

```typescript
interface Inquiry {
  inquiryId: string           // UUID
  createdAt: string           // ISO timestamp
  source: 'contact-form' | 'ask-about-animal'
  animalId: string | null     // Set when from ask-about-animal modal
  animalTag: string | null    // Snapshot at submission time for historical reference
  senderName: string
  senderEmail: string
  senderPhone: string | null
  subject: string | null      // Present on general contact form, absent on animal modal
  message: string
  status: 'new' | 'in-progress' | 'responded' | 'archived'
  assignedTo: string | null   // AdminUser.id
  respondedBy: string | null  // AdminUser.id
  respondedAt: string | null  // ISO timestamp
  internalNotes: InquiryNote[]
}

interface InquiryNote {
  noteId: string
  authorId: string            // AdminUser.id
  body: string
  createdAt: string
}
```

**Admin inbox at `/admin/inquiries/` — UX:**

- Shared pool model. Every admin sees every inquiry.
- Default view: **Active** inquiries (status `new` or `in-progress`), sorted by date descending
- Status filter chips: All / Active / Responded / Archived
- Each row shows: sender name, which animal (if applicable, linked to their card), message preview (first ~100 characters), received date, status badge, assigned-to indicator (if claimed)
- Tap a row to open the full inquiry: sender info, animal reference with direct link, full message, internal notes thread, action buttons

**Inquiry actions:**

- **Claim** — "I'll handle this" button. Sets `assignedTo: currentUserId`. Visible to all admins; others see "Marty is handling this" indicator.
- **Unassign / reassign** — any admin can clear or change the assignment. No permission gating beyond being admin.
- **Mark in-progress** — optional intermediate state: "I've reached out, waiting for reply"
- **Mark responded** — sets status to `responded`, records `respondedBy` and `respondedAt` automatically. Inquiry moves out of Active view but remains searchable.
- **Archive** — removes from active workflow entirely. For dead leads, spam, or completed transactions. Distinct from responded.
- **Add note** — free-text note appended to the inquiry's thread. Notes include author and timestamp. Visible only to admins.
- **Contact actions** — direct `mailto:` link for email, `tel:` link for phone, copy-to-clipboard button for each contact field (mobile-friendly)

**Notifications (see A25 for full detail):**

When a new inquiry arrives, each admin user with enabled notifications receives a message per their preferences (email, SMS, or both). Claims, status changes, and notes do NOT generate notifications — only new inquiries do. This prevents notification spam as the team grows.

**Phase 1 seed data:** 3-5 placeholder inquiries included in seed data so the inbox UI has content to render during development. Mix of general and animal-specific, mix of statuses, at least one with an internal notes thread.

**Formspree migration:**

Matt cancels or ignores the existing Formspree account (ID `mzdybyjl`) when v2 launches. The form on the existing v1 site continues using Formspree until v2 replaces it at cutover — no mid-flight migration needed.

---

### A25. Per-user notification preferences with SMS and email support

**Supersedes:** A23 (Admin user management) is extended.

**What changes:**

The `AdminUser` schema gains a phone number field and a notifications preferences object:

```typescript
interface AdminUser {
  // ... existing fields from A23
  phone: string | null   // E.164 format, e.g. "+12095551234"
  notifications: {
    newInquiryEmail: boolean
    newInquirySms: boolean
    // Future expansions: weeklyDigest, animalEvents, coverageNudges, etc.
  }
}
```

**Default values on account creation:**

- `newInquiryEmail: true` (email is always available; all users can receive by default)
- `newInquirySms: true` if phone number is provided at account creation; `false` otherwise

Users can toggle these in their own Settings → Notifications page.

**Expected per-user preferences** (informed by known user patterns, to be confirmed with users):

- **Matt**: Email on, SMS on (though may turn SMS off for personal preference)
- **Marty**: SMS on, email off (doesn't use email meaningfully)
- **Roianne**: Email on, SMS on (lives in inbox all day but SMS is faster)
- **Future hires**: both on by default

**SMS infrastructure:**

- Provider: **Twilio** (industry standard, reliable, reasonable pricing)
- One phone number registered with Twilio for sending (~$1.15/month rental)
- Per-message cost: ~$0.0083 US domestic
- Estimated annual cost at Summers Ranch volume: $15-25/year total
- API called from Cloudflare Worker on new inquiry event, dispatches to all opted-in users' numbers

**SMS message format** (kept short for carrier delivery):

```
Summers Ranch: New inquiry from 
[SenderName] about [Animal ref or "general"]. 
mrsummersranch.com/admin/inquiries
```

Example: *"Summers Ranch: New inquiry from Sarah Johnson about #840 Sweetheart. mrsummersranch.com/admin/inquiries"*

Total ~110 characters, fits in a single SMS segment.

**Email infrastructure:**

- Provider: **Cloudflare Email Routing** (free tier sufficient) OR **SendGrid** (free tier 100/day, richer formatting) — coding agent picks based on implementation simplicity
- Sending domain: `notifications@mrsummersranch.com` or similar (DNS setup required)
- Template includes: sender info, animal reference with deep-link, full message, direct link to inquiry in admin

**Edge cases handled:**

- **User with no phone number:** SMS toggle is disabled in their settings UI with an inline note "Add a phone number in your profile to enable SMS."
- **User with notifications disabled entirely:** they still see new inquiries when they log in, just without push notification. Useful for backup admins or paused users.
- **SMS delivery failure:** Worker logs the failure but does not retry. Email dispatch is independent and still attempts.
- **Twilio rate-limiting on new Summers Ranch number:** Matt registers the number with Twilio's brand registry at launch (one-time setup, ~20 minutes) to prevent delivery throttling.

**Future notification classes (out of scope for Phase 1 but data model supports):**

- Weekly inquiry digest summary
- Animal events (calf born, animal sold, registration complete)
- Coverage nudges for admin (gallery slot unfilled, etc.)
- Security events (login from new IP, etc.) — already covered in A22, going to `security@` address

These get added as boolean fields in the `notifications` object when the corresponding features ship. Phase 1 only implements `newInquiryEmail` and `newInquirySms`.

---

### A26. Progressive Web App manifest with ranch brand as home screen icon

**Supersedes:** New addition, no prior coverage in main spec.

**What changes:**

The site ships with a PWA (Progressive Web App) manifest that enables users to install it to their device home screen. On iOS, tapping the Share sheet → "Add to Home Screen" creates a native-feeling app icon that opens the site in a standalone frame without Safari chrome. On Android, browsers prompt users to install after repeated visits.

**Icon requirements:**

The home screen icon uses **the actual Summers Ranch brand** — the physical cattle brand the ranch uses, which already exists on printed materials (shirts, equipment) and is recognizably theirs. Matt will provide a clean high-resolution vector or photograph of the brand for the coding agent to use.

Required icon sizes (standard Apple + PWA set):
- 180×180 (iOS home screen, high-density)
- 192×192 (PWA baseline)
- 512×512 (PWA large, splash screen)
- 1024×1024 (iOS App Store / large display, for future-proofing)
- `favicon.ico` at 32×32 and 16×16 for browser tabs

All icons rendered on a deliberate background (cream or deep-ink depending on final palette selection from style preview) with sufficient padding around the brand mark so it doesn't touch the edges when iOS applies its rounded-corner mask.

**Manifest fields:**

```json
{
  "name": "Summers Ranch",
  "short_name": "Summers Ranch",
  "description": "Registered Herefords — Sutter Creek, California",
  "start_url": "/",
  "display": "standalone",
  "background_color": "[primary-bg from chosen palette]",
  "theme_color": "[accent from chosen palette]",
  "icons": [ ... per sizes above ... ],
  "orientation": "portrait-primary"
}
```

**Splash screen (iOS-specific):**

iOS generates a splash screen from the icon + background color when the user launches the PWA from home screen. The splash matches the chosen palette's primary background. A brief ranch name fade-in on cold launch is optional polish — coding agent's call based on complexity.

**What this NOT spec:**

- No iOS widgets (those require a native app, not a PWA)
- No push notifications in the home screen app (requires a native app on iOS until 2024+ and still finicky)
- No offline mode in Phase 1 (cached assets are fine, but no full offline herd browsing)

Phase 2 may add limited offline support via service workers if use patterns suggest value.

**Reasoning:**

A home-screen icon with the actual ranch brand turns the site into a feels-like-his-app moment. Marty will see his own brand on his phone home screen. For a gift, this is the kind of small, meaningful personalization that pays emotional dividends disproportionate to the implementation cost (~half a day of coding agent work plus asset preparation).

---

### A27. Dark mode support — Phase 2 priority, Phase 1 foundations

**Supersedes:** Section 17.3 (Design tokens — structural requirement) is extended.

**What changes:**

Dark mode is a genuine Phase 2 priority, not an indefinite deferral. Phase 1 lays the groundwork so Phase 2 implementation is a token-file addition, not a components rewrite.

**Phase 1 requirements:**

- Design tokens in `src/styles/tokens.css` use semantic names (`--color-bg`, `--color-ink`, `--color-muted`, `--color-paper`, `--color-accent`) rather than literal color values at usage sites
- Any hardcoded color in a component file is a bug
- Components reference tokens exclusively; swapping tokens produces a complete theme change
- No Phase 1 dark-mode UI (no toggle, no media query handling yet)
- `prefers-color-scheme: dark` media query NOT respected in Phase 1 (would produce a broken dark-mode preview with only the public palette swapped; worse than not trying)

**Phase 2 deliverables:**

- Dark-mode palette designed in parallel with the final Phase 1 palette review with Marty and Roianne (both selected together)
- `prefers-color-scheme: dark` media query in tokens.css swaps the full palette
- Optional explicit toggle in admin settings (override system preference)
- All cards, forms, admin surfaces, images (consider CSS filter for image tint adjustment) tested in both modes
- Inline-edit highlights, gold nudge pulses, ribbon colors all retuned for dark context

**Reasoning:**

Dark mode has become a user expectation, especially for admin workflows that may happen evenings. Respecting `prefers-color-scheme` is good web citizenship. Matt uses dark mode on his personal devices and would use the admin panel in dark contexts. Roianne's Windows workflow likely honors system dark mode as well.

Not in Phase 1 because a half-broken dark mode (only the public side themed, admin white) is worse than none. Full dark-mode treatment is Phase 2 workshop material — deserves its own palette design round, not rushed.

**Tokens to introduce for Phase 1 (prepares for Phase 2):**

```css
:root {
  /* Light mode — primary palette from style selection */
  --color-bg: /* chosen */;
  --color-paper: /* chosen */;
  --color-ink: /* chosen */;
  --color-muted: /* chosen */;
  --color-accent: /* chosen */;
  --color-ribbon-sale: /* gold */;
  --color-ribbon-distinction: /* DOD blue / SOD red */;
  --color-ribbon-birthday-bull: /* blue */;
  --color-ribbon-birthday-cow: /* pink */;
  
  /* Semantic tokens that may or may not change in dark mode */
  --card-shadow: /* light mode shadow */;
  --overlay-chrome-bg: /* semi-transparent light */;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  /* Phase 2 fills this in */
}
```

---

### A28. Birthday ribbon says "Happy Birthday" not the age number

**Supersedes:** earlier ribbon spec that showed the age as a large gold numeral on the birthday ribbon (e.g., "9" centered in Cormorant Garamond).

**What changes:**

The birthday ribbon's text content is now **"HAPPY" and "BIRTHDAY" in two vertical columns**, each column with one letter per line, each independently vertically centered within the ribbon's text zone. The pennant dimensions (34×90) remain unchanged.

**Reasoning:**

Marty saw the first version of the ribbon (showing "9" for Sweetheart's age in Cormorant Garamond 1.4rem) and said he didn't understand what the 9 meant. The ribbon was failing its primary job — communicating "this animal is celebrating a birthday" — because the meaning depended on context (the pastel color + ribbon form) that wasn't obvious to a first-time viewer. The age is already displayed in the card body's Age field, so the ribbon doesn't need to carry that data.

**Design exception noted:**

The text at 0.42rem Cinzel is **below the project's typical 12px / 0.75rem readability floor**. This exception is deliberate and authorized by Matt: the birthday ribbon fires at most once per year per animal, its pennant form plus pastel color (baby blue for males, baby pink for females) already signals "celebration," and the text is ornamental confirmation rather than primary information. Users who need to verify can zoom.

**Structure:**

```html
<div class="ribbon-hanging birthday-girl ...">
  <!-- emblem (✦) is hidden via display:none on birthday ribbons -->
  <div class="ribbon-hanging-text">
    <div class="column">
      <span>H</span><span>A</span><span>P</span><span>P</span><span>Y</span>
    </div>
    <div class="column">
      <span>B</span><span>I</span><span>R</span><span>T</span><span>H</span><span>D</span><span>A</span><span>Y</span>
    </div>
  </div>
</div>
```

The two `.column` divs use flexbox to vertically center their contents independently, so HAPPY (5 letters, shorter) appears centered in its half while BIRTHDAY (8 letters, taller) fills more of its column's height. The outer `.ribbon-hanging-text` uses `display: flex` with `justify-content: center` and `gap: 8px` between columns — the two words sit as a tight pair in the center of the ribbon with breathing room on the outer edges, tight enough to read as a single phrase but loose enough that the length difference between HAPPY and BIRTHDAY doesn't feel jarring.

**Units: px, not rem.**

The ribbon is a **fixed-size graphic component** — 34×90 pixels, styled with absolute positioning, intended to occupy the same physical space regardless of device. The text inside uses `px` (7px font-size, 8px gap) rather than `rem` so that iOS/browser accessibility text scaling doesn't leak in and overflow the column widths. A user with 130% system text size would see rem-based values expand by 30% and push the letters out of the ribbon frame; px locks the proportions.

If the ribbon system ever needs to scale as a whole (e.g., 20% larger ribbons for larger card sizes), all the pixel values get touched together — but that's a known, one-time proportional scale, not a per-user unpredictable one.

**Spacing iteration note:**

This spacing landed through three attempts:
1. `justify-content: space-around` with no gap → inter-word gap was visually oversized vs. outer edges; words read as two isolated columns drifting apart.
2. `justify-content: center` with `gap: 3px` → words too close together; the length difference between HAPPY (5 letters) and BIRTHDAY (8 letters) became jarring because the tight pair couldn't absorb it.
3. `justify-content: center` with `gap: 8px` (final) → splits the difference; words feel anchored to each other as a single phrase while the length asymmetry reads as natural.

**Emblem change:**

The ✦ sparkle emblem previously shown at the top of birthday ribbons is now `display: none` — the two-column text layout fills the ribbon top-to-bottom, and the pastel coloring plus text content together communicate the birthday meaning without a decorative emblem.

---

### A29. Unified ribbon-system treatment: vertical centering + pixel units for all ribbon text

**Supersedes:** the DOD/SOD hanging ribbon's original `top: 16px` positioning (top-aligned) and the various rem-based font-sizes on `.ribbon-corner span`, `.ribbon-hanging-emblem`, `.ribbon-hanging-text` generic.

**What changes:**

Two parallel improvements to the whole ribbon system for consistency with the birthday ribbon (A28):

1. **DOD/SOD hanging text is now vertically centered** within its text zone (between the emblem at the top and the swallowtail clip point at the bottom). Previously, D-O-D sat top-aligned below the emblem, which looked correct with 3 letters but wouldn't scale well to 2-letter or 4-letter abbreviations. Now any letter count will sit centered. The implementation uses flexbox: `top: 18px; bottom: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;`.

2. **All ribbon text now uses px, not rem.** The ribbons are fixed-size graphic components and must render identically regardless of the user's iOS/browser accessibility text scaling. Values:
   - For Sale corner: `0.62rem → 10px`
   - Hanging emblem (★): `0.52rem → 8px`
   - Hanging text (D-O-D / S-O-D): `0.76rem → 12px`
   - Birthday text (HAPPY/BIRTHDAY): `0.42rem → 7px` (was already px per A28)

**Side effect:** the birthday override now explicitly sets `flex-direction: row` because the generic `.ribbon-hanging-text` now uses `flex-direction: column` (for DOD's vertical letter stacking). Without the explicit override, birthday would inherit `column` and stack HAPPY above BIRTHDAY instead of side-by-side.

**Reasoning:**

A28 established `px` as the right unit for the birthday ribbon's fixed-size graphic nature. The same reasoning applies to every other ribbon component — they're all fixed-size graphic chrome, not responsive text. Consistency here prevents a future user-text-scale complaint from affecting any one ribbon type. The vertical centering on DOD is similarly a consistency improvement: matches how birthday centers its text within the ribbon's text zone.

**Body text unaffected.**

This change applies ONLY to the ribbon system (`.ribbon-corner`, `.ribbon-hanging-*`). Card body text (animal name, tag, stat labels, stat values) continues to use rem so accessibility text scaling still works for content the user actually reads.

---

### A30. Sale-status copy: "Available" not "For Sale"

**Supersedes:** all earlier references to "For Sale" as the corner-ribbon text and the card-body Status field value.

**What changes:**

Every instance of "For Sale" in the ribbon system and the card body is now "Available":

- Corner ribbon text (the gold 45° pennant in the top-right): `FOR SALE` → `AVAILABLE`
- Card body Status field value: `For Sale` → `Available`
- All supporting CSS comments and spec references

**Reasoning:**

"For Sale" carried a commercial/ecommerce register that didn't belong next to ceremonial pennants. The ribbon system's vocabulary is dignified and ornamental — DOD, SOD, HAPPY BIRTHDAY. "FOR SALE" stamped on top of that read like a used-car dealer sticker grafted onto a trophy display.

"Available" is how breeders actually talk about their stock in catalog copy, on breeding-association websites, in auction previews. It's quieter, more professional, and fits the warm-but-serious tone target Matt set for the site. Same semantic meaning, better register.

The Status field in the card body also changes to keep the card internally consistent — the ribbon and the status field should always match, since they describe the same animal attribute.

**Data-model implication:**

The canonical status value in `cattle-data.json` (when it lands in v2) should be `available` (lowercase enum), not `for-sale` or `forSale`. Other status values in the enum may include `not-available` / `retired` / `sold` — TBD when the full status enum is workshopped.

---

### A31. Outgoing share sheet — OpenGraph and Twitter Card implementation

**Supersedes:** New addition, no prior coverage in main spec. Partially resolves P4 (outgoing half).

**What changes:**

Every page on the site ships with OpenGraph and Twitter Card meta tags so that URLs shared via iMessage, WhatsApp, SMS, Discord, Slack, email clients, and social platforms produce rich previews instead of bare URLs. Share-sheet previews become a first-class surface of the site.

**Standards:**

- OpenGraph (`og:*` meta tags) covers iMessage, WhatsApp, Android SMS, LinkedIn, Discord, Slack, Facebook, Signal, most email clients
- Twitter Cards (`twitter:*` meta tags) cover Twitter/X only; layered on top of OG
- Both standards target a **1200×630 pixel image** (1.91:1 landscape ratio) as the canonical preview dimension
- No `twitter:site` or `twitter:creator` tags — Summers Ranch has no social media accounts and will not. `twitter:card` (type declaration) is still used.

**Per-surface rules:**

| Surface | Canonical URL | Image | Title |
|---|---|---|---|
| Animal front `/herd/[id]` | `/herd/[id]` | Card-front composite for that animal | `#[tag] [name] — [breed]` (or `#[tag] — [breed]` if unnamed) |
| Animal details `/herd/[id]/details` | `/herd/[id]` *(rewritten to front)* | Card-front composite for that animal | Same as front |
| Herd index `/herd` | `/herd` | Ranch-level hero composite | `Summers Ranch — The Herd` |
| Filtered herd `/herd?filter=...&sort=...` | Full URL with query string preserved | Phase 1: generic hero; Phase 2: filter-aware composite | `Summers Ranch — [filter label]` |
| Home `/` | `/` | Ranch-level hero composite | `Summers Ranch — Registered Herefords` |
| About `/about` | `/about` | Ranch-level hero composite | `About Summers Ranch` |
| Contact `/contact` | `/contact` | Ranch-level hero composite | `Contact Summers Ranch` |

**The details-page OG rewrite (operational rule):**

When a user is on `/herd/840/details` and uses the system share sheet, the OS scrapes the page's meta tags. Those meta tags point `og:url` at `/herd/840` (the front), not the details URL. The share preview shows the front of the card, and tapping the preview lands the recipient on the front. This is intentional: the front is the canonical animal representation; details is a drill-down, not a standalone shareable surface.

**Description tags:**

- Animal pages, available: *"Sired by [sire reg], out of [dam reg]. Currently available at Summers Ranch in Sutter Creek, California."*
- Animal pages, not available: *"Member of the registered Hereford herd at Summers Ranch in Sutter Creek, California."*
- Filtered/list pages: *"Eleven registered Herefords. Sutter Creek, California."* (count derived from current herd)
- Other pages: static per-surface descriptions.

**Image generation — architectural decision:**

Card-front composites are generated at **build time** in Phase 1, not dynamically at request time.

- Build step pre-renders a 1200×630 image per animal, output to `/public/og/animal-[id]-v[version].png` or an R2 `og/` prefix.
- Image URL includes a version token that bumps when content changes (throne-holder swap, stat update, photo change, ribbon state change).
- Version bump forces scrapers to re-fetch rather than serve stale cached previews.
- Generation via an Astro integration such as `astro-og-canvas` or a custom Satori-based renderer; coding agent picks based on available tooling at implementation time.

**Phase 2** upgrades to Cloudflare Worker-rendered dynamic composites *if and when* the operational need arises (e.g., filter-aware composites where the set of matching animals changes faster than the build cadence). Phase 1 ships static.

**Card-front composite design at 1200×630:**

The landscape composite is not a literal scaled card front (which is portrait). It is a deliberate 1200×630 arrangement that references card design language without trying to force the portrait ratio:

- Left ~60%: hero photo of the animal, cropped to fill (landscape-crop is acceptable here since the composite format is fixed)
- Right ~40%: card-chrome column with tag number (prominent), name, breed line, status line, and ranch wordmark at the bottom
- Ribbons from the card front (DOD/SOD, Available, Happy Birthday) appear in the composite if active, in the corners, using the same design vocabulary and typography as the card ribbons (per A28/A29/A30)
- Typography matches the chosen style direction (from Marty/Roianne style preview selection)
- Background and palette use the chosen direction's tokens

**Ranch-level hero composite (for list, home, about, contact):**

One static 1200×630 image designed once, reused across non-animal surfaces:

- Hero pasture photograph or clean ranch scene (to be sourced/commissioned)
- Ranch wordmark overlaid
- "Registered Herefords · Sutter Creek, California" tagline
- This single image anchors the ranch's visual identity in share previews until filter-aware composites ship in Phase 2

**Compact view share behavior:**

When a user shares from the compact (multi-animal-per-screen) view, the share URL is the herd list URL (with filters and sort query string preserved), not any specific animal. No per-card share affordance exists in compact mode — to share a specific animal, the user taps in to that animal's card front first. This keeps card corners uncluttered (already occupied by ribbons, photo date, reg#) and keeps the "share what you're looking at" mental model consistent.

**Phase 2 filter-aware composites:**

When the Worker-rendered path lights up in Phase 2, filtered herd URLs get composites showing a small collage (2-3 matching animals) with the filter label overlaid — e.g., "Available · 3 Herefords at Summers Ranch". This is the one case where preserving specific filter state in the share payload actually pays off, because the recipient sees exactly what the sender saw. Phase 1 ships a generic ranch hero for filter URLs and defers the collage generation.

**Cache invalidation:**

Image URLs include a version token (e.g., `?v=3` or `-v3` in the filename). When underlying content changes, the version bumps and scrapers re-fetch on next access. This avoids the common "shared URL still shows old preview weeks later" failure mode that plagues sites with static OG image paths.

**What this does NOT spec (out of scope for Phase 1):**

- Share tracking / click analytics on shared URLs (Phase 2+ if ever)
- oEmbed endpoints for richer embeds in platforms that support them (Phase 2+)
- AMP or other alternate-representation formats (not planned)

**Implementation checklist for the coding agent:**

1. Astro layout wraps every page with a base `<head>` that emits OG + Twitter meta tags from page-level frontmatter or data
2. Per-page frontmatter declares `ogImage`, `ogTitle`, `ogDescription`, `ogUrl` (the last one enabling the details-page rewrite rule)
3. Build-time OG image generation integrated into `astro build` pipeline; composite assets output alongside page HTML
4. Version token strategy wired up so image filenames bump when animal data changes
5. Validation: every published page produces a valid preview when tested via [opengraph.xyz](https://www.opengraph.xyz/) or similar tooling

**Reasoning:**

Share-sheet previews are a surprisingly high-impact surface. When a buyer texts a herd card to their spouse, the preview is the first impression. A clean card-front composite conveys animal identity, ranch identity, and design care in a single payload. The baseball-card metaphor ships all the way through to the messaging apps where buying conversations actually happen.

Build-time generation (rather than Worker-rendered) keeps Phase 1 infrastructure simple: no new Worker endpoints, no caching strategy beyond standard static asset caching, no cold-start latency. Works entirely within the existing Cloudflare Pages build pipeline. Phase 2 migrates to dynamic rendering only if filter-aware composites justify the additional infrastructure.

---

### A32. Incoming share sheet — iOS Shortcut photo upload pipeline

**Supersedes:** New addition, no prior coverage in main spec. Resolves the incoming half of P4.

**What changes:**

Marty (and other admin users) upload photos to the site via the native iOS Photos app share sheet, which invokes a custom Shortcut that handles tag resolution and upload to a Cloudflare Worker endpoint. Originals are preserved in full fidelity. Feedback is immediate after bytes land in R2, with downstream processing (derivatives, classifier, metadata commit) happening asynchronously.

**Design priorities, in order:**

1. **Full-file preservation** — non-negotiable. Originals go to R2 at source resolution and format, including HEIC, Live Photo .MOV pairs, and ProRAW if ever used. No client-side compression, no pre-upload resize.
2. **Snappy feedback** — target end-to-end latency (tap Share → confirmation plays) under 5 seconds on WiFi, under 10 seconds on usable LTE. Slower is acceptable when the network genuinely cannot keep up, but the system never *feels* slow on a fast network.
3. **Minimal input** — one tag entry per upload session, server handles the rest.

**Platform scope:**

iOS only in Phase 1. Android support is flagged for future discussion if and when another uploader joins whose primary device is Android. Current uploaders (Marty, Roianne, Matt) are all iPhone users.

**The Shortcut flow:**

1. User selects photos in the iOS Photos app (one animal's worth), taps Share
2. Taps "Summers Ranch" in the share sheet, which invokes the Shortcut
3. Shortcut prompts: "Tag number?" — numpad input type (big keys, numbers only)
4. User types the numeric portion of the tag (e.g., `206`), taps Done
5. Shortcut calls `GET /api/resolve-tag?tag=206` — returns JSON with 0, 1, or N matching animal records
6. **If exactly one match:** proceed directly, no further prompt
7. **If multiple matches:** Shortcut shows "Choose from List" picker with identity-labeled options; user taps one
8. **If zero matches:** Shortcut shows picker with a single "New animal" option plus a "Cancel" option; user confirms new animal or cancels
9. Shortcut uploads each selected photo (and paired Live Photo .MOV if present) to `POST /api/upload` with the resolved animal ID in a header, one file at a time
10. Worker receives each file, writes the original to R2 under a deterministic key, returns 202 Accepted
11. When the final file's 202 is received, the Shortcut plays a confirmation sound and displays a brief "✓ Sent!" toast
12. Shortcut closes; user is back in Photos app

Steps 10-12 happen per-file in rapid succession. If the user selected 8 photos of one calf, they see 8 quick acknowledgments or a single final confirmation (coding-agent choice based on which feels better in practice).

**Tag matching rule (server-side):**

The server extracts the first run of digits from each tag's physical identifier and compares it to the user's input for exact equality.

- Tag `106` → numeric run `106` → matches input `106`
- Tag `TY265A` → numeric run `265` → matches input `265`
- Tag `206-1` → numeric run `206` → matches input `206`
- Tag `1065` → numeric run `1065` → does NOT match input `106` (different numeric run, avoids false positives)

For the common case where mother and calf share the same physical tag number (Hereford convention — calves are tagged with their dam's number, distinguishable by visual position/size on the tag, not by suffix), both records share the same numeric run and both surface in the picker.

**Disambiguation picker format:**

When the server returns multiple matches, the Shortcut's "Choose from List" shows each animal labeled by identity, not by tag variant. Labels are constructed server-side from available data:

- `Sweetheart · Cow · 4y` — named adult, sex and age in human-readable form
- `Sweetheart's calf · 1mo` — unnamed calf, identified by relationship to its dam and human-readable age
- `Sweetheart's calf · 1mo · Twin 1` / `Sweetheart's calf · 1mo · Twin 2` — twin disambiguation when needed

When a calf is eventually named via admin, future pickers use the name. The server owns the label logic, so UI changes don't require Shortcut updates.

**One tag per upload session:**

All photos selected in the current share-sheet invocation receive the same resolved animal ID. If Marty needs to upload photos of multiple animals, he runs the Shortcut separately per animal. This is explicit, simple, and matches the likely real-world workflow (he typically photographs one animal per field visit-moment anyway).

**Live Photo handling:**

When the user shares a Live Photo, iOS provides both the still HEIC and the motion .MOV through the share sheet. The Shortcut uploads both, paired by filename convention. The server stores them as a linked MediaAsset pair — the still is the primary display asset, the .MOV is stored as associated motion. Whether and where motion is displayed on the site is a separate display decision (deferred), but the capture happens now so motion data is preserved from day one.

MediaAsset schema gains an optional `motionFile` field (URL or object key pointing to the paired .MOV). Empty when the source was a regular still photo.

**Authentication:**

Each Shortcut user has a pre-shared long random token (32+ bytes, base64-encoded) baked into the `Authorization` header of their Shortcut's upload actions. The Worker validates the token against a small list stored in Worker environment variables or KV.

- Matt, Marty, Roianne each get a unique token at setup time
- Tokens are scoped narrowly: the only action they permit is "upload photos with a claimed animal ID." They do not grant admin access, read access to data, or any other capability.
- Token rotation: if a phone is lost or the token is believed compromised, the corresponding Worker-stored token is invalidated. The user receives a new Shortcut with a fresh token.
- Setup convenience: generate a per-user Shortcut with token pre-filled, delivered via a one-time signed link from `/admin/settings/` that the user opens on their phone to install the Shortcut.

This is deliberately separate from the passkey-based admin auth (A22). Shortcuts cannot perform WebAuthn, and a long-lived token is fine given the limited scope of upload permissions.

**Confirmation sound:**

A subtle cow moo plays on successful upload. The sound is short (under 1 second), restrained rather than cartoonish, and designed to feel like a quiet acknowledgment rather than a gimmick. Default on; user-settable off in `/admin/settings/` for users who upload frequently and find it repetitive.

**Fast-ack semantics:**

The Worker returns 202 Accepted only *after* the original file is safely persisted to R2. "Sent!" has to mean something: if WiFi drops mid-upload, the user does not get the moo. Everything downstream of R2 persistence is async and invisible to the user:

- Derivative generation (HEIC → JPEG conversion, 2400px resize for display)
- Metadata write to the canonical herd data store
- Classifier run (shot-type detection, quality score per P5)
- GitHub commit for metadata (if still in the Phase 1 static-build model) or direct write to data store (Phase 2+)
- Throne-holder re-evaluation if the new photo challenges an existing throne

Any of these async steps can fail without affecting the user's experience. Failures surface in the admin upload-issues queue (see below) rather than the uploader's phone.

**New admin surfaces (Phase 1):**

Two new admin surfaces are required by this pipeline and are part of Phase 1 scope:

- **`/admin/pending-tags/`** — queue of uploads tagged with a numeric tag that returned zero matches at upload time (new animal not yet in the system, or typo). For each entry: the uploaded photos, the typed tag, uploader identity, timestamp. Admin actions: "Create new animal with this tag" (opens the animal-creation form with tag pre-filled) or "Merge into existing animal" (shows tag search, reassigns photos).

- **`/admin/upload-issues/`** — queue of uploads that completed at the R2 persistence stage but failed at one or more async downstream stages (derivative generation errored, classifier crashed, commit conflict, dedup hash collision, etc.). For each entry: the original R2 object, the failure stage, the error message, admin actions appropriate to the failure mode (retry, manual resolve, discard).

Both surfaces dispatch notifications per user notification prefs (A25) — default ON for Matt (owner), OFF for Marty and Roianne (they do not handle operational issues).

**Data model additions:**

- `MediaAsset.originalR2Key: string` — stable key for the preserved original in R2
- `MediaAsset.motionFile: string | null` — R2 key for paired Live Photo .MOV, if present
- `MediaAsset.sourceFormat: 'heic' | 'jpeg' | 'proraw' | 'other'` — format of the preserved original, informs derivative pipeline
- `MediaAsset.uploadedBy: string` — admin user ID (matt / marty / roianne) for audit and the Prefer-flag respect logic

**R2 storage layout:**

```
originals/
  [animalId]/
    [uploadTimestamp]-[sha256-prefix].heic       // original still
    [uploadTimestamp]-[sha256-prefix].mov        // paired Live Photo motion, if present
derivatives/
  [animalId]/
    [mediaAssetId]-[version].jpg                 // display-ready 2400px derivative
    [mediaAssetId]-thumb-[version].jpg           // small thumbnail for compact view
og/
  animal-[animalId]-v[version].png               // share-sheet composite (per A31)
```

**Implementation checklist for the coding agent:**

1. Worker endpoint `GET /api/resolve-tag?tag=<n>` returning `{ matches: [{ animalId, label }, ...] }`
2. Worker endpoint `POST /api/upload` with `Authorization: Bearer <token>`, `X-Animal-Id: <id>` header, binary body; returns 202 after R2 persist
3. Shortcut template with three actions: Ask For Input (Number), Get Contents of URL (resolve-tag), Choose From List (if multiple), Get Contents of URL loop (upload each photo)
4. Per-user token generation and delivery via `/admin/settings/` one-time-link
5. Worker async processor for derivative generation + classifier + metadata write
6. `/admin/pending-tags/` UI with create-new and merge-into flows
7. `/admin/upload-issues/` UI with per-failure-mode actions
8. Notification dispatch to admin-users-configured channels (SMS/email per A25) on pending-tag landing and on upload-issue landing

**Reasoning:**

The share sheet is the right entry point because Marty already knows how to use it — no new app to learn, no new mental model. The uncomfortable "Shortcut stays pending" feeling is eliminated by fast-ack architecture: acknowledge as soon as R2 has the bytes, not after the full pipeline runs. Full-file preservation is cheap with R2 (storage is the cheapest part of the stack), and preserving originals keeps future options open — if we ever want to re-derive a different display size, re-run the classifier with a better model, or display Live Photo motion, the source material is still there.

The tag-matching rule plus identity-based disambiguation means Marty interacts with the system in the vocabulary he naturally uses ("which animal is this photo of") rather than the system's vocabulary ("what string encodes this animal's record"). The server bridges that gap.

Pending-tag and upload-issue queues must be Phase 1, not Phase 2, because without them there's no graceful handling of new animals and no visibility into failures. Shipping the upload pipeline without them would create silent-failure footguns.

**Deferred to Phase 2 or later:**

- Android Shortcut equivalent (deferred pending actual Android uploader)
- iCloud Drive + CloudKit path for true-background upload (deferred pending operational signal that foreground upload is insufficient)
- Client-side compression optional toggle (explicitly rejected — originals always preserved)
- Bulk tag-assignment tools (e.g., assigning different tags to different photos within the same upload session) — deferred pending signal that single-tag-per-session is insufficient
- Upload retry from failed state on the phone — iOS Shortcuts don't natively support this well; Phase 2 migration to a different upload mechanism (e.g., URLSession background task via a native iOS app) would enable it

---

### A33. Admin documents section

**Supersedes:** New addition. Establishes a new admin surface; detailed contents to be designed during P6.

**What changes:**

The admin area gains a documents section at `/admin/documents/` that serves as a general-purpose ranch-office reference library. It supports both uploaded files (PDFs, printable registration forms, breed-association documents) and native markdown pages authored in the site repo (upload instructions, industry reference, site operations guides).

**Initial category scaffolding (suggestive, finalized during P6):**

- **Photo Guidelines** — industry photography standards, what makes a good seedstock photo, the criteria the site's classifier applies. Authored markdown drawing from the P5 research notes.
- **Upload Instructions** — how the Shortcut works, how to install it on a new phone, troubleshooting common issues, what to do when an upload fails.
- **Registration Forms** — AHA (American Hereford Association) registration forms, transfer forms, blank templates ready to print. Uploaded PDFs.
- **Industry Reference** — breed standards, terminology glossary, context on why registration matters, how EPDs work. Authored markdown.
- **Site Operations** — how to recover admin access if a phone is lost, how to rotate an upload token, how to add a new admin user. Authored markdown.

Category list is not locked. P6 will finalize what exists at launch and the UI for browsing/organizing.

**Storage model:**

- Uploaded files → R2 under `docs/` prefix, served behind admin auth
- Authored markdown → site repo under `src/content/admin-docs/` (version-controlled, renders via standard Astro content collections)

**Visibility:**

Admin-only in Phase 1. Some content (particularly Photo Guidelines and parts of Industry Reference) may later be surfaced on the public side as buyer-facing context — that's a Phase 2 decision, not committed here.

**Reasoning:**

During the P4 incoming-share-sheet workshop, it surfaced that Marty didn't know industry-prescribed photography guidelines existed. That's a gap: ranchers who don't know the reference standards can't meet them. Centralizing that reference material on the site makes it available where Marty already spends time, rather than requiring him to remember it exists on some breed-association website.

The broader move is reframing the admin surface from "herd/inquiry dashboard" to "ranch office." Registration paperwork, operational how-tos, industry reference — the things Marty currently keeps in a paper binder or (worse) in his head — all live in one place he can reach from his phone. Low implementation cost (file list + markdown renderer), meaningful conceptual value, and the Photo Guidelines page specifically creates a virtuous loop: it explains the standards the P5 classifier is silently applying to his uploads.

---

### A34. Amendment to A32: always-confirm picker + letter-keyboard escape

**Supersedes:** A32 steps 6-8 (the "if exactly one match, proceed directly" logic).

**What changes:**

The Shortcut's disambiguation picker is shown **always**, even when the server returns exactly one match. The flow becomes uniform:

1. User types tag number, taps Done
2. Shortcut calls `/api/resolve-tag?tag=<n>`
3. Shortcut shows picker titled `Matches for <typed input>:` with:
   - All matching animals, identity-labeled per A32
   - A bottom entry: `Add new tag`
4. User taps one option
5. If an animal entry was tapped: upload proceeds with that animal ID
6. If `Add new tag` was tapped: Shortcut prompts `Use tag <typed input>?` with Yes / No
   - **Yes** → creates new animal record with the typed tag, upload proceeds
   - **No** → opens full Text keyboard with typed input pre-filled; user edits (adds letters, corrects digits), taps Done; new animal is created with the edited tag; upload proceeds

**Why always-confirm:**

Auto-proceeding on a single match sounded clever but introduces a silent failure mode: Marty fat-fingers `830` when he meant `840`, the server finds one match for 830, photo lands on the wrong animal, the error isn't caught for weeks. One extra tap per upload is a cheap insurance premium against that class of bug, and the uniform 2-tap flow is easier to learn than a conditional flow that branches based on match count.

Putting the typed input in the picker header (`Matches for 206:`) gives the user a moment to notice a typo before committing.

**Why the Yes/No step after "Add new tag":**

The Yes/No prompt is the clean escape path from the numpad to the letter keyboard. Without it, there's no way to enter a letter-containing tag (e.g., `TY265A` for an animal that doesn't yet exist in the system and whose tag has a registration-letter prefix). The Yes branch handles the common case (pure-numeric new tag, one extra tap); the No branch handles the rare case (letter tag, opens full keyboard with input pre-filled as the starting point).

If field testing shows the No branch is never used, it can be removed in a future Shortcut edit without changing the server contract.

**Server-side tag matching rule (reiterated from A32, unchanged):**

Server extracts the first run of digits from each tag's physical identifier and matches against the typed input. Input `265` matches tags `265`, `TY265A`, `265-1`, etc. (all share numeric run `265`). Input `106` does not match `1065` (different numeric runs).

---

### A35. Admin role-based access control (Owner / Admin / Contributor)

**Supersedes:** A23 (admin users record model — role enum replaces the implicit owner/admin flag).

**What changes:**

Admin users gain a `role` field with three allowed values. A23 treated admin users as functionally equal with only an implicit owner distinction; A35 formalizes this as a three-tier RBAC model with a concrete capability matrix. Naming follows ecosystem convention (GitHub, Slack, Google Workspace) rather than idiosyncratic coinage.

**The three roles:**

- **Owner** — full capabilities plus user management, token rotation of other users, site-level config, ownership transfer. Matt.
- **Admin** — full operational access; cannot manage other users or change site config. Marty, Roianne.
- **Contributor** — limited access; primarily photo upload via Shortcut, own upload history, own settings. Future ranch hands.

**Role invariants:**

- Exactly one Owner at all times; Owner cannot demote themselves without first transferring ownership to another user
- Only the Owner can promote/demote users or add/remove users
- Admins and Contributors cannot change any user's role, including their own
- Role is set at user creation and changed only via the Owner's user-management surface

**Data model (extends A23):**

```typescript
interface AdminUser {
  // ... existing fields from A23 (id, name, email, phone, passkeyCredentials, uploadToken, notifications, etc.)
  role: 'owner' | 'admin' | 'contributor'
}
```

**Capability matrix:**

| Capability | Owner | Admin | Contributor |
|---|---|---|---|
| Upload photos via Shortcut (token auth) | ✓ | ✓ | ✓ |
| View own upload history | ✓ | ✓ | ✓ |
| Own profile settings (notifications, passkey devices, rotate own token) | ✓ | ✓ | ✓ |
| Set/clear Needs Attention flags | ✓ | ✓ | own uploads only |
| View/edit herd records | ✓ | ✓ | — |
| Delete animals (destructive) | ✓ | — | — |
| Inquiry inbox (read, reply, mark handled) | ✓ | ✓ | — |
| Media library curation (Prefer/Hide, organize) | ✓ | ✓ | — |
| Resolve pending-tags queue | ✓ | ✓ | — |
| Resolve upload-issues queue | ✓ | ✓ | — |
| Documents section (read, upload, edit) | ✓ | ✓ | — |
| Add/remove admin users | ✓ | — | — |
| Change other users' roles | ✓ | — | — |
| Rotate other users' upload tokens | ✓ | — | — |
| Transfer ownership | ✓ | — | — |
| Change site-level config (style, palette, public toggles) | ✓ | — | — |
| View audit logs | ✓ | — | — |

**Shortcut token independence from role:**

Upload tokens (A32) authorize "upload photos with a claimed animal ID" regardless of role. The two axes of access are independent:

- **Web admin access** via passkey (determines what admin surfaces you can see, based on role)
- **Shortcut upload access** via token (binary: have a valid token or don't)

A user can have either, both, or neither. A Contributor with only a token (no passkey) cannot log in to the web admin at all — they only interact via Shortcut. An Admin with only a passkey and no token cannot upload via Shortcut but has full operational access to the web admin. Rotating one credential does not affect the other.

**Contributor web admin surface (preview; detailed during P6):**

When a Contributor logs in via passkey, they see a stripped-down admin surface:

- Their own upload history (photos they've uploaded, tagged animals)
- Animals flagged Needs Attention that they've contributed to, so they can re-photograph or follow up
- Their own settings (notification prefs, passkey devices, their upload token)

They do not see: dashboard metrics beyond their own activity, inquiry inbox, media library, other users, herd editing surfaces, site config, documents section.

Route-level gating rather than UI-level gating: Contributors navigating to an Admin-only URL receive a 404, not a "permission denied" message. Prevents the UI from revealing the existence of surfaces they can't access.

**Default user list at launch (supersedes A23):**

- **matt** — Owner
- **marty** — Admin
- **roianne** — Admin

No Contributors at launch; added as needed when ranch hands join.

**Reasoning:**

Three-tier RBAC is the mainstream pattern for small-to-mid orgs (GitHub, Slack, Google Workspace, WordPress's tier model collapses to this shape for most uses). The trust gradient at Summers Ranch — full trust, operational trust, upload-only trust — maps cleanly to three tiers, no more, no less. Owner is kept as its own tier rather than "an Admin with an ownership flag" because ownership-transfer and final user-management decisions differ meaningfully from full-admin capabilities, and it matches natural speech ("Matt's the owner, Marty and Roianne are admins").

Upload tokens are kept independent of role so the two access paths can be granted independently. A ranch hand who only uploads photos shouldn't need a passkey. An Admin who doesn't use Shortcut shouldn't be forced to manage a token. This also means token compromise is scoped: a stolen token grants upload capability only, not any web admin access.

Route-level gating rather than UI-level permission errors is both better UX (no "you can't do this" dead ends) and simpler to implement (single auth middleware check per route group).

**Deferred:**

- **Per-user capability overrides** (e.g., "this one Contributor can also access inquiries") — if ever needed, added as boolean flags layered on top of the role matrix. Not a refactor to capability-based auth.
- **Time-bounded access** (e.g., seasonal ranch hand with Contributor access only during calving season) — standard auto-expiry pattern, added when the operational need appears.
- **Multi-owner model** — Summers Ranch has a single clear owner; defer pending genuine ambiguity about site ownership.

---

### A36. Card-front photo selection — throne mechanic, scoring rubrics, and schema scaffolding

**Supersedes:** Significantly narrows and supersedes the card-front portions of the P5 workshop framing. The earlier P5 description of a three-slot throne system (side-profile / head / three-quarter) with the card cycling through all three is **replaced** by a single-slot throne system using side-profile only. The "three canonical shot types" framing is also withdrawn — research confirmed only the side profile is industry-codified; head shots and three-quarter shots are supplementary rather than canonical.

**Scope note:** A36 covers **card-front photo selection only**. Timeline selection (card back), gallery surfaces, and editorial/about surfaces are explicitly out of scope. Each of those surfaces will get its own selection rubric in later amendments. A36 does, however, lock Phase 1 schema additions that make future purpose-specific rubrics possible without migration.

---

#### Part 1 — Card-front throne model

Each animal's card front displays exactly one photo at a time: the current **side-profile throne-holder**. When a new photo is uploaded and classified as a side profile, it competes with the current throne-holder via a blended score. Higher score wins the throne; previous throne-holder is demoted but preserved.

**Non-side-profile uploads** are classified (head shot, three-quarter, full body, rear, detail, with-dam, action, scenic, landscape, incidental) but do not compete for the card-front throne. They are routed to their purpose-appropriate surfaces (Timeline, Gallery, Editorial) per the purpose-eligibility tags in Part 5.

**Empty throne handling:** If an animal has zero side-profile uploads (e.g., brand-new calf, admin has only captured head shots so far), the card displays the best-available non-side-profile photo (next-ranked by overall aesthetic score) and a coverage nudge is dispatched to admin: *"No side profile yet for [animal] — needed to complete card."* This is consistent with the "better empty than wrong" principle at the animal level (don't fabricate or skip) while keeping the card visually functional during the coverage gap.

---

#### Part 2 — The blended score

Each side-profile photo receives two raw scores at ingest:

- **Prescription score (0-100)** — how well it meets industry-prescribed side-profile criteria (see Part 3)
- **Aesthetic score (0-100)** — neutral photographic craft quality (see Part 4)

The two combine via an **availability-dependent, age-weighted blend**:

```
finalScore = (prescriptionWeight × prescriptionScore) + (aestheticWeight × aestheticScore)
```

Where `prescriptionWeight + aestheticWeight = 1.0`, and the specific weights depend on the animal's current availability status and the photo's age relative to the life-stage staleness curve.

**Availability-dependent weighting:**

| Animal status | Fresh weighting (prescription : aesthetic) | Fully-decayed weighting |
|---|---|---|
| Available | 0.90 : 0.10 | 0.80 : 0.20 |
| Not available | 0.70 : 0.30 | 0.50 : 0.50 |

Between the fresh point and the full-decay point, weighting interpolates linearly. Weighting is applied per-photo using that photo's own age; the incumbent throne-holder and any challenger are both scored using their own respective ages, then directly compared.

**Design rationale:**

- Available animals never let aesthetics dominate because a gorgeous-but-stale photo misrepresents an animal someone is about to buy
- Not-available animals can let aesthetics partially take over once the throne-holder has aged, because the photo is now functioning partly as gallery/heritage rather than evaluation material
- Neither mode ever lets aesthetic fully exceed prescription — side-profile evaluation purpose is always at least half of what the card is for

---

#### Part 3 — Prescription score sub-weights

Total weight: 100. Sub-weights reflect what cattle judges actually need to evaluate, adapted from livestock judging scorecard principles (top-weighted criteria are those without which evaluation fails entirely).

| Criterion | Weight | What it enables |
|---|---|---|
| Camera axis perpendicular to spine (target 85-95°, falls off rapidly outside) | 25 | Silhouette, conformation, frame evaluation — the purpose of a side profile |
| Leg positioning (back leg nearest camera back, off-side forward, fronts square) | 20 | Feet and legs assessment — top-priority judging criterion |
| Full body visible without occlusion | 15 | Cannot evaluate what is not visible |
| Camera height near animal eye level (not shot from above) | 12 | Shooting from above foreshortens and distorts proportions |
| Head position (up and forward, ears forward if possible) | 8 | Breed character, alertness assessment |
| Animal cleanliness (free from mud, debris, occluding other animals) | 8 | Coat, markings, muscling visibility |
| Ground and background (uncluttered, non-distracting) | 6 | Silhouette readability |
| Lighting (proper exposure, no harsh shadows, flash-compensated for dark cattle) | 6 | Detail visibility; partial overlap with aesthetic score |

Sub-weights are proposals, tunable by later amendment once the classifier has been validated against real uploads. The structural invariant: the top three criteria (angle, legs, full-body) together total 60 and dominate the score.

---

#### Part 4 — Aesthetic score sub-weights

Total weight: 100. Deliberately restricted to measurable craft criteria rather than subjective taste criteria.

| Criterion | Weight | What it measures |
|---|---|---|
| Technical quality (sharpness, exposure, no motion blur, appropriate depth of field) | 35 | Objectively measurable photographic execution |
| Composition (framing, balance, rule of thirds, negative space, no distracting elements) | 30 | Universal compositional principles |
| Lighting character (quality of light on subject — not just exposure, but whether it reveals form) | 20 | Craft signal, not taste signal |
| Color and tonal balance (pleasing color, reasonable contrast, not oversaturated) | 15 | Technical rather than preferential |

**Deliberately excluded:**

- **Emotional impact / "wow factor"** — standard in photo competitions but bakes in subjective preference
- **Creativity / originality** — not what card-front photos are optimizing for (they are documentary, not artistic)
- **Adherence to theme** — not applicable

The aesthetic score measures *photographic craft*, not *artistic merit*. A well-executed, neutral, professional-looking photo scores high whether or not it is emotionally striking. This matches the design goal of universal neutrality over personal preference.

**Note:** emotional and artistic criteria are appropriate and necessary for gallery and editorial surfaces — they are excluded here because card-front has a different purpose. Future amendments for gallery/editorial selection will include them.

---

#### Part 5 — Life-stage staleness curves

**Life stage definitions** (anchored at 2-year maturity per industry standard for medium-frame beef breeds):

| Life stage | Age range |
|---|---|
| Newborn | 0-60 days |
| Young calf | 60-205 days |
| Weanling | 205-365 days |
| Yearling | 1-2 years |
| Mature | 2+ years |

**Staleness curves** (fresh period uses fresh weighting; full-decay point uses fully-decayed weighting; linear interpolation between):

| Life stage | Fresh period | Full-decay point |
|---|---|---|
| Newborn | 30 days | 90 days |
| Young calf | 60 days | 180 days |
| Weanling | 90 days | 270 days |
| Yearling | 180 days | 540 days |
| Mature, not available | 365 days | 1460 days (~4 years) |
| Mature, available (for sale) | 60 days | 180 days |

**Rule of thumb:** full-decay = 3× fresh period, except mature-not-available which gets 4× (adult cows change slowly once frame-mature). Mature-available overrides to the tight 60/180 curve because for-sale photos must represent current condition.

---

#### Part 6 — Schema additions

**MediaAsset** (extending prior additions in A5 and A32):

```typescript
interface MediaAsset {
  // ... existing fields from A5, A32, A28/A29/A30 ribbon state
  
  // Shot classification (assigned by classifier at ingest)
  detectedShotType:
    | 'side-profile'
    | 'head'
    | 'three-quarter'
    | 'full-body'       // front-on or rear-on
    | 'rear'
    | 'detail'          // udder, feet, muzzle close-up
    | 'with-dam'        // calf with mother, maternal context
    | 'action'
    | 'scenic'          // cattle subject but compositionally atmospheric
    | 'landscape'       // no cattle subject or cattle incidental
    | 'other'
  
  // Purpose-eligibility flags (surfaces this photo can legitimately appear on)
  cardFrontEligible: boolean      // passes side-profile classifier gate
  timelineEligible: boolean        // shows the animal clearly; eligible for Timeline
  galleryHerdCandidate: boolean    // cattle-subject, compositional or environmental interest
  galleryRanchCandidate: boolean   // environment, landscape, flora/fauna, place
  editorialCandidate: boolean      // wide, contextual, person/place character
  
  // Card-front throne scoring
  prescriptionScore: number | null       // 0-100; null if not a side profile
  prescriptionSubscores: {               // breakdown per Part 3 criteria
    angleToSpine: number
    legPositioning: number
    fullBodyVisible: number
    cameraHeight: number
    headPosition: number
    cleanliness: number
    background: number
    lighting: number
  } | null
  
  aestheticScore: number                 // 0-100; assigned to every photo
  aestheticSubscores: {                  // breakdown per Part 4 criteria
    technical: number
    composition: number
    lightingCharacter: number
    colorTonalBalance: number
  }
  
  // Per-surface scores reserved for future population by respective rubrics (Phase 2)
  timelineScore: number | null
  galleryScore: number | null
  editorialScore: number | null
  
  lastEvaluatedAt: string                // ISO timestamp of last classifier pass
  classifierVersion: string              // for reproducibility as models update
}
```

**CattleMediaLink** (extending existing):

```typescript
interface CattleMediaLink {
  // ... existing fields
  
  cardFrontThrone: boolean           // currently the card-front displayed photo
  cardFrontThroneSince: string | null  // ISO timestamp this photo took the throne
  cardFrontThroneLostAt: string | null // ISO timestamp this photo was displaced (null if never or current)
}
```

**Phase 1 implementation notes:**

- All schema fields exist in Phase 1 even if Phase 1 does not populate all of them
- Phase 1 classifier populates `detectedShotType`, purpose-eligibility flags, `prescriptionScore` + subscores (for side profiles), `aestheticScore` + subscores
- `timelineScore`, `galleryScore`, `editorialScore` remain null in Phase 1 until their respective rubrics are designed
- Card-front selection logic consults `prescriptionScore`, `aestheticScore`, animal availability, and photo age to compute the current throne via the Part 2 blend formula
- Throne re-evaluation fires on every new MediaAsset ingest for that animal, and on animal availability status changes

---

#### Part 7 — What this amendment does NOT resolve

Explicit non-scope to prevent over-application of card-front logic:

- **Timeline selection rubric (back of card)** — Deferred to future workshop. Will emphasize chronological coverage and within-interval quality; not prescription-dominated.
- **Gallery selection rubrics** — Deferred. See Part 8 for the gallery split that Phase 1 schema prepares for.
- **Editorial / About page rubric** — Deferred. Will emphasize contextual, wide, human-inclusive photos.
- **Classifier infrastructure choice** — Deferred to Phase 2 kickoff (Claude vision API vs. fine-tuned model). Phase 1 ships with schema + manual overrides available via admin Prefer/Hide flags.
- **Prefer flag × throne interaction** — Still open. Current behavior is undefined; to be resolved when admin surface is designed (P6) or by targeted future amendment.
- **Challenge threshold / churn prevention** — Tactical. Likely a small deadzone (e.g., new photo must exceed throne by ≥2 points to win) prevents oscillation between visually-similar photos. To be tuned once the classifier produces real scores.
- **Classifier uncertainty handling** — Tactical. Low-confidence subscores contribute 0 weight rather than neutral score, so ambiguous photos do not artificially inflate or deflate totals. To be formalized at Phase 2 classifier implementation.

---

#### Part 8 — Gallery split (Phase 2 target, Phase 1 schema preparation)

To enable Phase 1 schema to tag photos correctly for later surfaces, the gallery is split into named surfaces at the conceptual level:

- **The Herd** — cattle-subject shots that are not card-material. Distant pasture scenes, grazing behavior, cows with calves in natural poses, unusual angles, action, scenic-with-cattle.
- **The Ranch** — place and environment. Landscapes, barn, pasture, gates, weather, seasonal atmosphere, incidental flora and fauna.
- **The Work** *(optional, Phase 2+ decision)* — people working, calving season, tagging, loading, operational reality. Inclusion subject to Roianne's curation preference.

Phase 1 classifier populates `galleryHerdCandidate` and `galleryRanchCandidate` flags based on subject detection. `galleryScore` stays null until Phase 2 rubric is designed. No gallery UI in Phase 1; the tagging preserves Phase 2 optionality.

---

**Reasoning for this amendment's scope:**

The earlier P5 framing treated the card front as the site's primary photo-selection problem. After workshopping it became clear that card-front selection is one of four distinct photo-selection problems, each with a different purpose and therefore a different rubric. Locking a universal rubric would have been a category error — what makes a good card-front photo makes a mediocre gallery photo and vice versa.

A36 locks the card-front rubric at high precision (sub-weights, blend formula, staleness curves all specified numerically) because this is the surface with the most structural consequence: buyers evaluating seedstock. The other three surfaces are left unspecified but schema-prepared, preventing the Phase 1 build from baking in choices that constrain later workshops.

The availability-dependent blend is the key structural insight: a photo's appropriate weighting depends on what the card is being used for at that moment. An available animal's card is a sales surface; a not-available animal's card is a herd gallery entry. One rubric handles both cleanly.

---

### A37. RBAC update — four-tier model and Contributor review workflow

**Supersedes:** A35 in its entirety. The three-tier model (Owner / Admin / Contributor) is replaced by a four-tier model. The upload batch tracking and Contributor-review states are new.

**What changes:**

The RBAC model gains an **Editor** tier between Admin and Contributor. The role enum becomes:

- **Owner** — Matt. Full capabilities plus user management, site config, ownership transfer. Exactly one at a time.
- **Admin** — Marty, Roianne. Full operational access including financial data (when it exists), inquiry inbox, all herd records. Cannot add/remove users or change site config.
- **Editor** — trusted helpers. Herd record edits, pending-tags resolution, upload-issues resolution, media curation, documents section access. No financial data, no inquiry inbox, no user management, no site config.
- **Contributor** — upload-only via Shortcut. Own upload history, own settings. No operational web admin access.

Financial data (when added to the site) is a capability gate: Owner and Admin only. Editor and Contributor never see it.

**Revised capability matrix** (replaces the A35 matrix):

| Capability | Owner | Admin | Editor | Contributor |
|---|---|---|---|---|
| Upload photos via Shortcut | ✓ | ✓ | ✓ | ✓ |
| View own upload history | ✓ | ✓ | ✓ | ✓ |
| Own profile settings (notifications, passkey devices, rotate own token) | ✓ | ✓ | ✓ | ✓ |
| Set/clear Needs Attention flags | ✓ | ✓ | ✓ | own uploads only |
| View/edit herd records | ✓ | ✓ | ✓ | — |
| Delete animals (destructive) | ✓ | — | — | — |
| Inquiry inbox (read, reply, mark handled) | ✓ | ✓ | — | — |
| Media library curation (Prefer/Hide, organize) | ✓ | ✓ | ✓ | — |
| Resolve pending-tags queue | ✓ | ✓ | ✓ | — |
| Resolve upload-issues queue | ✓ | ✓ | ✓ | — |
| Review Contributor upload batches (approve/reject) | ✓ | ✓ | ✓ | — |
| Toggle Contributor's review-required status | ✓ | ✓ | — | — |
| Documents section (read, upload, edit) | ✓ | ✓ | ✓ | — |
| View financial data (when added) | ✓ | ✓ | — | — |
| Add/remove users | ✓ | — | — | — |
| Change other users' roles | ✓ | — | — | — |
| Rotate other users' upload tokens | ✓ | — | — | — |
| Transfer ownership | ✓ | — | — | — |
| Change site-level config | ✓ | — | — | — |
| View audit logs | ✓ | — | — | — |

**Contributor trust states (per-Contributor, managed by Owner or Admin):**

Each Contributor user record has a trust state with three possible values:

- **`default`** — uploads auto-publish immediately. Cow moo fires, photos compete in the throne algorithm like any other upload. This is the initial state for every new Contributor.
- **`review-required`** — uploads land in a review queue; not visible on the public site until approved. The Contributor's phone experience is unchanged (numpad prompt, tag picker, cow moo on R2 persistence). They are not notified that their uploads are now gated. Set by Owner or Admin when a specific Contributor's upload quality degrades.
- **`revoked`** — upload token invalidated. Contributor cannot upload at all. Terminal state.

State transitions are one-directional in normal use (`default` → `review-required` → `revoked`) but can be manually reverted by Owner or Admin (e.g., a Contributor whose access was paused during seasonal downtime can be restored to `default`).

**Upload batch tracking (applies to all uploaders, not just Contributors):**

Every upload session receives a unique `batchId`. All photos uploaded in the same Shortcut invocation share a batch. This field is stored on MediaAsset and enables batch-level operations:

- Batch rejection (reject an entire mistaken session at once, e.g., wrong tag applied to 8 photos)
- Batch review UI (photos grouped by upload session in review queues)
- Batch provenance (audit trail showing which photos came in together)

**MediaAsset schema addition** (extends A32 and A36):

```typescript
interface MediaAsset {
  // ... existing fields
  batchId: string                                 // UUID generated per upload session
  uploaderTrustStateAtUpload:                     // captured at ingest for audit clarity
    'default' | 'review-required'                 // (revoked uploads never reach ingest)
  publishState:
    | 'published'                                 // live on the site
    | 'pending-review'                            // Contributor upload awaiting approval
    | 'rejected'                                  // removed from site but preserved in admin
  rejectedAt: string | null                       // ISO timestamp if rejected
  rejectedBy: string | null                       // user ID of reviewer, if rejected
  rejectionReason: string | null                  // optional free-text, internal only
}
```

**AdminUser schema addition** (extends A35):

```typescript
interface AdminUser {
  // ... existing fields (now four-role enum)
  role: 'owner' | 'admin' | 'editor' | 'contributor'
  contributorTrustState: 'default' | 'review-required' | 'revoked'  // only meaningful if role === 'contributor'
}
```

**Contributor upload awareness — two mechanisms:**

1. **Dashboard card (always visible to Owner/Admin/Editor):** "Recent Contributor uploads" widget shows the last N Contributor batches with per-batch summary (uploader name, animal, photo count, timestamp) and a Review action. Passive awareness — admins see it only when they visit the Dashboard.

2. **Notification dispatch (opt-in per admin, default off):** Using the notification infrastructure from A25, each Owner/Admin/Editor user can opt into receiving a notification (email or SMS per their preferences) whenever any Contributor uploads. Default off to avoid noise for admins who don't want per-upload pings.

Dashboard card is always-on. Notification is opt-in.

**Review actions:**

- **Approve batch** (for `pending-review` state) — flips `publishState` to `published`, photos go live, throne algorithm re-evaluates.
- **Reject batch** (for either `published` auto-published Contributor uploads or `pending-review` queue items) — flips `publishState` to `rejected`, photos removed from public surfaces, preserved in admin for later audit or restoration. Affected animals' throne algorithm re-evaluates without these photos.
- **Individual photo approve/reject** within a batch, same semantics on a single photo.

When an Admin rejects a Contributor batch, **the Contributor is not notified**. Silent rejection. The assumption is that any user-facing rejection UI creates social friction that outweighs its value; quality feedback to Contributors should happen offline through the human relationship, not through the system.

**New admin surface (Phase 1):**

- **`/admin/review/`** — review queue for Contributor uploads in `pending-review` state, and a retrospective view for recently auto-published Contributor uploads. Batch-grouped. Approve/reject actions per batch or per photo.

This is the surface where the "review-required" trust state's uploads land. For `default`-state Contributors, this surface also shows recent auto-published batches for retroactive review.

**Route-level gating (reiterated from A35):**

Users navigating to a URL above their role level receive a 404, not a "permission denied" error. Contributors hitting `/admin/herd/` see a 404, same as any non-admin visitor. Prevents the UI from revealing surfaces a user cannot access.

**Default user list at launch:**

- **matt** — Owner
- **marty** — Admin
- **roianne** — Admin
- no Editors at launch; added as trusted helpers emerge
- no Contributors at launch; added case by case

**Deferred (unchanged from A35):**

- Per-user capability overrides (if ever needed, added as boolean flags layered on top of the role matrix)
- Time-bounded access (seasonal helper auto-expiry)
- Multi-owner model

**Reasoning:**

The gap between Admin (full operational, including financial) and Contributor (upload only) was too wide once financial data was contemplated. Editor fills the trusted-helper slot — someone who can genuinely operate the herd-management workflows but shouldn't see the books. Four tiers matches the WordPress model (Administrator / Editor / Author / Contributor) adapted for our domain.

The publish-by-default Contributor model matches how modern CMS systems handle guest publishing and avoids the dead-letter-queue failure mode where Contributor uploads sit unpublished for weeks because no admin reviews them. The trust-state escalation (`default` → `review-required` → `revoked`) mirrors how real working relationships degrade before termination, giving admins a graduated response instead of a binary trust switch.

Batch tracking is a shared primitive worth the minimal schema cost. It enables recoverability for all uploaders, not just Contributors — a mistyped tag by Marty is recovered the same way as one by a Contributor. The fact that it also unlocks the Contributor-review workflow is a bonus.

Silent rejection for Contributors is the right social default. The relationship is managed offline; the system's job is to quietly remove bad data, not to deliver feedback to someone who probably just took photos as a favor on a weekend visit.

---

### A38. Admin navigation, Herd landing, animal detail edit, and progressive disclosure

**Supersedes:** The high-level admin URL structure from A21 is refined and extended. The P6 "Dashboard contents TBD" open item is resolved (Dashboard is folded into the Herd landing).

**What changes:**

This amendment locks the Phase 1 admin surface shape: navigation pattern, herd landing page as the primary admin surface, animal detail page edit affordances, and the progressive-disclosure pattern that balances aspirational completeness against overwhelm.

---

#### Part 1 — Navigation pattern

**Mobile (primary interface for most admin users):**

Bottom navigation bar with **four items**, persistent across all admin surfaces:

1. **Herd** (leftmost, default landing) — `/admin/`
2. **Inbox** — `/admin/inquiries/` (badge shows unread count)
3. **Review** — `/admin/review/` (badge shows combined count of pending items)
4. **More** — opens bottom sheet with secondary items

Icons are accompanied by labels (not icon-only — icon-only mobile nav has measurable discoverability problems).

The More sheet contains:
- Documents (`/admin/documents/`)
- Settings (`/admin/settings/`)
- Media (`/admin/media/`) — Phase 2, appears disabled/coming-soon in Phase 1
- Calendar (`/admin/calendar/`) — Phase 2, appears disabled/coming-soon in Phase 1

**Desktop:**

Left rail, permanently visible, 240px wide. Contains the same four primary items as mobile bottom nav, plus the secondary items expanded below (no More menu on desktop). Matches convention (WordPress, Notion, Linear, Slack admin).

**Visibility by role:**

Navigation items respect the role capability matrix from A37. Contributors navigating to `/admin/` see their own stripped-down surface (upload history + own settings) with a reduced nav — no Inbox, no Review (Contributors don't approve anyone), no Documents, no Media, no Calendar. Route-level gating: Contributors hitting Admin-only URLs receive a 404.

**Session and login:**

Admin users arriving unauthenticated are redirected to a minimal `/admin/login` page for passkey auth (per A22). After auth, they land wherever they were trying to go (or `/admin/` if no specific destination).

---

#### Part 2 — Herd landing (`/admin/`)

The Herd landing is the dashboard. There is no separate `/admin/dashboard/` page. This resolves the P6 "Dashboard contents TBD" open item by concluding that a separate dashboard surface would be redundant — everything a dashboard would show is already herd-related, so the herd list itself is the dashboard.

**Three stacked zones, top to bottom:**

**Zone 1 — Status strip** (sticky to top of viewport when scrolling). Four inline counts:

- `N inquiries` (unread) — tap → `/admin/inquiries/`
- `N to review` (combined pending Contributor batches + pending tags + upload issues) — tap → `/admin/review/`
- `N need attention` (animals with any active nudge) — tap → filters the list to that subset
- `N animals` (total herd count) — tap → clears filter, shows all

Zero-count items render greyed but still tappable. "Better empty than wrong" — when nothing needs attention, the strip is quiet rather than decorative.

**Zone 2 — List controls** (one row below the strip).

- **Sort dropdown**, default `Needs Attention`. Other options: `Tag ↑`, `Age ↑`, `Age ↓`, `Name`, `Recently updated`.
- **Filter dropdown**, default `All`. Other options: `Available`, `Needs Attention`, `Bulls`, `Cows`, `Heifers`, `Calves`, `Reference`.
- **View toggle**: Cards / Compact (same control as on the public `/herd`).

**Zone 3 — The list.** Same card component as public `/herd`, with `mode="admin"` which surfaces:

- Needs Attention badge inline on the card, visible when the animal has any active nudge
- Inline "recently edited" timestamp on cards edited in the last 14 days
- Inline annotation on cards with unreviewed Contributor batches (e.g., *"Recent upload: 2 photos from Jeff, 3d ago"*)

Tapping any card → `/admin/herd/[id]/` (animal front with edit affordances).

**FAB for new animal:**

A floating action button (+) in the bottom-right corner of the herd list, persistent across scroll. Visible to Owner, Admin, Editor (never Contributor). Tap → inline "Add animal" sheet slides up from bottom with chained-progression field entry (tag, name, sex, breed, status). Cancel closes sheet; Save creates the record and navigates to it.

---

#### Part 3 — Animal detail page (`/admin/herd/[id]/` and `/admin/herd/[id]/details/`)

The admin animal detail pages use the **same card component as public** (as established in A21), with `mode="admin"` making fields tappable and editable. The public-admin mode parity is not just an architectural convenience — it means Marty's edit surface visually matches what buyers see, so he's always editing in context.

**Edit affordance pattern: inline edit on card back, auto-save on blur.**

- Tap any field → keyboard/picker appropriate to data type opens → edit value → tap away (blur) → auto-save fires
- No separate edit mode, no Save button, no modal form pages
- Save indicator: brief inline "Saved" flash near the field (1-2 seconds, then fades)
- Save failures: field outlines red, value remains editable, retry on next blur
- No explicit cancel (changes aren't "in flight" — each field's save is atomic)

**Input type matches data type (chained progression, per A32 philosophy):**

- Numeric fields (weight, age-in-days, birth weight) → numpad
- Text fields (name, notes) → text keyboard
- Date fields (birth date, purchase date) → date picker
- Enum fields (sex, breed, status) → picker with button-list options
- Long text (notes, description) → expanding text area
- Relational fields (sire, dam) → tag search picker, same pattern as the Shortcut's disambiguation picker

**Audit trail per field:**

Every editable field has a collapsed audit trail underneath, expandable with a one-tap affordance. Shows the last N changes with user and timestamp. Defensive — if a Contributor or Editor mis-edits a field, Owner/Admin can see what it was and revert. Not visible to Contributors.

---

#### Part 4 — Progressive disclosure pattern

This part is the structural answer to the tension between aspirational completeness (Marty wants to move toward full registration, performance tracking, etc.) and overwhelm (he'll close the app if confronted with 40 empty fields).

**Three rules that work together:**

**Rule 1 — Section labels use plain ranching language, not industry vocabulary.**

The data model stores canonical section and field names (e.g., `progeny`, `epd`, `registration`). The UI renders them with a translation map that uses language a rancher would say out loud:

| Canonical (internal) | Displayed label |
|---|---|
| `registration` | American Hereford papers |
| `progeny` | Calves from this cow *(or "Calves sired"* for bulls) |
| `epd` | Performance ratings |
| `pedigree` | Parents and grandparents |
| `sale` | Sale details |
| `performance-data` | Weights and measurements |
| `show-results` | Show records |

The translation map lives in code as a single source of truth and is extensible. Phase 1 covers the sections present in the initial spec; new sections added later get added to the map.

**Rule 2 — Empty-but-relevant sections use low-weight visual treatment.**

A section with no data yet does NOT render as an empty form with prompts like "+ Add registration data" or "Fill in pedigree info." It renders as a quiet line in muted type near the bottom of the card back:

> *American Hereford papers — not started*

No border, no CTA button, no colored badge. Tappable. Tapping expands the section into its edit form. Not tapping costs nothing — the section has presence but no gravity.

Sections with partial data render in normal type with their collapsed form showing the fields that do have values. Tapping expands to show all fields (filled and empty) so Marty can add more.

**Rule 3 — Sections materialize only when relevant.**

Sections that the animal has no structural use for don't render at all. A calf that has never produced offspring doesn't show `Calves from this cow` — not even as a muted empty line. Once the animal is old enough and has a progeny record entered, the section appears. This is the admin-side of "better empty than wrong" — absence is not a prompt to fill something in, it's information that the field doesn't apply.

Section materialization rules (to be formalized per section):

| Section | Appears when |
|---|---|
| Identity | Always — every animal |
| Pedigree | Always for animals with a birth date; absent for reference-only entries |
| Performance ratings | Appears for animals with any weight or measurement record, or bulls ≥12 months |
| American Hereford papers | Appears for animals whose breed is registered and whose sire/dam are known |
| Calves from this cow / Calves sired | Appears for cows ≥24 months OR any bull ≥12 months |
| Sale details | Appears only when status is `Available` or `Sold` |
| Show records | Appears only when a show entry has been added |
| Notes | Always |

---

#### Part 5 — Completion-triggered nudges

Nudges fire **near completion of a section**, not at zero. The design goal: reward the final push toward a useful milestone, never shame the empty state.

**Trigger rule:**

Each section defines a set of **required-for-completion** fields (the minimum fields needed to consider that section "done" for its purpose). A nudge fires when all required-for-completion fields are filled and ≤2 optional fields remain empty.

**Examples:**

- `American Hereford papers`: required are tag, sex, birth date, sire, dam, breeder, owner, tattoo location. Optional: birth weight, adjusted weaning weight, adjusted yearling weight. Nudge fires when all 8 required are filled and ≤2 optional remain → *"Almost ready to register #[tag]. Missing: birth weight, adjusted weaning weight."*
- `Performance ratings`: required are birth weight, weaning weight, yearling weight (for animals in the appropriate life stage). Nudge fires when all 3 are filled with measurement dates → *"Full performance record for #[tag] — ready to submit for EPDs if you're pursuing that."*
- `Sale details`: required are asking price, contact info if direct sale, availability date. Nudge fires when set is complete → *"Sale listing for #[tag] is complete — want to mark as Available on the public site?"*

Nudges that never fire on empty or near-empty sections stay silent indefinitely. If Marty hasn't engaged with registration at all for a given animal, no nudge appears.

**Nudge dismissal / snooze:**

Every nudge has a `×` dismiss affordance. Dismissing snoozes that nudge for **30 days by default** (tunable per-nudge-type in future amendments). After snooze expiry, if the trigger condition still holds, the nudge surfaces again. If the underlying section has been completed or changed enough that the trigger no longer applies, the nudge quietly disappears.

Snoozed nudges are visible in a "Snoozed" subtab of the animal's Needs Attention indicator, allowing Marty to manually un-snooze if he changes his mind.

Per-user dismiss tracking: snoozes are stored per-user, not globally. If Marty snoozes a nudge on animal #840 and Roianne opens the same animal, she sees the nudge unless she's also snoozed it.

---

#### Part 6 — Tooltip layer for industry terminology

Any field label that uses industry terminology (acronyms, technical terms, AHA-specific language) includes a small `(?)` affordance next to the label. Tapping reveals a 1-3 sentence plain-language explanation written in rancher-to-rancher voice, not textbook voice.

**Example tooltips:**

- *EPD*: *"Expected progeny differences. Numbers that predict what this animal's offspring will inherit — things like birth weight, growth rate, milk production. Buyers compare EPDs when picking bulls."*
- *Tattoo location*: *"Where the animal's permanent ID tattoo is placed — usually left or right ear, inside. Required by AHA for registration."*
- *Adjusted weaning weight*: *"Weaning weight normalized to a 205-day standard. Lets calves of different ages be compared fairly."*

Tooltips may link to longer explanations in `/admin/documents/` (per A33). The tooltip is the starter dose; the doc is the deep dive.

**Tooltip content is a Phase 1 content authoring task, not a coding agent task.** The infrastructure to render tooltips is built in Phase 1 by the coding agent. The content — the actual words in the tooltips — is written separately by Matt and Claude, reviewed by Roianne, in a targeted content pass. Initial Phase 1 scope: ~20-30 tooltips covering every field in the registration, performance, and pedigree sections.

Tooltip content storage: a single structured file (e.g., `src/content/field-tooltips.ts` or a JSON file) as a key-value map from canonical field name to tooltip text. Extensible, version-controlled, translatable-in-principle.

---

#### Part 7 — "Stumble upon" discovery, not "complete your profile"

Taken together, Parts 4-6 implement a **discovery-not-duty** pattern:

- Marty opens an animal's detail page and sees only the sections with data, plus muted ghost-lines for relevant-but-empty sections
- His eye may or may not catch a ghost line reading *"Performance ratings — not started"*. If it doesn't, nothing is lost. If it does, he taps and the section opens with plain-language labels and `(?)` tooltips
- He fills what he knows, leaves the rest. No save button, no progress bar, no "complete your profile" pressure
- If he happens to fill most of a section over time, a nudge eventually surfaces: *"Almost ready to register — missing X"*. He can act on it, snooze it, or ignore it
- His engagement compounds over time without the system ever demanding it

The difference from a traditional data-entry form: traditional forms treat empty as a problem to solve. This pattern treats empty as information — the animal's record is exactly as complete as Marty's engagement with that section has been, and growing the record is an invitation, not an assignment.

**This pattern applies across the admin surface**, not only to animal detail pages. Documents section uses it (new categories appear as populated, not pre-stubbed). Settings uses it (Phase 2 features appear as they ship, not as "coming soon" ghost-items). The principle is general.

---

#### Part 8 — Schema additions and implementation notes

**AnimalRecord schema extension** (extends main spec Section 14.1):

```typescript
interface AnimalRecord {
  // ... existing fields
  sectionsSnoozed: Record<string, { snoozedUntil: string, snoozedBy: string }>
  // Key: section canonical name; Value: snooze expiry + user who snoozed.
  // Only meaningful for nudges; does NOT affect section visibility.
}
```

**FieldAuditEntry schema** (new):

```typescript
interface FieldAuditEntry {
  id: string
  animalId: string
  fieldPath: string        // e.g., "registration.birthWeight"
  previousValue: unknown | null
  newValue: unknown
  changedBy: string        // user ID
  changedAt: string        // ISO timestamp
}
```

Audit entries are append-only. Storage: keep last N (default 20) per field in the record itself for fast display; archive older entries to a separate store if retention is desired.

**Implementation checklist for the coding agent:**

1. Route structure per Part 1, with role-based gating
2. Bottom-nav component for mobile, left-rail component for desktop, same item set
3. Herd landing per Part 2: status strip, list controls, admin-mode card list, FAB
4. Inline-edit pattern on card back per Part 3: per-type input components, auto-save-on-blur, inline save/error indicators
5. Per-field audit trail UI, collapsed by default, expandable on tap
6. Section translation map per Part 4 Rule 1 (file-based, extensible)
7. Muted-empty-section rendering per Part 4 Rule 2 (visual weight spec to be tuned during style-preview integration)
8. Section materialization logic per Part 4 Rule 3 (rules encoded per-section)
9. Nudge trigger engine per Part 5 (required-fields-complete + N-optional rule, per-section config)
10. Snooze data model and UI per Part 5
11. Tooltip rendering infrastructure per Part 6 (content authored separately)
12. Schema additions per Part 8

---

**Reasoning:**

The dashboard-is-herd collapse is a scope reduction that makes the product better: one fewer surface to design, one fewer navigation hop, and the landing page is always the most operationally relevant view. The separate-dashboard pattern from generic admin template kits doesn't apply here because the "operational data" the dashboard would summarize is the herd list itself.

Progressive disclosure is doing the heavy conceptual lifting. Data-entry overwhelm is the primary failure mode for an admin surface built for someone who doesn't love data entry. The plain-language labels + muted ghost lines + relevance-based materialization + completion-triggered nudges together form a UI that never demands, only invites. Marty's engagement compounds naturally without needing discipline to fight the UI.

The inline-edit pattern with auto-save matches modern SaaS convention (Linear, Notion, Airtable) and is measurably faster than page-based edit forms for iterative, small edits — which is Marty's primary use case (updating a weight, changing a status, adding a sire reference).

---

### A39. Full design-token system — typography, spacing, radius, shadow, motion

**Supersedes:** Extends A27 (dark-mode semantic color tokens). A27's tokenization requirement, which previously covered color only, is extended to cover the full design-token surface.

**What changes:**

The "no hardcoded values in components" rule established in A27 for color is generalized: typography, spacing, border radius, shadow, and animation timing all become token-based. Any hardcoded value for any of these properties in a component file is a bug.

**Token categories and file structure:**

A single consolidated tokens file `src/styles/tokens.css` contains all token categories. Matches industry convention (most style systems use one tokens file, imported globally, rather than splitting by category). Categories within the file are grouped with comment-block separators for readability.

```css
:root {
  /* ========================================
     COLOR (per A27 — already locked)
     ======================================== */
  --color-bg: /* populated from style choice */;
  --color-paper: /* populated */;
  --color-ink: /* populated */;
  --color-muted: /* populated */;
  --color-accent: /* populated */;
  --color-ribbon-sale: /* gold */;
  --color-ribbon-distinction: /* DOD blue / SOD red */;
  --color-ribbon-birthday-bull: /* blue */;
  --color-ribbon-birthday-cow: /* pink */;
  --color-nudge-pulse: /* gold, per A38 nudge system */;
  
  /* ========================================
     TYPOGRAPHY
     ======================================== */
  
  /* Font families */
  --font-display: /* populated from style choice — headlines, card titles */;
  --font-body: /* populated — body copy, form fields */;
  --font-mono: /* tag numbers, code-like data */;
  
  /* Font sizes — modular scale */
  --font-size-xs: /* e.g., 0.75rem */;
  --font-size-sm: /* e.g., 0.875rem */;
  --font-size-base: /* e.g., 1rem */;
  --font-size-lg: /* e.g., 1.125rem */;
  --font-size-xl: /* e.g., 1.25rem */;
  --font-size-2xl: /* e.g., 1.5rem */;
  --font-size-3xl: /* e.g., 1.875rem */;
  --font-size-4xl: /* e.g., 2.25rem */;
  
  /* Font weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Letter spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.05em;
  --letter-spacing-ribbon: /* populated from style choice */;
  
  /* ========================================
     SPACING
     ======================================== */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  
  /* ========================================
     BORDER RADIUS
     ======================================== */
  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  --radius-card: /* populated from style choice — the card's radius is a brand element */;
  
  /* ========================================
     SHADOW
     ======================================== */
  --shadow-none: none;
  --shadow-sm: /* populated */;
  --shadow-md: /* populated */;
  --shadow-lg: /* populated */;
  --shadow-card: /* populated — specific to card component */;
  --shadow-modal: /* populated */;
  --shadow-inset: /* populated — for depressed states */;
  
  /* ========================================
     MOTION
     ======================================== */
  
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-crossfade: 700ms;  /* card photo crossfade per main spec */
  
  /* Easing */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);  /* for card slide commits per A1 */
  
  /* ========================================
     Z-INDEX (for surface stacking)
     ======================================== */
  --z-base: 0;
  --z-sticky: 10;    /* status strip per A38 */
  --z-overlay: 20;   /* ribbons, card chrome */
  --z-modal: 50;     /* lightbox, login modal */
  --z-toast: 100;    /* save confirmations, error flashes */
}
```

**Values marked `/* populated from style choice */`** are placeholders filled in once Marty and Roianne select a style direction from the style preview. The architecture is locked now; the specific values wait on their decision.

**Semantic vs. primitive tokens:**

The token list above mixes primitive tokens (`--space-4`, `--font-size-lg`) with semantic tokens (`--color-bg`, `--radius-card`). Both are legitimate. Primitives are the raw design vocabulary; semantics are purpose-named aliases pointing to primitives. Components should prefer semantic tokens when one exists ("use `--radius-card`, not `--radius-lg`") and fall back to primitives when no semantic alias fits.

Future amendments may add more semantic tokens as patterns emerge. The primitive set should stay stable; the semantic set grows.

**Dark mode (per A27):**

The `@media (prefers-color-scheme: dark)` block in tokens.css only overrides color values. Typography, spacing, radius, shadow, and motion tokens remain identical in dark mode. This is the intended design: dark mode is a palette change, not a different design system.

**What this does NOT include:**

- **No component-specific tokens outside tokens.css.** If a component needs a specific value not covered by any existing token, the right move is to add a new token (primitive or semantic) to tokens.css, not to introduce a local variable in the component.
- **No theming-beyond-dark-mode.** We're not building a multi-theme system where, e.g., users could pick between "classic" and "modern" variants. A27 and A39 together prepare for two themes max: light (default) and dark (Phase 2).
- **No runtime token swapping.** Tokens are CSS custom properties resolved at render time, not JavaScript state. Changes require a CSS file edit and deploy.

**Implementation checklist for the coding agent:**

1. Single `src/styles/tokens.css` file with the structure above, imported globally via the base Astro layout
2. Linter or pre-commit check that flags hardcoded values in component files for properties that should use tokens (color, font-family, font-size, margin, padding, border-radius, box-shadow, transition-duration, transition-timing-function)
3. Token value population deferred until style direction is chosen by Marty and Roianne
4. When the style direction is chosen, the populated token values are the first commit in the style-integration pass — a single PR touching only `tokens.css`
5. Subsequent token value changes (e.g., Marty says "cards feel too round, soften the radius") are single-file edits

**Reasoning:**

Tokenizing only color (per A27) was a half-measure. The same argument that applied to color — "Marty might want to change this six months in, don't make that a component refactor" — applies equally to every other visual property. Typography especially: fonts are load-bearing brand decisions that frequently get revisited, and components that hardcode `font-family: 'Playfair Display', serif` are components that resist future iteration.

The slight added complexity of "everything via tokens" is a Phase 1 cost that pays back indefinitely. Coding-agent discipline to consult tokens.css instead of inventing values is easy at project start, hard to enforce retroactively.

The consolidated-single-file structure matches the style-system conventions of Radix UI, shadcn/ui, Tailwind's own custom-properties build, and most modern Astro/React template systems. One file, one search, one place to change.

---

### A40. Settings sub-structure, self-service Contributor creation, and miscellaneous refinements

**Supersedes:** Resolves the remaining P6 Settings-structure work. Supersedes A32's cow-moo confirmation sound.

**What changes:**

This amendment locks the Settings sub-structure, introduces self-service Contributor creation (so Marty and Roianne can add their own helpers without needing Matt), adds per-user admin accent color customization, scraps the cow-moo confirmation sound, and addresses a handful of smaller items surfaced during the P6 workshop.

---

#### Part 1 — Settings sub-structure (five sub-pages)

Settings lives under `/admin/settings/*` with five role-gated sub-pages:

| Sub-page | Path | Visible to |
|---|---|---|
| Profile (landing) | `/admin/settings/` | All roles |
| Notifications | `/admin/settings/notifications/` | All roles |
| Devices | `/admin/settings/devices/` | All roles |
| Team | `/admin/settings/team/` | Owner, Admin |
| Site | `/admin/settings/site/` | Owner |

Route-level gating per A35/A37: users hitting a sub-page above their role level receive a 404.

**Navigation within Settings:**

Desktop: sub-nav strip at the top of the Settings area showing only the items the current user can access. Mobile: same but horizontally scrollable; collapses to a dropdown at very narrow widths.

---

#### Part 2 — Profile (`/admin/settings/`)

Landing sub-page. Every user manages their own profile. Contains:

- Display name (shown in audit trails, Dashboard cards, team list)
- Email (used for email notifications per A25)
- Phone number (used for SMS notifications per A25; required for SMS opt-in)
- Time zone (used for nudge scheduling, timestamp display)
- **Admin accent color** (new — per-user, see Part 7)

All fields use the inline-edit pattern from A38 (tap → edit → auto-save on blur). No Save button.

---

#### Part 3 — Notifications (`/admin/settings/notifications/`)

Per-user notification preferences. Follows A25's channel infrastructure.

**Available toggles** (default state shown in parentheses):

- New inquiry received — email (on), SMS (on if phone set, else off)
- Contributor uploaded — email (off), SMS (off) — per A37
- Pending tag requires resolution — email (on), SMS (off)
- Upload issue detected — email (owner: on, others: off), SMS (off)
- Nudge surfaced on an animal you've edited in the last 90 days — email (off), SMS (off) — Phase 2 feature, toggle exists as placeholder

Each toggle is inline-edited; changes auto-save. The "SMS" toggle is disabled with an inline hint if the user has no phone number set, linking to Profile.

---

#### Part 4 — Devices (`/admin/settings/devices/`)

Two stacked sections: passkey devices and upload token.

**Passkey devices section:**

- List of registered passkey credentials with per-device: nickname (user-editable), device type (inferred from user agent at registration), date added, last-used timestamp
- "+ Add a new device" button that initiates a standard WebAuthn registration flow
- Per-device "Remove" action with confirmation
- Warning line if only one passkey device remains: *"This is your only registered device. If you lose access to it, you'll need recovery (see below)."*

**Upload token section:**

- Current token status ("Active" with masked preview like `••••••••••••7Abc`, or "Not yet installed")
- "Reinstall on phone" button that generates a one-time install link and presents share options (iMessage, email, Copy link) — uses the same install flow as Part 8
- "Rotate token" button with confirmation. Rotating invalidates the previous token immediately and requires reinstalling the Shortcut on the user's phone.
- Last-used timestamp (last successful upload)

**Recovery section (bottom of Devices page):**

- For Owner: view recovery codes. Generated once at initial Owner setup; 10 single-use codes. If exhausted, regenerate (invalidates all previous codes).
- For Admin, Editor, Contributor: displays a one-line message *"If you lose access to your devices, contact [Owner name] for help restoring access."* No self-recovery path; Owner-assisted recovery handled via the Team page.

---

#### Part 5 — Team (`/admin/settings/team/`)

User management. Visible to Owner and Admin; **add/remove/role-change capabilities gated further to Owner only** (per A37 capability matrix).

**Main view — team list:**

Rows: display name, role badge, status (Active / Not yet activated / Review-required), last-active timestamp, actions menu.

Visible filters: All / Active / Contributors only / Activity in last 7 days.

**"+ Add team member" flow (Owner and Admin only, per Part 8 for Contributors):**

Opens a sheet with:
- Display name (required)
- Phone number (optional, enables SMS)
- Email (required for Owner/Admin/Editor; optional for Contributor)
- Role selector (Admin and Editor only for Owner; Contributor only for Admin — Admins cannot promote beyond their own level)
- For Contributor: trust state toggle ("Review uploads before they appear publicly") default OFF (matches `default` state per A37)

Create action generates the user record and proceeds to device/token setup:
- For Owner/Admin/Editor: sends email invite with passkey-registration link (48-hour expiry)
- For Contributor: generates upload token and presents Shortcut install flow (Part 8)

**Per-user actions menu:**

| Action | Owner | Admin |
|---|---|---|
| Edit display name/email/phone | ✓ | — (own profile only) |
| Change role | ✓ | — |
| Rotate upload token | ✓ | — |
| Toggle Contributor trust state (default ↔ review-required) | ✓ | ✓ |
| Revoke Contributor token | ✓ | ✓ |
| Reset passkey registration (Owner-assisted recovery) | ✓ | — |
| Remove user | ✓ | — |

**Owner-assisted recovery:**

When a user (not the Owner) loses all their passkey devices, they contact the Owner. The Owner opens the Team page, taps the locked-out user, and taps "Reset passkey registration." This clears all registered passkeys for that user and generates a one-time registration link delivered via the user's email. Visible in the audit log as a sensitive action.

**Audit log (Owner-only view at bottom of Team page):**

Chronological list of sensitive events:
- User additions and removals
- Role changes
- Trust state changes
- Ownership transfers (initiated, completed, declined)
- Upload token rotations
- Passkey device additions and removals (owner-initiated resets flagged)
- Site config changes (from Site sub-page)
- Contributor batch rejections

Per entry: timestamp, actor, action, target, brief context. Retention: 1 year by default. "Export to CSV" action for longer-term archival.

**Explicitly NOT logged:** animal record edits (they have their own per-field audit trail per A38), successful logins, failed login attempts (Phase 2 consideration).

---

#### Part 6 — Site (`/admin/settings/site/`)

Owner-only. Site-level configuration.

**Sections:**

**Style** — the populated design-token values from A39. After Roianne's style-preview decision, Owner sees the current palette/typography choices here with a "Regenerate tokens from style preview" affordance. Manual token overrides are possible but discouraged (warning inline).

**Ranch metadata** — public-facing info displayed on About, Contact, footer:
- Ranch name (display)
- Tagline ("Registered Herefords — Sutter Creek, California")
- Primary contact phone (public)
- Primary contact email (public)
- Physical address (public, optional — privacy consideration)

**Public surface toggles** (Phase 2 expansion): whether specific public pages render at all. Phase 1 has all pages always-on; the toggle infrastructure is locked now for Phase 2 use.

**Default notification settings for new users** — the defaults a newly-created user receives in Notifications. Owner can adjust these so new team members start with sensible defaults.

**Ownership transfer** — see Part 9.

---

#### Part 7 — Per-user admin accent color

Each user has an `adminAccentColor` field on their AdminUser record. When set, this overrides `--color-accent` **on admin surfaces only** for that user. Public pages remain unaffected by any user's accent choice — public pages use the ranch-level accent from A39 tokens.

**UI:**

In Profile, a simple color picker with 8-12 preset options (avoiding clashes with any ribbon or nudge colors) plus a "default" option that uses the ranch accent. Picker shows a live preview of how it'll appear on common admin surfaces.

**Technical:**

`adminAccentColor: string | null` on AdminUser. Null means "use the ranch default." Non-null is a hex or semantic color value. Admin-surface components reference `--color-accent` as usual; a small CSS override is injected into the admin layout's inline styles based on the logged-in user's preference.

**Reasoning:**

Marty sees his own admin surface; Roianne sees hers. Small personal customization, no cost to others, no dilution of ranch identity. A light touch of ownership.

---

#### Part 8 — Self-service Contributor creation and Shortcut install flow

**The goal:** Marty and Roianne can add their own Contributors (friend Jeff, visiting grandchild, seasonal helper) without needing Matt to configure anything. This is a Phase 1 feature.

**Flow for adding a Contributor (from Team page):**

1. Owner or Admin taps "+ Add team member" with role = Contributor
2. Fills basic info: display name, phone number (optional)
3. Taps Create
4. System generates a unique upload token server-side
5. Screen advances to "Send to [name]'s phone" with three actions:
   - **Send via iMessage** — opens iOS share sheet with a pre-composed message containing the one-time install link
   - **Send via email** — opens email composer with pre-filled subject/body and the install link
   - **Copy link** — copies link to clipboard for any other channel
6. The new Contributor receives the link, taps it on their iPhone
7. iOS opens the install URL, which is a Cloudflare Worker endpoint that:
   - Validates the one-time token (24-hour expiry, single-use)
   - Redirects to the hosted iCloud Shortcut install URL with the token embedded as a query parameter
8. iOS Shortcuts app opens with the prompt "Add Shortcut to your library?"
9. The Shortcut imports with the upload token pre-filled (via "Ask When Import" variable)
10. Contributor runs the Shortcut for the first time; first successful upload flips their status from "Not yet activated" to "Active"

**Shortcut hosting and specification:**

The master Shortcut is pre-built and hosted at `/public/shortcut/summers-ranch-upload.shortcut` (or on iCloud at a fixed URL). Its actions are:

1. Receive images from share sheet (accepts photos, Live Photos)
2. "Ask When Import" variable: `upload_token` — pre-filled during install via the one-time link
3. Ask for Input (Number): tag number
4. Get Contents of URL: `GET /api/resolve-tag?tag=<input>` with `Authorization: Bearer <upload_token>` header, returns JSON with `{ matches: [{ animalId, label }, ...] }`
5. Choose From List: shown always (per A34), header `Matches for <input>:`, items are `label` strings + final "Add new tag" entry
6. If "Add new tag" chosen: prompt `Use tag <input>?` Yes/No; Yes commits as new animal with the typed number, No opens Text input for letter tags
7. For each selected image: Get Contents of URL: `POST /api/upload` with binary body, `Authorization: Bearer <upload_token>` and `X-Animal-Id: <resolved>` headers
8. On all-202 success: brief confirmation toast (no sound per Part 10)
9. Shortcut closes

**Who builds the Shortcut:**

The .shortcut file must be created in the iOS Shortcuts app itself (it cannot be generated programmatically from source by Claude or the coding agent). Matt builds the master Shortcut once, per the specification above, and uploads it to the hosting location. Coding agent builds the surrounding infrastructure: the one-time install link endpoint, the token validation, the Team page UI, and the redirect logic.

**Implications for Phase 1 scope:**

This adds three Phase 1 deliverables beyond what was in A32:
- The Worker endpoint that validates the one-time install token and redirects to the iCloud Shortcut URL
- Hosted Shortcut file itself (built by Matt, not the coding agent)
- The Team-page "Send to phone" flow with iMessage/email/copy actions

**Reasoning:**

A32 originally assumed Matt would configure each Contributor individually. That scales poorly as soon as Marty wants to add a friend on a weekend. Self-service Contributor creation is the difference between Marty needing to call Matt every time someone new shows up, and Marty handling it himself in 30 seconds. The Shortcut install link solves the hardest UX problem — how does a technologically uncomfortable user install a custom iOS Shortcut with an embedded credential — by making the whole thing a single tap on a text message.

---

#### Part 9 — Ownership transfer (two-step)

Transferring ownership is rare but consequential. Two-step mutual acknowledgment:

**Step 1 — Owner initiates:**
- Owner opens Site → Ownership transfer section
- Selects an Admin from a dropdown (only Admins are eligible; Editors and Contributors cannot be Owners without first being promoted to Admin)
- Types the target user's display name as a safety check
- Taps "Propose transfer"
- System creates a pending-transfer record and notifies the target via all available channels (email + SMS if configured + in-app banner on next login)

**Step 2 — Target accepts or declines:**
- On next login (or via notification link), target sees a banner: *"Matt has proposed transferring ownership of Summers Ranch to you. [Accept] [Decline]"*
- Accept: roles swap immediately; target becomes Owner; previous Owner becomes Admin; audit log entry created; both parties receive confirmation notifications
- Decline: transfer cancels; previous Owner notified; no role change
- Automatic expiry: 7 days with no action cancels the transfer

The current Owner can cancel a pending transfer at any time before acceptance.

**Reasoning:**

Single-step transfer with just a confirmation dialog is too dangerous — if someone compromises the Owner's account, they can transfer ownership before the real Owner notices. Two-step requires the legitimate target to actively accept, which provides a defensive pause and a natural point for the incoming Owner to confirm they were expecting the transfer.

---

#### Part 10 — Cow moo removed

The cow moo confirmation sound from A32 is removed. No audio plays on upload success.

The original framing ("subtle, restrained, quiet acknowledgment") was aspirational, but audio confirmations in a rancher's workflow tend to either be ignored (phone on silent) or obtrusive (phone in a pocket near cattle, unexpected audio startles animals or the user). The visual "✓ Sent!" confirmation from A32 is sufficient.

The per-user sound toggle in Notifications is also removed from the Phase 1 spec, as there are no sounds to toggle.

This decision is reversible by future amendment if the visual confirmation proves insufficient in practice.

---

#### Part 11 — Default user list at launch (supersedes A35/A37)

- **Matt** — Owner
- **Marty** — Admin
- **Roianne** — Admin
- **Marty and Roianne's son** — Editor
- **Marty and Roianne's daughter** — Editor
- No Contributors at launch; added by Admins via self-service as needed

Editors have full herd operational access including record edits, pending-tag resolution, upload-issue resolution, Contributor review, and documents. They do not see financial data (when financial data is added to the site), inquiry inbox, user management, or site config.

---

#### Part 12 — Schema additions

**AdminUser** (extends A35/A37):

```typescript
interface AdminUser {
  // ... existing fields from A35/A37
  displayName: string
  email: string
  phone: string | null
  timeZone: string               // IANA zone, e.g., "America/Los_Angeles"
  adminAccentColor: string | null  // hex or null = ranch default
  passkeyDevices: Array<{
    credentialId: string
    nickname: string
    deviceType: string           // inferred from user-agent at registration
    addedAt: string
    lastUsedAt: string | null
  }>
  recoveryCodes: Array<{         // Owner only; null/empty for other roles
    codeHash: string
    used: boolean
    usedAt: string | null
  }> | null
  activationStatus: 'not-yet-activated' | 'active'  // flips on first successful token use for Contributors
}
```

**PendingOwnershipTransfer** (new):

```typescript
interface PendingOwnershipTransfer {
  id: string
  fromUserId: string
  toUserId: string
  proposedAt: string
  expiresAt: string     // proposedAt + 7 days
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
  resolvedAt: string | null
}
```

**AuditLogEntry** (new):

```typescript
interface AuditLogEntry {
  id: string
  timestamp: string
  actorUserId: string
  action: string              // enum of audit-logged actions
  targetUserId: string | null
  context: Record<string, unknown>  // action-specific payload
}
```

**SiteConfig** (new, single-record):

```typescript
interface SiteConfig {
  ranchName: string
  tagline: string
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null  // optional, privacy consideration
  publicSurfaceToggles: Record<string, boolean>  // Phase 2
  newUserNotificationDefaults: Record<string, boolean>
  styleDirectionId: string       // references chosen style preview direction
}
```

---

**Reasoning (amendment as a whole):**

The five-sub-page structure matches ecosystem convention (GitHub, Slack, Notion, Linear all use sub-paged settings rather than single-scroll) and provides clean role-gating boundaries. The self-service Contributor flow is the most structurally consequential addition — it's the difference between a team that needs ongoing admin intervention to grow and one that grows organically. The cow moo removal is a quiet correction of an earlier aesthetic choice that didn't survive sober consideration. The per-user accent color is a small piece of personality that costs nothing to implement and adds real ownership feeling.

---

### A41. Compare view (P7 resolution), Shortcut distribution correction, web upload fallback, platform scope

**Supersedes:** Resolves P7. Corrects A40 Part 8's Shortcut distribution implementation. Clarifies platform scope for the upload pipeline.

**What changes:**

This amendment resolves the last open workshop (P7 compare view), corrects an implementation error in the A40 Shortcut distribution flow, clarifies Android/iOS platform scope, and adds a browser-based upload fallback for admins.

---

#### Part 1 — Compare view (resolves P7)

**Reframe from the original P7 stub:** Compare is not primarily an evaluation tool (buyers can already see all 3-5 available animals on two scrolls at Summers Ranch scale). It is a **sharing tool** — a buyer selects 2-3 animals and shares a URL with a spouse, business partner, or co-decision-maker who can view them side-by-side without browsing the full site themselves. This reframing simplifies the design and clarifies scope.

**Core design:**

- **URL pattern:** `/compare?animals=<comma-separated-tags>`. The URL is the source of truth — no server-side state, no user session, no localStorage.
- **Scope:** public surface, no authentication. Admins use the herd list with multi-sort for their own comparison needs (breeding pairings, culling decisions) — compare is not needed on the admin side.
- **Max animals:** 3. Mobile viewport constraints make 4+ unusable.
- **Attribute set:** mirrors the card-back section vocabulary (identity, pedigree, registration, performance, sale details). Absent values render as muted *"not disclosed"* rather than blank — in compare, absence is meaningful information (different from the card-level rule where empty sections are hidden).
- **Photos:** single primary photo per animal (side-profile throne-holder per A36). No carousel, no Live Photo motion in compare.
- **Ask affordance:** "Ask about these animals" button at the bottom of the compare surface opens the inquiry form (per A24) with all selected animals pre-referenced in the subject/body.

**Mode-toggle selection UX (not long-press):**

Compare mode is entered via a **Compare toggle** in the herd list controls row (same strip as sort, filter, view toggle). When off (default), swiping and tapping work normally. When on:

- Taps on cards add/remove them from the compare selection
- Selected cards show a subtle selection indicator (checkmark in corner + colored outline via `--color-accent`)
- A compare tray appears fixed to the bottom of the viewport, showing thumbnails of selected animals and a "Compare" button
- Tray's "Compare" button opens `/compare?animals=...` with the current selection
- Tray has an "Exit compare mode" affordance that deselects all and returns the herd list to normal

**Why mode-toggle over long-press:**

Long-press is an iOS-developer convention, not a user-discoverable pattern. For an audience that includes older ranchers and their spouses, a labeled "Compare" button in the controls row is clearer. Mode-toggle also avoids colliding with the existing tap/swipe/pinch vocabulary during normal browsing.

**Visibility rule — hide compare when nothing to compare:**

The compare toggle renders in the controls row only when the current active filter matches 2+ animals. A filter that matches 0 or 1 animal hides the toggle entirely — offering a Compare button when there's nothing to compare is silly and draws attention to an absence.

Rule extends: if a user enters compare mode, selects animals, then changes filter to a set with fewer than 2 matching animals, the mode gracefully exits without an error dialog.

**Phase placement:**

- **Phase 1:** URL pattern is locked and routable. `/compare?animals=...` renders a placeholder page that lists the selected animals with names, tags, and primary photos, plus a message: *"Side-by-side comparison coming soon. In the meantime, here are the animals you're looking at."* The compare toggle in the herd list is hidden in Phase 1 (since there's nothing to toggle into).
- **Phase 2:** Full compare surface build-out — side-by-side attribute grid, compare toggle active in the herd list, inquiry integration, OpenGraph composite for shared URLs (per A31 pattern).

Phase 1 locks the URL pattern so buyers who discover or bookmark compare URLs during Phase 1 see a graceful placeholder rather than a 404.

**Schema:**

No schema changes. Compare is URL-only; the data model is unchanged. The compare page reads animal records at render time and joins them in the view layer.

---

#### Part 2 — Shortcut distribution correction (supersedes A40 Part 8)

A40 Part 8 described the Shortcut install flow as using a Cloudflare Worker that redirects to a hosted iCloud Shortcut with the token embedded as a URL parameter. **This doesn't work** — iCloud Share Links for Shortcuts don't natively accept URL parameters to pre-fill Import Questions. Users following the link would be prompted to type the token at install time, which defeats the single-tap goal.

**The actual mechanism:**

Matt builds the master Shortcut once in the iOS Shortcuts app, with an `upload_token` variable as a Text action at the top. Matt exports the Shortcut as a `.shortcut` file (binary format) and commits it to the repo (e.g., `src/shortcuts/summers-ranch-upload-base.shortcut`).

A Cloudflare Worker endpoint — `GET /install/shortcut?install_id=<uuid>` — does the token injection:

1. Validates the one-time `install_id` (24-hour expiry, single-use)
2. Retrieves the associated Contributor's upload token from the database
3. Reads the base `.shortcut` file
4. Programmatically substitutes the token into the right bytes of the file
5. Returns the personalized file with `Content-Type: application/x-apple-shortcut`
6. Marks the install_id as consumed

When the Contributor (Jeff) taps the install link on their iPhone, iOS downloads the personalized `.shortcut` file and offers to install it. The Shortcut imports with the token already embedded — no prompt, no typing.

**Why this works:**

- `.shortcut` files are a documented Apple format; substituting values within them is byte-level string manipulation, not an Apple-API interaction
- The Worker uses no Apple Developer account, no iCloud API, no CloudKit
- One-time links expire after use or 24 hours, limiting replay risk
- The token never appears in the URL (only in the signed install_id), so if a text message is intercepted or forwarded, the actual credential isn't exposed beyond the single install

**Fallback if byte-substitution proves fragile:**

If the `.shortcut` file format changes in a future iOS version and byte-substitution breaks, the Worker can fall back to serving the base Shortcut unchanged, and Jeff would be prompted to type the token at install time. The one-time install link would include the token in the URL as a query parameter for manual copy-paste. Degraded but functional.

**Updated implementation checklist:**

1. Matt builds the master Shortcut once, matching the spec in A40 Part 8 (actions: receive images → ask tag number → resolve via API → picker with identity labels → per-file upload with token auth)
2. Master Shortcut is committed to the repo as `src/shortcuts/summers-ranch-upload-base.shortcut`
3. Coding agent builds the Worker endpoint at `GET /install/shortcut?install_id=<uuid>` with token-injection logic
4. Coding agent builds the "Send to phone" flow in `/admin/settings/team/` that generates one-time install_ids and produces the install URL for iMessage/email/copy

---

#### Part 3 — Platform scope for the upload pipeline

The Shortcut pipeline (A32 + A34 + A40) is **iOS only** through at least Phase 2. There is no equivalent on Android for these reasons:

- iOS Shortcuts have no direct Android equivalent that ships with the OS
- Android's share-sheet + automation ecosystem (Tasker, IFTTT, Google Shortcuts) varies widely by device, launcher, and Android version
- Designing for both platforms simultaneously would require a dual design track that doesn't serve the current user base

**Current and foreseeable users** (Matt, Marty, Roianne, their children, friend Jeff if he joins) are all iPhone users. Android support is deferred until there's genuine Android demand.

**Workflow for Android-using contributors:**

If a ranch helper uses an Android phone (e.g., a future Jeff-equivalent), the practical workflow is:

1. Android user takes photos on their phone
2. Sends photos to an iOS-using admin (Marty or Roianne) via text message, AirDrop (doesn't work), Google Photos share, or email
3. iOS-using admin uploads the photos via their own Shortcut on behalf of the Android user, tagging with the correct animal

This is approximately how the workflow would have functioned without any new tool, but now the iOS-using admin has the fast Shortcut pipeline on their end. No degraded experience for the Android user; they just route through a trusted intermediary.

**If Phase 2 Android demand materializes:**

The likely path is a Tasker profile equivalent distributed similarly to the iOS Shortcut — a pre-built Tasker XML exported from a reference Android device and distributed with token injection via the same Worker pattern. Not a Phase 1 or Phase 2 commitment, but the architecture remains parallel enough that if Android support becomes necessary, the server-side API (A32's `/api/resolve-tag` and `/api/upload` endpoints) works without modification.

---

#### Part 4 — Web upload fallback (`/admin/upload/`)

To give admins a browser-based upload option (useful when the phone Shortcut isn't handy, or for larger batches from a laptop), a Phase 1 web upload page is added at `/admin/upload/`.

**Availability:** Owner, Admin, Editor. Contributors cannot use the web upload (they don't have web admin access at all per A37). Contributor upload remains exclusively via the Shortcut pipeline.

**Flow:**

1. User navigates to `/admin/upload/`
2. Tag prompt — same "always-confirm picker" flow as the Shortcut (A34), but rendered as a web form
3. Large file picker / drag-and-drop zone for images
4. Client-side progress bar per file during upload
5. Each file posts to the same `/api/upload` Worker endpoint the Shortcut uses, with session-cookie-based auth substituted for token-based (admins are web-authenticated via passkey at `/admin/login`)
6. Batch ID generated once per upload session (web visit), applied to all files uploaded in that session

**Design:**

Minimal page — drag-and-drop zone, tag picker above, "Upload all" button, progress list below. No animations, no marketing copy. It's an admin utility, not a consumer surface.

**Why include this:**

- Android-using admins (if any ever exist) have a non-Shortcut option
- Laptop/desktop uploads for larger batches (e.g., processing an imported photoshoot) don't require shuttling files to a phone first
- It's cheap to build because the Worker endpoint already exists (the web page is a thin UI layer)
- It serves as a backup if a user's Shortcut is broken or they haven't installed it yet

This is a Phase 1 deliverable.

---

#### Part 5 — Schema and URL additions

No schema additions. URL additions:

- `/compare?animals=<tags>` — public, Phase 1 placeholder, Phase 2 full surface
- `/install/shortcut?install_id=<uuid>` — Worker endpoint, Phase 1
- `/admin/upload/` — admin web upload page, Phase 1

---

**Reasoning (amendment as a whole):**

The P7 reframe from evaluation-tool to sharing-tool is the right one at Summers Ranch's scale and for the likely user base. Buyers who are actively browsing don't need a dedicated compare surface when there are only 5 animals available; buyers who are sharing with a co-decision-maker benefit hugely from a single-URL side-by-side view.

The Shortcut distribution correction is a meaningful architectural fix — the original A40 Part 8 implementation would have silently failed at the key one-tap goal. Worker-generated personalized `.shortcut` files achieve the intended UX with no Apple Developer account and no CloudKit.

Explicit iOS-only scoping prevents the spec from implying cross-platform support that doesn't exist. The Android-user-routes-through-admin pattern is a reasonable degradation, not a blocker; the web upload fallback gives admins a universal option.

The compare-mode toggle approach resolves the long-press concern without compromising discoverability. Hiding the toggle when there's nothing to compare maintains the "better empty than wrong" principle consistently across surfaces.

---

## Pending workshops (not yet locked)

These items are flagged for future workshopping. None of them block the current spec's Phase 1 build order.

### P1. Motion / video on cards — RESOLVED 2026-04-17

Resolved into amendments A10, A11, A12 (see below).

### P2. Repository layout — RESOLVED 2026-04-17

Resolved into amendments A13-A19 (see below).

### P3. Admin surface model — RESOLVED 2026-04-19

Admin architecture and authentication locked in A21-A22. Surface contents (Dashboard folded into Herd landing, animal detail edit affordances, navigation pattern, progressive disclosure) locked in A38.

### P4. Share sheet mechanics — RESOLVED 2026-04-18

Outgoing half resolved in A31 (OpenGraph / Twitter Card previews with build-time card-front composites). Incoming half resolved in A32 (iOS Shortcut upload pipeline with fast-ack Worker, R2 original preservation, identity-based tag disambiguation).

#### P4 historical context (preserved for reference)

**Incoming upload-UX observations (2026-04-18, from Matt's Shortcut testing):**

The current v1 Shortcut PUTs photos directly to GitHub's Contents API. Two UX problems observed:

- **Uploads are slow** (30-90 seconds per photo over LTE). Photo is base64-encoded into JSON body, sent as one HTTP PUT with no chunking. The phone UI blocks waiting for response.
- **Uploads are cancellable.** Shortcut runs in foreground. If Marty gets impatient and taps Cancel, or the phone locks, or he switches apps, the upload aborts. He has no confidence the upload will complete, which creates background anxiety ("did this actually send?").

The desired behavior is **iMessage-like**: tap send, the system handles it reliably in background, the sender app can be dismissed, uploads survive network loss and resume automatically.

**Three architectural paths for Phase 2:**

1. **iCloud Drive intermediary.** Shortcut saves to `iCloud/Shortcuts/SummersRanchInbox/`. iOS's native iCloud Drive daemon handles background upload to Apple's CDN. A GitHub Action polls iCloud via CloudKit API on a schedule, pulls new files, commits to `images/inbox/`. Cleanest UX but requires Apple Developer account + CloudKit setup.

2. **Cloudflare R2 with presigned PUT + background URLSession.** Shortcut requests a presigned PUT URL from a Cloudflare Worker, uploads via iOS's native URLSession background upload API (survives app dismissal). A Worker subscribes to R2 events and forwards to GitHub. Most Phase-2-aligned since R2 is already in the stack. Requires Worker endpoint + R2 event handling.

3. **Cloudflare Worker as fast-ack upload proxy (minimum viable).** Shortcut PUTs to a Worker endpoint instead of GitHub directly. Worker returns 202 Accepted in 1-5 seconds, then asynchronously commits to GitHub. Shortcut still runs foreground but finishes ~10x faster, making "is this stable?" anxiety go away. Not true background but much better.

**Recommendation:** Path 3 for Phase 2 kickoff (fast ack, keeps current conceptual model), Path 2 for Phase 2.5+ if background becomes important, Path 1 only if Marty ends up using Shortcut heavily and the CloudKit investment is justified.

**To be workshopped together with P4 outgoing. Incoming is more complex and more Phase 2; outgoing is simpler and may touch Phase 1.**

### P5. Photo quality competition — PARTIALLY RESOLVED 2026-04-19

Card-front selection resolved in A36 (single-slot side-profile throne with prescription + aesthetic scoring, availability-dependent blend, life-stage staleness curves, schema scaffolding for non-card-front surfaces).

Still open:
- **Timeline selection rubric (card back)** — chronological growth record selection
- **Gallery selection rubrics** — The Herd, The Ranch (and optional The Work) per A36 Part 8
- **Editorial / About page rubric**
- **Classifier infrastructure choice** — Phase 2 kickoff decision
- **Prefer flag × throne interaction** — installed vs. display-override
- **Challenge threshold / churn prevention** — tactical, tune once classifier produces real scores
- **Classifier uncertainty handling** — tactical, to be formalized at Phase 2 classifier implementation

#### P5 historical context (preserved for reference)

Flagged 2026-04-17; reframed in conversation from "burst discrimination" (initial misreading) to **ongoing quality competition** (actual intent).

The real problem: Marty visits the ranch, takes several photos of a calf. A few days later, visits again, takes several more. A week later, again. He never sits down and says "this is my favorite; delete the others." He just uploads everything. Within a week there may be 6-8 photos of the same calf across 3 visits. The site needs to pick which one is shown without Marty having to curate.

**The mechanism: per-animal, per-shot-type leaderboard, continuously updated.**

- Every animal has three "throne" slots: best side-profile photo, best head shot, best three-quarter shot
- When a new photo is uploaded and classified (AI classifier determines shot type and assigns a quality score), it challenges the current throne-holder for that slot
- If the new photo scores higher, it takes the throne. The previous throne-holder is demoted but preserved.
- The card's cycling photos always show the three current throne-holders.
- Over time, an animal's displayed photos can only get better, never worse.

**Dimensions to workshop:**

- **Quality scoring** — what does the AI classifier evaluate? (Sharpness, lighting, framing/composition, subject pose, subject visibility, absence of obstructions, motion blur.) Is the score a single 0-100 or a vector that gets reduced?
- **Throne challenge threshold** — does a new photo need to exceed the current throne by a margin, or any amount? A 1% improvement triggering a throne change sounds like your instinct; worth confirming. Too-low threshold causes constant churn on visually similar photos.
- **Demoted-photo preservation** — losers are not deleted. They move to a "reserves" pool visible in admin. Do they remain eligible for the Timeline (growth profile) section? Can they resurface later if the current throne photo degrades (e.g., admin reveals they were wrong about it)?
- **Timeline density by age** — the card's Timeline section showing chronological growth shouldn't render all 30+ photos of a 1-year-old. Probably one Timeline entry per life-stage-appropriate interval: newborn weekly, young-calf bi-weekly, weanling monthly, yearling quarterly, mature annually. Which photo represents each interval? The throne-holder at that time, or the best-quality photo within the interval, or something else?
- **Override patterns** — Marty's Prefer flag (§6 / §13) currently overrides automatic selection with a 1-shot-stage-lifetime duration. How does this interact with the leaderboard? If Marty Prefers photo X and photo Y later scores higher in AI evaluation, does Prefer still win until it expires?
- **Classifier uncertainty** — what happens when the AI can't confidently score a photo? (Obscured subject, poor lighting, side-profile-but-partly-occluded.) Does it default to "hold throne" (conservative: don't demote a known-good photo for something uncertain) or "challenge anyway"?
- **Seasonal / contextual rotation** — separate from quality, should cards rotate between throne-holders so the same photo isn't shown forever? Or does the 3-photo cycle (side / head / three-quarter) already provide enough rotation?

**Relationship to existing spec:**

- Extends MediaAsset schema: `qualityScore`, `qualityScoreComponents` (breakdown), `lastEvaluatedAt`
- Extends CattleMediaLink: `thronePosition` (currently holds side / head / three-quarter / none), `demotedAt` (if previously held, when displaced)
- Ties into Section 3.5 (photo selection logic)
- Ties into Section 4.2 Timeline rendering
- Ties into §13 Prefer/Hide flags
- Coverage nudges (A6 / §8.5) may fire when no photo in a shot-type exists or all candidates score below a viability threshold

**Implementation phasing:**

- Phase 1: data model fields exist on MediaAsset and CattleMediaLink even if AI classifier isn't wired up yet. Selection logic falls back to most-recent-by-shot-type. Admin Prefer/Hide flags still work.
- Phase 2: AI classifier wired up, quality scores populate, leaderboard mechanic activates. Throne takes its position as the authoritative photo-selection mechanism.

**To be workshopped. Policy decisions benefit from being locked during Phase 1 so ingest captures the right fields from day one.**

#### P5 appendix: industry-prescribed cattle photography criteria (research notes)

Research conducted during P5 framing confirms that cattle seedstock photography has **real, published, industry-specific guidelines** about what makes a "good" photo for evaluation purposes. Sources: Beef Central (Australian industry), AgWeb, Progressive Cattle, Drovers, CattleToday.com. The guidelines are consistent across sources and prescriptive.

**Positional rules:**
- Camera positioned directly off the point of the shoulder (forward = animal looks shoulder-heavy; back = hindquarter under-emphasized)
- Camera height ~1.5m, slightly crouched shooting position
- 90° angle to animal's side spine, animal's head facing forward, ears forward, legs square

**Environmental rules:**
- Ground slope: slightly uphill produces flatter backline; downhill produces "swampy" back
- Surface: grass ~4 inches tall, straw bedding, or cornstalks; NOT bare concrete/dirt/mud
- Lighting: early-morning or late-afternoon light; avoid 11am-2pm harsh overhead summer sun; flash for dark cattle even in sunlight
- Background: simple, uncluttered; tan windscreen, clean panels, or clean pasture

**Subject rules:**
- Animal cleaned of mud, manure, debris
- Head up and forward, ears forward
- All four legs visible, front square under, rear nearest camera set back enough
- Fill most of frame with the animal (but leave room for silhouette context)

**Implication for P5 scoring model:**

Quality score should split into **generic photographic quality** (sharpness, exposure, lighting quality, composition, background cleanliness) and **cattle-specific conformation presentation** (axis angle, shoulder-point alignment, camera height, head/ear position, leg visibility, full-body visibility, ground/footing quality, animal cleanliness).

Draft weighting: generic 40%, cattle-specific 60%. The cattle-specific category dominates because a beautifully-lit 30°-off-axis shot is less useful for evaluation than a modestly-lit dead-perpendicular shot. Subject to workshop refinement.

**Shot-type sub-weights:**

- **Side profile** heavily weights axis angle, shoulder-point alignment, leg visibility, full-body visibility
- **Head shots** heavily weight head/ear position; relax full-body and leg requirements
- **Three-quarter** uses ~45° target axis; same general framework with different target

**Shot-type auto-classification:**

The classifier should detect the actual shot type of each photo based on its angle, not rely on Marty's intent. A "failed side profile" at 30° off-axis should be reclassified as a three-quarter shot and compete in that bucket. Marty doesn't need to intentionally compose for each category — classifier sorts what he uploads.

**Implementation model for P5 workshop:**

- Phase 1: MediaAsset schema includes `qualityScore`, `qualityScoreComponents` (breakdown by criterion), `detectedShotType` (may differ from `assignedShotType` if manually overridden), `lastEvaluatedAt`
- Phase 2: classifier wired up. Likely starts with a general vision model (Claude vision API or similar) with structured prompt encoding the criteria above; may fine-tune a specific cattle model later if accuracy warrants
- Phase 2: Matt-override still available via Prefer flag (overrides classifier)
- Phase 2: confidence-based fallback — low-confidence criteria contribute 0 weight rather than neutral score (so ambiguous photos don't artificially inflate or deflate scores)

**To be workshopped. When we do, the specific decisions to lock are weighting ratios, shot-type angle boundaries, minimum-viable-score threshold, classifier infrastructure choice.**

### P6. Admin surface contents — MOSTLY RESOLVED 2026-04-19

Dashboard, Herd landing, animal detail edit affordances, navigation pattern, and progressive-disclosure pattern resolved in A38. Inquiries inbox resolved in A24. Pending-tags and upload-issues queues resolved in A32. Documents section scaffolded in A33 (content pass pending). Review queue resolved in A37. Settings sub-structure (Profile, Notifications, Devices, Team, Site) resolved in A40.

Still open:

- **Documents (`/admin/documents/`)** content pass — tooltip-voice writing of Photo Guidelines, Upload Instructions, Registration Forms, Industry Reference, Site Operations. Infrastructure locked in A33; words pending a targeted content session with Matt and Claude, review by Roianne.
- **Media (`/admin/media/`)** — Phase 2+. Photo library, Prefer/Hide controls, Gallery Wall candidate view.
- **Calendar (`/admin/calendar/`)** — Phase 2+. Breeding/calving/events log.

### P7. Compare view for cross-shopping buyers — RESOLVED 2026-04-19

Resolved in A41: reframed as a sharing tool (not an evaluation tool), Phase 1 URL-pattern placeholder, Phase 2 full build with compare-mode toggle, max 3 animals, URL-only persistence, "ask about these animals" inquiry integration.

#### P7 historical context (preserved for reference)

Flagged 2026-04-18. Public-side feature for buyers evaluating multiple for-sale animals against each other.

**The scenario:** a buyer browses the herd binder with a specific goal — "I'm looking for a yearling bull with strong maternal pedigree and a calm temperament." They're interested in three or four candidates. Currently, evaluating them means swiping back and forth between card backs, trying to remember which sire belonged to which animal. A compare view collapses this into a single surface where the same attributes from each animal sit next to each other.

**Two separate questions the workshop needs to answer:**

First: **is this actually warranted at Summers Ranch scale?** Marty may have only 3-5 animals for sale at any time. If a buyer's entire candidate pool is the for-sale filter, they don't need a compare tool — they already see everything on two scrolls. The argument for building it anyway: compare becomes useful as the operation grows, and the pattern is low infrastructure cost once the schema supports it. The argument against: every unused feature is UI weight and maintenance burden, and "restraint over expression" is a core principle.

Second: **if we build it, what does it look like on mobile?** The card system is already swipe-heavy (front ↔ back, card ↔ card). A selection gesture (checkbox, long-press, swipe-pin) must not collide with existing interaction vocabulary. The compare surface itself also has a mobile layout problem: columns get narrow fast at 2+ animals on a phone screen. Options include horizontal scroll with a sticky attribute column, a tab-switcher with a persistent highlighted attribute, or capping compare at 2 animals on mobile and 3 on desktop.

**Dimensions to workshop:**

- **Phase placement** — Phase 1, Phase 2, or Phase 3? Ties to scale question above. Could be Phase 2 with Phase 1 schema-level support if close to free.
- **Selection mechanism** — "Add to compare" button on the card front? Long-press? A dedicated compare-mode toggle in the binder view? Persistent tray showing currently-selected animals?
- **Selection persistence** — session-only, localStorage, or URL-shareable? A URL-encoded compare (`/compare?animals=840,842,855`) lets a buyer share "these are the ones I like" with a spouse or partner, which is real buyer behavior.
- **Max animals** — 2? 3? Bounded by screen width on mobile, probably 3 on desktop.
- **Attributes shown** — core identity (tag/name/sex/breed/age), pedigree (sire/dam), status/price/availability, registration number, performance data if disclosed. Photos: primary only, or a small thumbnail strip? Should attributes be fixed in order, or reorderable by the buyer to surface what they care about?
- **Empty / partial data handling** — "better empty than wrong" means absent attributes are hidden on cards. In compare, asymmetric data is visible by definition (animal A has performance data, animal B doesn't). The missing cell needs honest treatment (explicit "not disclosed" label? blank? inline note?) — different from card-level hiding because the comparison itself is the point.
- **Entry points** — compare accessible only from within the for-sale filter, or from the full herd binder? Admins may want to compare any two animals for their own planning (culling decisions, breeding pairings). Different modes on the same surface or entirely separate tools?
- **Integration with inquire flow** — from the compare surface, does "Ask About These Animals" let a buyer inquire about multiple at once? That's a meaningful workflow affordance if compare is meant to support actual decision-making.

**Relationship to existing spec:**

- Public surface, no auth required
- New URL pattern, probably `/compare?animals=...` with URL as source of truth
- Reuses card back section vocabulary (same attribute groupings, same "better empty than wrong" tone)
- May interact with Section 6 photo selection (compare uses a single still photo per animal, not the cycling 5s carousel)
- Touches §13 inquiry flow if multi-animal inquiries supported

**To be workshopped. Lower urgency than P4-P6 — likely Phase 2 material but worth locking the Phase 1 schema implications early so attribute selection doesn't require a backfill later.**

---

## IP plan (light-touch, per 2026-04-17 discussion)

Three concrete actions, in order of value:

1. **LICENSE.md and COPYRIGHT.md** to be drafted and committed during the repo-layout workshop. CC BY-NC-SA for docs/design, all-rights-reserved with Marty/Summers-Ranch perpetual operation license for code.
2. **Commit hygiene** — ensure all commits are attributed to Matt's real identity (already happening).
3. **Trademark filing** — "Summers Ranch" in the cattle/ranching USPTO class, filed post-launch once in commerce. $1,500-3,000 total with an attorney for filing.

Nothing beyond this is recommended until a specific scenario (someone reaches out, or Matt decides to commercialize) develops.

---

## How this file gets resolved

When all pending workshops (P4-P7) are locked and the amendments accumulated here reach a stable state:

1. I fold every amendment (A1-A27 plus whatever emerges from P4-P7) directly into `CARD-REDESIGN-SPEC.md` as edits to the relevant sections.
2. This amendments file gets deleted, or reduced to a single historical note saying "see git history for the amendment-consolidation commit."
3. The main spec file becomes the single source of truth again.

Until that consolidation happens, **this amendments file overrides the main spec** wherever they conflict. Coding agent and Matt both should check this file when questions arise.
