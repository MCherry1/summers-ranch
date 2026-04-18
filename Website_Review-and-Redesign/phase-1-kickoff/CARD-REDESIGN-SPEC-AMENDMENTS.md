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

## Pending workshops (not yet locked)

These items are flagged for future workshopping. None of them block the current spec's Phase 1 build order.

### P1. Motion / video on cards — RESOLVED 2026-04-17

Resolved into amendments A10, A11, A12 (see below).

### P2. Repository layout — RESOLVED 2026-04-17

Resolved into amendments A13-A19 (see below).

### P3. Admin surface model — PARTIALLY RESOLVED 2026-04-17

Admin architecture and authentication are locked in amendments A21-A22. The remaining work is detailing the *contents* of the admin surfaces themselves — what's on the Dashboard specifically, what Manage Herd shows beyond the herd view, what Media and Calendar and Settings contain. This is a workshop continuation, not a new workshop.

### P4. Share sheet mechanics

Matt has flagged for workshop. Two distinct dimensions:

- **Outgoing:** social share previews (OpenGraph / Twitter cards) — what gets shared when someone taps their phone's share button on a herd card or page
- **Incoming:** iOS Shortcut photo upload pipeline from Marty's phone share sheet — how the share-sheet workflow sends photos into the Cloudflare Worker ingest

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

### P5. Photo quality competition — ongoing per-animal leaderboard

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

### P6. Admin surface contents (continuation of P3)

P3's architecture and auth are resolved (A21-A25). What remains: designing the *contents* of each admin surface beyond the inquiries inbox.

- **Dashboard (`/admin/`)** — landing view after login. Contents TBD. Possible collapse into admin herd view with "Needs Attention" sort.
- **Media (`/admin/media/`)** — photo library, Prefer/Hide controls, upload, Gallery Wall candidate view. Phase 2+ but rough sketch during admin workshop.
- **Calendar (`/admin/calendar/`)** — breeding/calving/events log. Phase 2+.
- **Settings (`/admin/settings/`)** — personal (notification prefs, passkey devices, phone), user management (owner-only), site config, recovery.

**To be workshopped.**

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
