# Summers Ranch — Consolidated Specification

**Single source of truth.** Supersedes `CARD-REDESIGN-SPEC.md` v1 and folds in amendments A1-A42. The amendments file is archived at `CARD-REDESIGN-SPEC-AMENDMENTS.md` for historical reference; this document is authoritative.

**Last updated:** 2026-04-19 by Matt and Claude, session 2.

---

## 0. How to read this document

**Audience:** this spec is written for two audiences. Product-focused sections (marked 🟦) are for Matt reading through, understanding, and reviewing. Implementation-focused sections (marked 🟧) are for the coding agent to read when implementing. Sections marked 🟨 serve both.

**Style:** definitive statements about the final state. This spec says *what to build*, not *why we chose it*. Reasoning lives in git history (particularly in the amendments file). If the spec and amendments disagree, the spec wins — the amendments are historical.

**Phase scope:** Phase 1 is the initial launch build. Phase 2+ items are explicitly marked where relevant. Phase 1 is shippable without any Phase 2 features.

---

## 1. 🟦 What this is

Summers Ranch is a family-owned registered Hereford cattle operation in Sutter Creek, California. Marty and Roianne Summers have run the herd since 1998. This website is a gift from their son-in-law Matt, built to serve as:

- A public-facing catalog of their herd, organized so each animal has a meaningful presence
- A sales surface for available animals
- An operational tool for Marty and Roianne to maintain the site themselves, without needing a web developer
- A personal archive documenting the animals over time

**Design principles:**

1. **The cow is the hero.** Photographs lead, UI chrome recedes.
2. **Better empty than wrong.** When a data field is null, hide it — don't display "Not set" or "—" or a placeholder.
3. **Stale content worse than no content.** If an animal's photos haven't been updated in an appropriate window for their life stage, the system gently nudges rather than displaying outdated information.
4. **Operational innovation over presentation flash.** Admin tools matter as much as the public surface.
5. **Restraint over expression.** The design is warm but serious, never gimmicky.
6. **Discovery not duty.** Progressive disclosure reveals complexity as needed; new users see a simple, inviting surface.

**Tone:** warm but restrained. No emoji in UI copy. Industry-correct terminology where it matters (DOD, SOD, AHA) — plain language elsewhere. The site should feel useful and inspiring, not cute or gifty.

---

## 2. 🟦 The baseball card metaphor

Each animal has a "card." Cards have a front and a back:

- **Front:** visual and identity. One deliberate photograph plus six core data points and small corner affordances (ribbons, date, registration number).
- **Back:** information. Pedigree, history, stats, and a compact photo thumbnail.

The card shape is consistent; what differs is commercial status. An available animal's card front displays their side profile (evaluation shot). A not-available animal's card front displays a beauty or action shot (gallery entry). The card adapts to the buyer's likely mindset.

**Front/back photo relationship:**

The back of the card always features the side-profile throne-holder as a corner thumbnail (§4.2), regardless of availability. This is invariant — the back is the evaluation surface for any buyer curious enough to flip it.

What varies by availability is whether the front *aligns with* or *complements* the back:

- **Available animals:** front and back align on the same side profile. Both the browsing audience and the evaluating audience want the same shot — front and back are the same photo with different interaction (front static, back expandable to the chronological carousel).
- **Not-available animals:** front and back complement. The front invites with a beauty/action shot; the back evaluates with the side profile. Different photos, different purposes, unified animal.

Neither treatment is "correct" — they serve different buyer intent states. The card expresses the animal's commercial role through its front/back relationship.

**Interaction:**

- Swipe horizontally to move between animals
- Swipe vertically (or tap "Details ›") to flip between front and back
- **Slide transition, not flip** — card front and back are treated as adjacent views, not as two faces of a rotating rectangle. The literal flip animation was scrapped as conceptually broken (real baseball cards don't rotate 180° in 3D space when you turn them; they move in your hand).

Throughout this document, "flip" as a noun is avoided; the two surfaces are called "front" and "back" and the transition is a slide.

---

## 3. 🟦 The card — front

The front shows who this animal is, at a glance. One photograph fills most of the card. A small set of data points live beneath. Four corners each have a defined, narrow purpose.

### 3.1 Core contents

- **One photograph** filling the top ~75% of the card. Photo is static — no cycling, no carousel on the front. See §3.5 for photo selection.
- **Six core data points** below the photo:
  1. Tag number
  2. Name (omitted entirely if unnamed)
  3. Sex
  4. Breed
  5. Age
  6. Status
- **Four corner affordances** with defined purposes (§3.3)
- **"Details ›"** affordance on the right edge indicating the back is one swipe away

Null fields are hidden, not shown as placeholder. If a field is null, its row doesn't render.

### 3.2 Photo motion

When the user arrives at a card (swipes to it, or opens directly from a link), the front photograph plays its Live Photo motion once — approximately 2 seconds of subtle movement (cow breathing, shifting weight, ear flick) — then settles to a still. Swiping away and back replays the motion. Tapping does not restart motion (tap is reserved for the detail affordance).

`prefers-reduced-motion` users see still frames only, no Live Photo motion, on any surface.

Compact herd view (multiple cards per row) shows still frames only — no motion in that density.

### 3.3 Corner affordances

**Top-left — Distinction ribbon and/or birthday ribbon:**

- Distinction ribbon (Dam of Distinction or Sire of Distinction) when the animal has earned AHA distinction. Vertical hanging ribbon, ~34px wide × 90px tall with a chevron swallowtail bottom. DOD blue, SOD red. Uppercase stacked text reads "DOD" or "SOD" in Cinzel.
- Birthday ribbon when today is the animal's birthday, sex-coded (baby blue for males, baby pink for females). Same ribbon shape as distinction. Text reads "HAPPY BIRTHDAY" in two columns (HAPPY on left, BIRTHDAY on right) — **not** the animal's age. Uses Cinzel bold 7px, letters stacked vertically in each column.
- When both coexist: distinction in position 1 (left:12px), birthday in position 2 (left:54px). Two ribbons, side by side, no collision.

**Top-right — Availability ribbon:**

- Diagonal ribbon across the top-right corner. Appears only when the animal's status is `available`. Copy reads "AVAILABLE" (not "For Sale" — industry term is "available"). Gold gradient fill, deep-gold text in Lato 10px with 0.2em tracking, uppercase.
- Top-right is reserved exclusively for this ribbon. No other corner-right element competes.

**Bottom-left — Photo capture date:**

- Small white text rendered directly on the photo with drop shadow. No background pill, no border. Format: `Month YYYY` generally, shortened to just `Month` for photos taken in the current calendar year. Positioned ~12px from the photo's bottom-left corner. Font size ~11-12px in Work Sans with `rgba(255,255,255,0.9)` color and layered drop shadows for legibility over varied backgrounds.

**Bottom-right — Registration number:**

- Small white text on the photo with same drop shadow treatment as the date. Shows the AHA registration number when the animal is registered (e.g., "AHA #44109820"). Display only on the front — not tappable. Tapping is available on the back (see §4.4).
- Hidden entirely when the animal is not registered.

### 3.4 Ribbon interactivity

Single-tap on any ribbon opens a small tooltip near it. The tooltip adds context beyond the ribbon label (never a bare repeat). Tooltip content:

- **Available:** *"This animal is for sale. Ask about [Name] ›"* with the action as a tappable link opening the inquiry form
- **Distinction DOD:** *"Dam of Distinction — awarded by AHA, [year]. Verify on hereford.org ↗"*
- **Distinction SOD:** *"Sire of Distinction — awarded by AHA, [year]. Verify on hereford.org ↗"*
- **Birthday:** *"Happy birthday, [Name] — born [full date]"* (no navigation link)

Tooltip behavior: appears on tap (mobile) or hover (desktop), non-modal (the rest of the page remains interactive and scrollable), auto-dismisses after 5 seconds untouched, any outside tap dismisses, the tappable link within the tooltip is the only thing that navigates. This protects older users from fat-finger accidental navigation while preserving one-tap discovery.

### 3.5 🟧 Front photo selection

The front photo depends on availability status:

- **Available animal** → current side-profile throne-holder (see §14 for throne mechanics)
- **Not-available animal** → current "beauty/action" throne-holder
- **Empty throne** (no candidate photos yet) → best-available photo by aesthetic score regardless of shot type, with a coverage nudge to admin
- **Reference animal with zero photos** → stylized Hereford silhouette placeholder

The two throne slots (`cardFrontThrone` for side profile, `cardFrontBeautyThrone` for beauty/action) persist independently, so a status transition swaps the displayed photo instantly without recomputation.

The side-profile scoring rubric is fully specified in §14. The beauty/action scoring rubric is deferred — Phase 1 uses a fallback: most-recent photo among eligible shot types (`action`, `scenic`, `three-quarter`, `head`, `with-dam`, `other`) by aesthetic score alone. Side profiles are also eligible for the beauty throne with a 15-20% score penalty (see §14.9) — the penalty biases toward visual variety between front and back surfaces, while still letting a dramatically superior side profile win when the beauty pool is weak.

### 3.6 🟧 Orientation handling

Photos are tagged with orientation (`portrait`, `landscape`, `square`) via the MediaAsset schema. Card front renderers handle each distinctly:

- **Portrait:** natural fit — photo fills the photo slot with minor top/bottom padding
- **Landscape:** rendered with letterboxing (dark bars top and bottom) or cropped to focal region (admin choice per photo; default letterbox)
- **Square:** rendered centered with minor padding

Hero slots require landscape. The card front slot accepts all three orientations.

---

## 4. 🟦 The card — back

The back is the evaluation surface. Its primary content is the animal's detail sections. A compact thumbnail of the side-profile evaluation photo lives in the top-right corner, with a toggle-to-expand interaction that reveals the animal's chronological growth story.

### 4.1 Layout

From top to bottom:

1. **Header strip:** animal's name and tag, large, Playfair Display. For named animals: "Sweetheart · #840". For unnamed: "Cow #842" (sex label + tag).
2. **Corner thumbnail** (top-right): still image of current side-profile throne-holder, roughly the size of 2-3 stacked stat rows. Subtle expand affordance visible.
3. **Identity section:** sex, breed, date of birth, age, current status
4. **Pedigree section:** sire (linked to sire's card if in herd), dam (linked to dam's card if in herd)
5. **Registration section:** AHA number rendered as tappable external link with ↗ icon, opening hereford.org's registration lookup in a new tab
6. **Performance data section** (when disclosed): weaning weight, yearling weight, EPDs, whatever Marty has chosen to publish
7. **Sale details section** (when status is available): asking price, terms, inquiry CTA
8. **Progeny section** (for cows): "Calves from this cow" — linked list of offspring in the herd (plain-language label, not "progeny")
9. **History section:** significant dates (arrival, distinction awards, status changes)
10. **Gallery link:** `"[Name]'s gallery"` or `"[Sex] #[tag]'s gallery"` — text link to the per-animal gallery page
11. **Inquiry CTA** (available animals only): "Ask About [Name]" or "Ask About This Animal"

Sections render only when they have content. Empty sections don't show at all, not even as muted ghost rows (public surface). Admin surface uses a different treatment — see §8.

### 4.2 Corner thumbnail interaction

The thumbnail is a still image at small size. Tapping it toggles to expanded view:

- **Expanded:** photo grows to fill the card-back width. Card-back content remains in the background, still scrollable.
- **Not a modal.** Background content stays active. The user can scroll past the expanded photo and still read details beneath.
- **Tapping the expanded image again collapses it** back to thumbnail.

When expanded, autoplay begins (see §4.3). When collapsed, autoplay pauses and resets.

### 4.3 Expanded carousel — chronological growth story

When the thumbnail expands, the view becomes a chronological carousel of the animal's side-profile photos across their life.

**Adaptive density (internal — never surfaced to the user):**

| Life stage | Age range | Max photos | Approximate cadence |
|---|---|---|---|
| Newborn | 0-60 days | 4 | ~2 weeks |
| Young calf | 60-205 days | 5 | ~1 month |
| Weanling | 205-365 days | 3 | ~2 months |
| Yearling | 1-2 years | 4 | ~3 months |
| Mature | 2+ years | 1 per year | annual |

For a 9-year-old cow, theoretical maximum is ~23 photos; in practice far fewer since most life-stage slices won't have four photos to choose from.

**Selection within each slice:** the best side-profile photo by the §14 scoring formula, evaluated at the time of the slice. Non-winners do not appear in the carousel but remain in the per-animal gallery (§6).

**Slice scoring is consistent across the carousel.** Every slice uses the same §14 blended formula — the current throne blend (0.9/0.1 prescription-weighted for available animals, 0.7/0.3 for not-available) applies to every slice selection. The blend does not relax for older slices or for not-available animals' historical slices. A cow transitioning from available to not-available does not cause her carousel to re-rank; her historical slice winners remain stable unless photos are added, removed, or admin-overridden.

This means the growth story reads as a consistent evaluation across her life, not a "here's the most charming photo from each era" retrospective. A Phase 2+ refinement could introduce relaxed scoring for historical slices of not-available animals (treating old carousel slots as "story" rather than "evaluation"), but Phase 1 applies consistent scoring throughout.

**Autoplay behavior:**

1. Expansion triggers autoplay
2. First frame is the **most recent** photo (current throne-holder), held for 10 seconds — answers "what does the cow look like now" immediately
3. Transitions to oldest chronological photo
4. Cycles forward through each slice winner: Live Photo plays once (~2s motion), then still held ~3-5s, transitions to next
5. When the cycle returns to the current-most-recent, extended 10-second hold
6. Loops indefinitely until paused or collapsed

**Visible controls during expansion:**

- Play/pause button (top-left of expanded image, high contrast)
- Left/right chevrons at edges for manual previous/next
- Dot pager along bottom — one dot per displayed photo (not per bucket, not per life stage); tapping a dot jumps and pauses autoplay
- Close/collapse affordance (top-right of expanded image, or tap outside the image area)
- Date overlay on each frame, same treatment as §3.3

**Zero-photo slices are silently skipped.** No placeholder text, no gap indicator. The dot pager simply has one fewer dot. The absence should feel natural.

**Reduced motion:** autoplay defaults to paused. Manual advancement only. Live Photo motion replaced with still frames.

### 4.4 🟧 External links

Registration number on the back is a tappable external link to hereford.org's registration lookup, formatted as `AHA #[number] ↗`. Opens in new tab. No redirect, no intermediate "leaving site" message — the external link icon is sufficient indication.

Internal links to sire/dam cards use standard in-app navigation (sliding to that animal's card in the same herd view).

### 4.5 🟧 Back photo selection

The thumbnail shows the current `cardFrontThrone` (side profile), regardless of the animal's availability status. Unlike the front, the back always shows the side profile because the back is the evaluation surface — the buyer who got here wants the information-dense shot.

---

## 5. 🟦 Per-animal gallery

URL: `/herd/[id]/gallery`

The per-animal gallery is accessed from the card back via the `"[Name]'s gallery"` link. It shows all photos of the animal.

### 5.1 Layout

- **Page header:** `"[Name]'s gallery"` for named animals; `"[Sex] #[tag]'s gallery"` otherwise (e.g., "Sweetheart's gallery", "Cow #842's gallery", "Calf #840's gallery", "Bull #901's gallery")
- **Sort toggle:** Newest first (default) / Oldest first
- **Chronological grid** of all photos for this animal
- Tapping any photo opens a full-screen lightbox with left/right navigation and close affordance

**No classification filters.** All shot types (side profile, head, three-quarter, action, scenic, with-dam, etc.) interleave chronologically. The user who reached this page is browsing, not searching — filters would add complexity for a narrow use case.

**Shot type classifications still exist in the data layer** (from §14) but are not surfaced as filter UI.

### 5.2 🟧 Naming function

A single canonical server-side function constructs the animal's human-readable reference. Used in:

- Per-animal gallery page title
- Shortcut picker identity labels (see §11)
- Share composite titles
- Compare page references
- Audit log entries

Rules:

- `name` present → `<n>'s gallery` (e.g., "Sweetheart's gallery")
- `name` null → `<Sex> #<tag>'s gallery` — sex is capitalized, `#` precedes tag

Sex labels: "Cow", "Bull", "Heifer", "Steer", "Calf" (generic calf when sex is not yet determined or not specified).

---

## 6. 🟦 Compare view

URL: `/compare?animals=<comma-separated-tags>`

Compare is a **sharing tool**, not an evaluation tool. A buyer selects 2-3 animals and sends the URL to a co-decision-maker who views them side by side without browsing the site themselves.

### 6.1 Phase 1 scope

Phase 1 **locks the URL pattern** but ships a placeholder view. The placeholder page:
- Reads `animals` query parameter, parses comma-separated tags
- Displays each animal's name, tag, and current front photo in a simple vertical stack
- Includes the message: *"Side-by-side comparison coming soon. In the meantime, here are the animals you're looking at."*

The compare-mode toggle in the herd page is hidden in Phase 1 (since the full compare UI isn't built).

### 6.2 Phase 2 full build

- Compare-mode toggle appears in the herd controls row (sort / filter / view toggle)
- Toggle is hidden when the current filter matches fewer than 2 animals (nothing to compare)
- When compare mode is on: taps on cards add/remove from selection; selected cards show indicator
- Bottom-fixed compare tray shows selected animal thumbnails + "Compare" button
- Max 3 animals
- Compare surface: horizontal grid on desktop, horizontal scroll on mobile with sticky attribute column
- Attribute groups mirror the card-back vocabulary
- Absent values render as muted "not disclosed" (in compare, absence is meaningful — different from card-level hiding)
- Photos: single primary photo per animal (side-profile throne-holder), no carousel, no motion
- "Ask about these animals" CTA opens inquiry form with all selected animals pre-referenced
- OpenGraph composite image shows all selected animals for shareable URL previews

### 6.3 Compare is public, not admin

Compare exists only on the public side. Admins use the herd list with multi-sort for breeding pairings, culling decisions, and their own operational comparisons — no separate admin compare surface.

---

## 7. 🟦 Herd page

URL: `/herd`

The herd page is the primary browse surface. Shows all animals. Filterable and sortable.

### 7.1 Layout

**Top controls row** (sticky):
- View toggle: Cards (default) / Compact
- Sort: By tag / By age (ascending or descending) / By name
- Filter: All (default) / Available / Named / etc.
- Compare-mode toggle (Phase 2; hidden when <2 match current filter)
- Admin-only: NeedsAttention sort option (surfaces animals with active nudges first)

**Card grid:**
- **Cards view** — one card per row on mobile, 3 per row on desktop
- **Compact view** — denser grid, more per row, still frames only, front photo + tag + name + status

**Binder order** (section groupings within the single scrollable list):
1. Bulls
2. Cows
3. Heifers
4. Calves
5. Reference animals (sold, deceased, no longer owned)

Sorts apply within each section. The binder grouping itself never changes.

### 7.2 End-of-list behavior

- **Bottom:** warm rubber-band message. Something like *"That's the whole herd."* No attempt to load more; there is no more.
- **Top:** silent. Standard pull-to-refresh if supported, no explicit message.

### 7.3 Motion rules

**Herd cards are static forever — no motion on the evaluation surface.** When browsing the herd list, all cards show still frames. Motion only happens when the user swipes onto a card's front (per §3.2) — that is, when they're committed to looking at that specific animal.

This is a deliberate restraint. Motion at list density is noise, not signal. A quietly still herd grid is easier to scan than one where a dozen cattle are subtly moving in a visual field.

### 7.4 Herd landing (admin variant)

When an admin is logged in, the `/herd` page serves as their landing/dashboard. Additional affordances appear:

- **Status strip** above the list: 4 counts — inquiries awaiting response, animals to review (Contributor uploads), animals needing attention (active nudges), total animals. Counts are greyed out when zero. Sticky with the controls row.
- **FAB** (floating action button): "+ Add animal" — visible to Owner, Admin, Editor only
- **NeedsAttention sort** option available

See §8 for admin-specific surfaces and interactions.

---

## 8. 🟦 Home page

URL: `/`

A single-scroll home page that serves as both entrance and navigation. Non-technical users can scroll from top to bottom and discover the site without needing to hunt for a hamburger menu.

### 8.1 Sections (top to bottom)

1. **Hero** — ranch name, tagline, "Sutter Creek, California" location, background image of cattle
2. **Meet the herd** — kicker + title + short prose + "See the Herd" CTA; below: teaser row with 3 featured animals (photos + names/labels) linking to their cards
3. **About the ranch** — kicker + title + short prose + "Our story" CTA linking to /about
4. **Looking to buy** — shown only when 1+ animals are available — kicker + title + short prose + "See what's available" CTA linking to herd filtered to Available
5. **Get in touch** — phone, email, location, hours — inline, no form on home

All sections use the same structural vocabulary: small uppercase kicker (tracked), Playfair Display title with italic emphasis on key words, Work Sans body, tracked-uppercase CTA button.

### 8.2 Home page when no animals available

The "Looking to buy" section is hidden entirely (not shown with "no animals available" copy). Better empty than wrong.

### 8.3 Home page hero

Hero uses the ranch's best landscape photograph of cattle. Overlay scrim: pure black gradient concentrated in the bottom third only — does not tint the full photograph. Protects hero text legibility without discoloring the cattle.

Text: small uppercase kicker ("Registered Herefords · Est. 1998"), large Playfair display title ("Summers *Ranch*" with italic emphasis on "Ranch"), italic tagline, small uppercase "Sutter Creek, California" below.

---

## 9. 🟦 About, Contact, Gallery pages

### 9.1 /about

Simple long-form prose page. Ranch history, operating philosophy, family background. No form, no interactive elements. A single banner photo or small gallery can anchor the top.

### 9.2 /contact

Phone, email, physical location (optional — privacy consideration, admin controls whether it's surfaced in Site settings), visiting hours policy. Includes a simple inquiry form that posts to the inquiries inbox (see §10).

### 9.3 /gallery — "The Wall"

A curated atmospheric gallery surface. The Wall is where ranch life photography lives — landscape shots, working scenes, cattle in the field, seasonal moments. This is the one place on the site where motion can play without triggering an evaluative mindset.

**Structure:**
- **The Herd** — photos featuring identifiable animals in natural settings
- **The Ranch** — atmospheric photos of the operation (landscape, buildings, equipment, daylight moments)
- **The Work** (optional) — photos of ranch work in progress (tagging, feeding, moving cattle)

**Behavior:**
- Grid layout, photos sized by aspect ratio
- Tapping a photo opens lightbox with title, optional caption, and (if featuring a specific animal) a link to that animal's card
- Phase 2+: atmospheric surfaces are motion-eligible with deliberate per-photo enablement — a curated handful of photos play short Live Photo loops when visible

The selection rubrics for The Herd and The Ranch galleries are deferred to Phase 2. Phase 1 populates with admin-selected photos marked `galleryHerdCandidate` or `galleryRanchCandidate` (see §14).

---

## 10. 🟦 Navigation

**Persistent top nav** (public surface): home / herd / gallery / about / contact. Small, unobtrusive, Playfair Display for a touch of character. No hamburger on desktop; the home page's scroll narrative also serves as navigation.

**Mobile:** collapses to a hamburger with the same items. The home page remains the primary wayfinding mechanism for non-technical users.

**Footer:** ranch name, contact brief, privacy link, copyright line.

---

## 11. 🟦 Privacy — what's never public

The following data is **never** exposed on public surfaces, regardless of settings:

- Sale details for sold animals (the price and terms an animal sold for)
- Removal details for animals no longer owned (the reason, the buyer, the terms)
- Personal contact details beyond what's explicitly in the About/Contact pages
- GPS coordinates from photo EXIF (stripped at upload per §12)
- Private acquisition details (what Marty paid for an animal)
- Admin-set private notes on any animal record
- Contributor identity in public-facing photos (Contributors are admin-only identity)
- Financial data of any kind

Performance data and pedigree are **industry-standard public information** and may be surfaced when the admin chooses.

**Architectural commitment:** the public surface does not authenticate users, ever. There's no "log in to see sale details" — sale details for sold animals simply don't exist in the public data model. Privacy is by absence, not by permission.

---

## 12. 🟦 Admin architecture

Admin surfaces live at `/admin/*`. Admin is its own URL space — public surfaces never change based on login state. A buyer browsing `/herd` sees the same herd page whether an admin is logged in somewhere else or not. Login/logout has no public effect.

### 12.1 Admin URL structure

- `/admin/login` — passkey login (see §12.2)
- `/admin/` → redirects to `/admin/herd`
- `/admin/herd` — herd landing (herd list with admin affordances per §7.4)
- `/admin/herd/[id]` — animal detail with inline-edit
- `/admin/inquiries/` — inquiries inbox (§13)
- `/admin/review/` — Contributor upload review queue (§14)
- `/admin/pending-tags/` — pending tag resolution queue (§15)
- `/admin/upload-issues/` — upload errors and anomalies (§15)
- `/admin/documents/` — authored documentation (§16)
- `/admin/settings/` — Profile sub-page (§17)
- `/admin/settings/notifications/` — Notifications (§17)
- `/admin/settings/devices/` — Devices (§17)
- `/admin/settings/team/` — Team management (§17)
- `/admin/settings/site/` — Site config (§17)
- `/admin/upload/` — web upload fallback (§15.3)

### 12.2 🟧 Authentication — passkeys (WebAuthn)

**Passwordless.** No passwords, ever. Authentication is exclusively via WebAuthn passkeys (biometric: Face ID, Touch ID, Windows Hello, or hardware key).

**Why passkeys:**
- Marty and Roianne don't need to remember or type anything
- No password reset flows, no phishing surface
- Face ID / Touch ID is faster than typing even short passwords
- Matt's secret reveal: Marty doesn't know passkeys exist yet — the first time he taps `/admin/login` and his phone Face IDs him in, the reaction will be astonishment

**Flow:**
- User visits `/admin/login`
- System checks for a registered passkey on this device
- If present: biometric prompt, login completes
- If absent: registration flow (available only with a valid invite link from Owner/Admin, per §17.5)

**Device management:** each user can register multiple passkeys (phone, laptop, tablet) — see §17.3.

**Recovery:** different mechanics by role — see §17.6.

### 12.3 🟧 Initial provisioning

The first time the site deploys, an `admin-users.json` baseline seeds the Owner account. Matt's Owner record is created with his email and phone; on first visit to `/admin/login`, he registers his initial passkey.

Subsequent users (Marty, Roianne, kids) are added via the Team page (§17.5) — email invite links trigger their passkey registration flow.

### 12.4 🟧 RBAC — four-tier model

Four roles, with capabilities that nest:

| Role | Purpose |
|---|---|
| **Owner** | Full access. Only one Owner per site. Transferable via two-step process (§17.7). |
| **Admin** | Full operational access. Can add users below Admin. Cannot manage Owner, cannot transfer ownership. |
| **Editor** | Full herd operational access — record edits, Contributor review, pending tag resolution, upload issues, documents. **No** financial data, **no** inquiry inbox, **no** user management, **no** site config. |
| **Contributor** | Upload-only via Shortcut or web fallback. No admin web UI access beyond their own Profile and Notifications pages. |

Capability matrix:

| Action | Owner | Admin | Editor | Contributor |
|---|---|---|---|---|
| Edit animal records | ✓ | ✓ | ✓ | — |
| View/respond to inquiries | ✓ | ✓ | — | — |
| Review Contributor uploads | ✓ | ✓ | ✓ | — |
| Resolve pending tags | ✓ | ✓ | ✓ | — |
| View/edit documents | ✓ | ✓ | ✓ | — |
| Upload photos | ✓ | ✓ | ✓ | ✓ |
| View audit log | ✓ | — | — | — |
| Add/remove team members | ✓ | Contributor only | — | — |
| Change user roles | ✓ | — | — | — |
| Site config (style, metadata) | ✓ | — | — | — |
| Ownership transfer | ✓ | — | — | — |
| View financial data | ✓ | ✓ | — | — |

**Default launch users:**

- Matt — Owner
- Marty — Admin
- Roianne — Admin
- Son — Editor
- Daughter — Editor
- No Contributors at launch; added as needed via §17.5

### 12.5 🟧 Contributor trust states

Each Contributor has a trust state:

- **default** — uploads auto-publish immediately, compete in throne algorithm like any other upload. Initial state for every new Contributor.
- **review-required** — uploads land in `/admin/review/` queue, not visible publicly until approved. Contributor's phone UX unchanged — they don't know their uploads are gated. Set by Owner or Admin when quality degrades.
- **revoked** — uploads are silently rejected at the server. Contributor sees success messages on their phone but nothing persists. Set when a Contributor should no longer contribute but admin doesn't want an explicit confrontation.

Trust state is toggled from the user's row in `/admin/settings/team/`.

### 12.6 Admin navigation

**Mobile bottom nav** (4 items):
- Herd (landing)
- Inbox (inquiries)
- Review (Contributor uploads; hidden when there are none and user has no review capability)
- More (opens a list: Pending tags, Upload issues, Documents, Settings, Log out)

**Desktop left rail** (240px sidebar):
- Herd
- Inquiries
- Review
- Pending tags
- Upload issues
- Documents
- Settings
- Log out (bottom)

Editor role hides Inquiries in both nav variants. Contributor role shows only a minimal nav (Profile, Notifications, Log out).

### 12.7 🟦 Inline editing

All editable fields on `/admin/herd/[id]` use inline edit:

- Field displays read-only by default
- Tap/click the field's value or an edit affordance to begin editing
- Input field appears in place; user types
- **Auto-save on blur.** No "Save" button.
- Server-side validation; errors inline beneath the field
- Per-field audit trail captured automatically (timestamp, user, old value, new value)

**Chained input progression:** when editing multiple fields in sequence (e.g., filling in a new calf's initial data), the next-logical field auto-focuses when the current field commits. Zero cursor friction.

### 12.8 🟦 Progressive disclosure

Animal records contain many optional fields. Progressive disclosure patterns:

- **Plain-language section labels.** Translation map from industry terms to everyday language. "American Hereford papers" instead of "Registration." "Calves from this cow" instead of "Progeny." "Sire and dam" instead of "Parentage." Admin and public see the same plain labels.
- **Muted ghost-lines for empty-but-relevant sections** (admin only) — sections that could have content but don't. Gives admin a sense of what's available to fill without cluttering the public view.
- **Sections materialize only when relevant** — some sections are hidden entirely until the animal enters a state where they apply. Sale sections don't exist for animals never listed. Progeny sections don't exist for animals that haven't had calves.

**Nudges fire on completion.** When a field is filled in such that an animal's required data is complete plus no more than 2 optional fields are missing, system fires a completion nudge celebrating the milestone. Nudges never fire on empty animals (no "please fill this in" pressure).

### 12.9 🟦 Tooltips

Every field has a "?" affordance (small, muted) that reveals a plain-language explanation in a tooltip. Voice is rancher-to-rancher, warm, 1-3 sentences. Content pass planned as a separate writing task (~20-30 field tooltips) involving Matt, Claude, and Roianne for voice validation.

**Infrastructure is Phase 1.** Content pass may land post-launch; tooltip affordance is built and can be populated incrementally.

---

## 13. 🟦 Inquiries inbox

URL: `/admin/inquiries/`

All inquiries submitted via the public site (from card-back "Ask about this animal" CTAs, contact page form, or compare page "Ask about these animals") land here.

### 13.1 Built-in, not Formspree

Formspree was scrapped. The inbox is part of the site itself — a Cloudflare Worker endpoint receives form submissions, writes to R2 or the database, and dispatches notifications per user preferences.

### 13.2 Inbox UI

- List view: sender name, timestamp, subject (auto-generated from referenced animals or "General inquiry"), preview of message, unread indicator
- Detail view: full message, sender contact info, referenced animals (linked to their cards), reply composition field
- Actions: mark as read, archive, reply via default mail client
- Replies sent through the user's own email — the site doesn't send email on the user's behalf; it opens a pre-composed draft in the default mail app

### 13.3 Notifications

When a new inquiry arrives:
- Email to each user whose "New inquiry received" notification pref is enabled
- SMS via Twilio to each user whose SMS pref is enabled (if phone number set)
- Desktop push notification (Phase 2+)

Notification prefs per user — see §17.2.

---

## 14. 🟦 Photo system — upload, classification, throne mechanics

The photo system has three layers: upload (how photos enter the system), classification (what kind of photo this is), and throne mechanics (which photo wins which slot).

### 14.1 🟦 Upload — Shortcut pipeline (iOS)

**Phase 1: iOS only.** Android users route through an iOS admin (§14.4).

Users (admins and Contributors) install a personalized iOS Shortcut on their phone. The Shortcut accepts photos from the iOS share sheet and uploads them to the site.

**Shortcut distribution flow:**
1. Admin (Owner or Admin) creates a new Contributor (or adds a device to an existing user) via `/admin/settings/team/`
2. System generates a one-time install link
3. Admin sends the link via iMessage, email, or copy-paste
4. Recipient taps the link on their iPhone
5. Link hits `GET /install/shortcut?install_id=<uuid>` — a Cloudflare Worker endpoint
6. Worker validates the one-time install_id (24-hour expiry, single-use), retrieves the associated upload token, reads the base `.shortcut` file from the repo, programmatically substitutes the token into the right bytes, returns the personalized file with `Content-Type: application/x-apple-shortcut`
7. iOS downloads the `.shortcut` file and offers to install it
8. Shortcut imports with the upload token already embedded — **no prompt, no typing, single tap**
9. First successful upload flips the user's `activationStatus` from `not-yet-activated` to `active`

**Why byte-substitution, not iCloud links:** iCloud Share Links don't natively accept URL parameters to pre-fill Import Questions. The Worker-generated personalized file is how apps like Data Jar handle this. No Apple Developer account needed.

### 14.2 🟦 Shortcut mechanics (runtime)

Matt builds the master Shortcut once in the iOS Shortcuts app. Its actions:

1. Receive images from share sheet (accepts photos, Live Photos including MOV component)
2. "Ask When Import" variable `upload_token` — pre-filled during install via byte substitution
3. **Tag prompt** — numeric numpad input. Header reads `"Tag number (press Enter to skip for ranch-general)"`. Three outcomes based on input:
   - **Numeric value entered:** proceed to step 4 (tag resolution)
   - **Empty input + submit:** skip to step 7 as a ranch-general upload (no `X-Animal-Id` header)
   - **Letter-containing tag:** submit opens the text-input fallback (same as step 6's "No" branch) to capture tags like "109A"
4. API call: `GET /api/resolve-tag?tag=<input>` with `Authorization: Bearer <upload_token>` — returns `{ matches: [{ animalId, label }, ...] }`
5. Picker shown **always** (never auto-proceeds, even with a single match), header `"Matches for <n>:"`, items are identity-labeled strings (e.g., "Sweetheart (Cow, 9yr)"), plus a final "Add new tag" entry
6. If user chooses "Add new tag": `"Use tag <n>?"` Yes/No prompt. Yes → commits as new animal placeholder with the typed tag. No → opens text input for letter tags (escape hatch for "109A" style tags).
7. For each image: `POST /api/upload` with binary body, `Authorization: Bearer <upload_token>`, `X-Batch-Id: <session-generated-uuid>` headers. If an animal was resolved, additionally include `X-Animal-Id: <resolved>`. If no tag was entered (ranch-general), omit the `X-Animal-Id` header entirely — the server treats this as a ranch-general upload.
8. On all-202 success: brief visual "✓ Sent!" toast. **No audio confirmation** (cow moo scrapped).

**Full-file preservation to R2.** No client compression. HEIC, Live Photo MOV pairs, ProRAW all preserved intact. Post-processing (HEIC → WebP/AVIF, EXIF strip, GPS removal) happens server-side in Phase 2.

**Single pipeline for both animal-attached and ranch-general photos.** The tag is optional metadata, not a gate. Ranch-general photos (landscapes, atmospheric shots, herd-group photos) upload through the same Shortcut without a tag, are classified by the same classifier (§14.7.1), and are eligible for gallery surfaces (The Herd, The Ranch) but **not** eligible for card-front slots (card-front eligibility requires an attached animal).

### 14.3 🟦 Incoming share sheet

The Shortcut is the incoming share sheet mechanism. Users hitting "Share" on photos in their Camera Roll see the Shortcut as a destination (named e.g. "Send to Summers Ranch"). Tap it, go through the numpad + picker flow, and photos upload in the background. Fast-ack confirms once R2 persistence completes.

### 14.4 🟦 Web upload fallback

URL: `/admin/upload/`

For admins who don't have the Shortcut installed, or who want to upload from a laptop:

- Available: Owner, Admin, Editor. Contributors cannot use this surface (requires admin web auth).
- File picker or drag-and-drop zone
- Tag prompt using the same server resolution as the Shortcut (same picker)
- Per-file progress indicator during upload
- Posts to the same `/api/upload` Worker endpoint with session-cookie auth substituted for token auth
- Batch ID generated once per web session

Useful for: Android-using admins, laptop batch uploads, Shortcut-broken fallback, brand-new users before they've installed the Shortcut.

### 14.5 🟦 Pending tags queue

URL: `/admin/pending-tags/`

When the Shortcut creates a new animal placeholder (via the "Add new tag" path), the animal exists but has only a tag number and probably one photo. It needs to be fleshed out.

Pending tags queue shows these stubs with:
- Tag number
- Recent photos
- Quick-action to set name, sex, and DOB (minimum required fields to graduate from pending)
- Link to full edit page

Once required fields are set, the animal exits the pending queue and lives normally in the herd.

### 14.6 🟦 Upload issues queue

URL: `/admin/upload-issues/`

System anomalies surface here:
- Photos uploaded against deleted or invalid tags
- Server-side validation failures (corrupted files, unsupported types)
- Photos flagged by classifier as likely-not-cattle
- Duplicate uploads (with exceptions — see §14.6.1)
- Tag conflicts (same photo, different tag than previously assigned)

Each issue has a suggested resolution and a manual override. Non-blocking — upload pipeline keeps running while issues accumulate.

### 14.6.1 🟦 Duplicate handling with tag-upgrade

Tags are **additive metadata**, not upload content. A photo's bytes and its animal association are logically separate. This means the upload pipeline treats duplicate detection differently depending on whether the incoming upload adds new information.

**Duplicate detection** runs server-side via a perceptual hash or content hash on the image bytes (exact algorithm an implementation choice, should be robust to minor recompression). When the server detects that the incoming photo's bytes already exist in R2:

**Case A — incoming upload has `X-Animal-Id`, existing MediaAsset has no `CattleMediaLink`:**
- This is a tag upgrade. The user previously uploaded this photo as ranch-general; now they're providing an animal attribution.
- Create a `CattleMediaLink` row linking the existing MediaAsset to the incoming animal.
- Trigger throne recomputation for that animal.
- Respond `200 OK` with message "Tag added to existing photo" (distinguishable from a fresh upload's `202 Accepted`).
- Do **not** re-upload bytes to R2. No duplication.

**Case B — incoming upload has `X-Animal-Id`, existing MediaAsset has a `CattleMediaLink` to the same animal:**
- No new information.
- Reject as plain duplicate.
- Respond `409 Conflict` with message "Photo already uploaded for this animal".

**Case C — incoming upload has `X-Animal-Id`, existing MediaAsset has a `CattleMediaLink` to a *different* animal:**
- Tag conflict. Possibly the earlier tag was wrong, possibly the new one is. A human should resolve this.
- Reject the upload.
- Create an entry in `/admin/upload-issues/` with both animal references and the photo. Admin can choose to reassign, keep as-is, or delete.
- Respond `409 Conflict` with message "Photo already tagged to a different animal — flagged for admin review".

**Case D — incoming upload has no `X-Animal-Id`, existing MediaAsset has any state:**
- Tag is additive, never subtractive. A "ranch-general re-upload" of an already-tagged photo is just a duplicate.
- Reject as plain duplicate.
- Respond `409 Conflict` with message "Photo already uploaded".
- If admin wants to remove an animal association, that's a separate admin action (§12 admin surfaces), not an upload flow.

**Why this matters:**

Without tag-upgrade handling, the realistic workflow of "upload now, remember the tag later" fails silently. Marty shares a photo to the Shortcut in the middle of morning chores and skips the tag. Three weeks later he remembers — it was Sweetheart. He shares the same photo again and enters her tag. Without §14.6.1, he either gets a duplicate rejection with the tag info lost, or two copies of the photo in storage with inconsistent metadata. With §14.6.1, the system recognizes this as tag enrichment and updates the existing record.

**Out of scope:**

- Photo byte-identity across re-encoding (iOS sometimes re-encodes HEIC → JPEG during share). Perceptual hashing should handle this; if it doesn't, the re-encoded photo is treated as a new upload. Phase 2 can refine.
- Bulk tag correction. If a rancher needs to correct tags on many already-uploaded photos, the admin surface (§12) provides that; the upload pipeline doesn't.

### 14.7 🟧 Photo classification

Every uploaded photo is classified. Classification produces:

- **`detectedShotType`** enum: `side-profile`, `head`, `three-quarter`, `action`, `scenic`, `with-dam`, `detail`, `landscape`, `other`
- **Eligibility flags** (boolean): `cardFrontEligible`, `timelineEligible`, `galleryHerdCandidate`, `galleryRanchCandidate`, `editorialCandidate`
- **Scores** (0-100, nullable):
  - `prescriptionScore` + subscores: angle, legs, full-body, height, head, cleanliness, background, lighting
  - `aestheticScore` + subscores: technical, composition, lighting character, color/tonal
  - `timelineScore`, `galleryScore`, `editorialScore` — null in Phase 1 (rubrics deferred)
- **Orientation** — `portrait` / `landscape` / `square` (computed from image dimensions, not Claude)
- **Aspect ratio** — exact decimal (computed from image dimensions, not Claude)

Classification runs once per upload, asynchronously, after R2 persistence. Results write back to the MediaAsset record. See §14.7.1 for the implementation.

**How shot-type gating and scoring interact** (clarifying the separation of concerns):

Shot-type classification is a **hard gate**, not a soft signal. A photo classified as `three-quarter` does not enter the side-profile throne pool regardless of how beautiful or well-composed it is. The side-profile pool accepts only photos where `detectedShotType === 'side-profile'`.

**Within** the side-profile pool, ranking uses a blended prescription + aesthetic score (§14.8). The `angle` prescription subscore (25% weight) captures "how cleanly side-on is this specific side-profile photo" — a photo slightly off-axis gets a lower angle subscore and ranks lower than a cleanly perpendicular shot. Aesthetic scoring acts as a tiebreaker when prescription scores are close (0.9/0.1 blend transitioning to 0.8/0.2 for close candidates).

**Prescription subscores are computed only for side-profile shots.** A three-quarter or head-shot photo has `prescriptionSubscores: null` in its MediaAsset record. Prescription scoring is not a universal "how good is this photo" measure applied across all shot types — it's a conformation-specific evaluation that only makes sense for side-profile shots.

**The prescription subscores themselves are canonical.** The eight dimensions (angle, legs, full-body, height, head, cleanliness, background, lighting) reflect the conformation evaluation framework used in registered Hereford judging and AHA evaluation. They are not arbitrary system-convenience categories — they are the established rubric that livestock judges actually apply, taught in AHA junior programs and evaluation seminars. **These subscores are not subject to simplification or correlation-based pruning.** Even if two subscores appear correlated in observed data (e.g., clean operations tend to produce photos with both good cleanliness and good backgrounds), each subscore independently tests a real dimension of the evaluation standard. Future rubric work may adjust the *weighting* of these subscores in the blended prescription score (§14.8), but the subscores themselves are fixed.

**Why classify so granularly when Phase 1 only uses `side-profile` vs not?**

The sub-categorization of non-side-profile shots into `head`, `three-quarter`, `action`, `scenic`, `with-dam`, `detail`, `landscape`, `other` may feel over-engineered given that Phase 1 only gates on `side-profile`-ness for card-front eligibility. Three reasons the granularity is preserved:

1. **Same cost.** The Claude vision API call costs the same whether it outputs `"side-profile"` or `"three-quarter"`. Asking for granular classification costs no more than asking for a binary.

2. **Phase 2 rubrics differentiate meaningfully.** The deferred beauty, editorial, and gallery rubrics (§24) will weigh shot types differently. A beauty rubric might prefer `action` and `three-quarter` over `head`. A gallery curator might want variety across types to avoid five similar headshots in a row. An editorial rubric might penalize `detail` shots as not story-telling. Collapsing to binary now means reclassifying the entire library when those rubrics land, which is thousands of API calls paid again.

3. **Coverage nudges work better with specificity.** "No action shots of Sweetheart in the last 12 months" tells admin what kind of photo to capture next. "No non-side-profile shots" tells them nothing actionable.

**Shot-type usage map** (documents what each type is actually *for* in the system):

| Shot type | Phase 1 use | Phase 2+ use |
|---|---|---|
| `side-profile` | Card front (available animals), back thumbnail, timeline carousel, per-animal gallery | Same + potential scoring refinements |
| `three-quarter` | Beauty throne pool (card front for not-available animals) | Dedicated beauty rubric weighting |
| `action` | Beauty throne pool | Beauty rubric, editorial rubric (likely high weight) |
| `head` | Beauty throne pool | Beauty rubric (likely lower weight than action/three-quarter) |
| `with-dam` | Beauty throne pool | Dedicated "family/pedigree" section if added |
| `scenic` | Gallery-Ranch candidate, beauty throne pool | Atmospheric gallery curation |
| `detail` | Gallery eligibility, generally low priority | Low-priority fallback |
| `landscape` | Gallery-Ranch candidate | Primary source for Ranch gallery |
| `other` | Beauty throne pool fallback | Admin review flag if too many land here |

If a future rubric turns out to not differentiate by a particular shot type, the enum can stay — unused values cost nothing. If a missing shot type becomes useful, it can be added as a prompt/schema change without back-filling existing photos (the classifier can re-run on demand).

### 14.7.1 🟧 Classification implementation — Claude vision pipeline

**Architecture:**

After `/api/upload` writes an image to R2 and returns 202 to the Shortcut, a follow-up classification job runs asynchronously:

1. Upload handler enqueues a classification task (Cloudflare Queues or a scheduled worker — Phase 1 can use a simple immediate-fire-and-forget within the upload handler)
2. Classifier worker reads the image from R2, computes dimensions (for orientation and aspect ratio)
3. Classifier worker calls Claude API with the image and a structured prompt
4. Claude returns JSON with `detectedShotType`, subscores, eligibility reasoning
5. Worker parses, writes to MediaAsset record, triggers throne recomputation for the animal

**Model selection — do not hardcode the model ID anywhere in source.** Use an environment variable `CLAUDE_MODEL_CLASSIFIER` with a source-level fallback default:

```typescript
const model = env.CLAUDE_MODEL_CLASSIFIER || 'claude-haiku-4-5-20251001';
```

This pattern is **mandatory**. Claude models evolve faster than the site will — hardcoding pins us to a specific generation and creates a hunt-and-replace burden at every upgrade. Config-driven model selection lets Matt update the env var in Cloudflare Pages when a new Haiku generation ships, with zero code change.

Guidance for current selection: Haiku tier is the right choice for this task. Vision-capable, fast, cheap enough that even classifying thousands of photos costs pennies. Sonnet or Opus would be overkill for this bounded classification. When upgrading, keep the task at the Haiku tier unless benchmarks specifically show the higher tier materially improves classification accuracy enough to justify 3-5× the cost.

**Current as of 2026-04:** `claude-haiku-4-5-20251001`. Always use the named alias if available (`claude-haiku-latest` is not an Anthropic convention — use a dated model ID, just make it env-driven).

**API endpoint:** `POST https://api.anthropic.com/v1/messages`

**Auth:** the `ANTHROPIC_API_KEY` environment variable. Set this in Cloudflare Pages settings → Environment variables → Production. Never commit the key to the repo.

**Input shape** — base64 encoded image in a messages.create() call:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Model is env-driven, never hardcoded. Fallback default ships in source
// as a safety net but Cloudflare env var should override.
const model = env.CLAUDE_MODEL_CLASSIFIER || 'claude-haiku-4-5-20251001';

const imageBase64 = await readImageFromR2AsBase64(mediaAsset.uri);
const mediaType = mediaAsset.uri.endsWith('.heic') ? 'image/heic' : 'image/jpeg';

const response = await client.messages.create({
  model,
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageBase64,
        },
      },
      {
        type: 'text',
        text: CLASSIFICATION_PROMPT,
      },
    ],
  }],
});
```

**The classification prompt** (roughly; refine during implementation):

```
You are classifying a photograph of cattle for a registered Hereford ranch 
catalog site. Analyze the image and return JSON only (no prose, no markdown 
fences, just raw JSON parseable by JSON.parse).

Classify the shot type, then score on the two rubrics below.

SHOT TYPE CLASSIFICATION — strict boundaries:

- "side-profile": the animal's body is positioned roughly perpendicular 
  to the camera — a 90-degree view. Slight deviations (up to ~15 degrees 
  off perpendicular) still count as side-profile. Beyond ~15 degrees, 
  classify as "three-quarter" even if the photo is otherwise beautiful. 
  The purpose of this classification is to identify evaluation-usable 
  conformation shots; photos that are not genuinely side-on should not 
  claim this category.
- "three-quarter": the animal is turned 15-60 degrees off perpendicular 
  — partial side, partial front or rear visible.
- "head": headshot or facial portrait; body mostly not visible.
- "action": animal in motion (running, playing, jumping, moving 
  purposefully).
- "scenic": atmospheric shot where the animal is present but the 
  environment is co-equal or dominant.
- "with-dam": calf-with-mother composition.
- "detail": close-up of a specific feature (udder, brand, ear tag, hoof).
- "landscape": environment shot; animal not present or incidental.
- "other": doesn't fit any category above.

When in doubt between "side-profile" and "three-quarter", err toward 
"three-quarter". A mislabeled three-quarter shot harms the card-front 
selection system more than a conservatively-classified side-profile shot.

Schema:
{
  "detectedShotType": "side-profile" | "head" | "three-quarter" | "action" 
    | "scenic" | "with-dam" | "detail" | "landscape" | "other",
  "subjectPresent": boolean,  // is there a Hereford cow/bull in the photo at all
  "prescriptionSubscores": {
    // 0.0 to 1.0 each. Only populate when detectedShotType is "side-profile".
    // Return null for other shot types.
    "angle": number,           // how straight-on is the side profile (1.0 = perfect perpendicular)
    "legs": number,            // are all four legs visible and clear
    "fullBody": number,        // is the full body in frame
    "height": number,          // is camera height appropriate (roughly eye-level of cow)
    "head": number,            // is head visible and not obscured
    "cleanliness": number,     // is the animal clean (not muddy, matted, etc.)
    "background": number,      // is the background clean and not distracting
    "lighting": number         // is lighting adequate to evaluate conformation
  } | null,
  "aestheticSubscores": {
    // 0.0 to 1.0 each. Evaluate craft only — no emotional judgment.
    "technical": number,            // focus, exposure, noise
    "composition": number,          // framing, rule of thirds, balance
    "lightingCharacter": number,    // quality of light (golden hour, flat noon, etc.)
    "colorTonal": number            // color harmony, tonal range
  },
  "eligibility": {
    "cardFrontEligible": boolean,       // usable as a primary identifier shot
    "timelineEligible": boolean,        // usable in a growth timeline (usually = side-profile shots with subject)
    "galleryHerdCandidate": boolean,    // atmospheric shot of cattle in environment
    "galleryRanchCandidate": boolean,   // ranch atmosphere, cattle optional
    "editorialCandidate": boolean       // distinctive, story-telling shot
  },
  "notes": string  // 1-2 sentences on why these classifications (for debugging)
}

Important:
- If subjectPresent is false, set detectedShotType to "landscape" or "other" 
  as appropriate, and set most eligibility flags to false except possibly 
  galleryRanchCandidate.
- Return JSON only. No prose, no markdown, no code fences.
```

**Response handling:**

```typescript
// Parse the JSON from response.content[0].text
const raw = response.content.find(b => b.type === 'text')?.text ?? '';
const parsed = JSON.parse(raw);

// Compute blended scores from subscores using the weights in §14.8
const prescriptionScore = parsed.prescriptionSubscores
  ? computePrescriptionScore(parsed.prescriptionSubscores) * 100
  : null;
const aestheticScore = computeAestheticScore(parsed.aestheticSubscores) * 100;

// Write back to MediaAsset
await updateMediaAsset(mediaAsset.id, {
  detectedShotType: parsed.detectedShotType,
  prescriptionScore,
  prescriptionSubscores: parsed.prescriptionSubscores,
  aestheticScore,
  aestheticSubscores: parsed.aestheticSubscores,
  cardFrontEligible: parsed.eligibility.cardFrontEligible,
  timelineEligible: parsed.eligibility.timelineEligible,
  galleryHerdCandidate: parsed.eligibility.galleryHerdCandidate,
  galleryRanchCandidate: parsed.eligibility.galleryRanchCandidate,
  editorialCandidate: parsed.eligibility.editorialCandidate,
});

// Trigger throne recomputation for the animal
await recomputeThrones(animalId);
```

**Cost estimation:**

Typical HEIC photo resized to long-edge 1568px yields ~1600 image tokens at Claude vision rates. With ~300 tokens of prompt plus ~400 tokens output, a classification runs ~2300 total tokens.

At Haiku 4.5 rates ($1 input / $5 output per million):
- Input: 1900 tokens × $1/M = $0.0019
- Output: 400 tokens × $5/M = $0.0020
- **Per-photo cost: ~$0.004** (four-tenths of a cent)

Classifying 10,000 photos costs ~$40. Summers Ranch will upload a few hundred photos per year. Classification is effectively free.

**Error handling:**

- If the Claude API call fails (timeout, rate limit, 5xx): retry once with exponential backoff; if still failing, write `classificationStatus: 'failed'` to the MediaAsset and enqueue for manual admin review in `/admin/upload-issues/`
- If the returned JSON is malformed (invalid, missing fields): same failure path — flag for manual review, don't guess
- If `subjectPresent: false` for a photo uploaded to a specific animal: flag in upload-issues as "likely not cattle" — admin decides whether to keep or delete

**Admin override:**

Any classification field is editable by admin from the photo's detail row on `/admin/herd/[id]`. Manual overrides carry a flag `classificationManuallyOverridden: true` so a future reclassification pass doesn't clobber admin judgment.

**Reclassification:**

Phase 1 doesn't reclassify. Each photo is classified once on upload.

Phase 2+ may add a reclassification mechanism (e.g., when the rubric is refined or a better model is available) that respects `classificationManuallyOverridden`.

**What Claude vision gets right and wrong:**

Based on experience with similar image-classification tasks, expect:
- **Reliably correct:** distinguishing cattle from non-cattle, identifying obvious side-profile vs headshot vs action, recognizing cleanliness and lighting quality, detecting full-body framing
- **Mostly correct but occasionally wrong:** subtle angle judgments ("is this 3/4 turned or fully side?"), scoring composition on atmospheric shots, detecting subject being with dam vs just adjacent
- **Not reliable alone:** final prescription judgments ("is this angle acceptable for evaluation?") — we use the scores as inputs to the throne algorithm (§14.8), not as final decisions. Admin Prefer/Hide overrides per §14.12 exist precisely because automated scoring isn't authoritative.

**Concrete integration with the upload flow:**

```
Shortcut POST /api/upload → Worker writes to R2, returns 202
    ↓
Worker enqueues classification job (or fires directly in Phase 1)
    ↓
Classifier reads image, gets dimensions, calls Claude
    ↓
Claude returns JSON classification
    ↓
Worker writes scores/flags to MediaAsset record
    ↓
Worker calls recomputeThrones(animalId)
    ↓
Throne changes propagate to card-front selection on next render
```

The upload handler returns 202 before classification completes. The Shortcut doesn't wait. If classification fails, the photo is still uploaded and visible — just unclassified, which admin can manually classify later.

### 14.7.2 🟧 Model lifecycle management — automated checks

Two scheduled background checks keep the classifier's model selection healthy without requiring Matt to actively monitor Anthropic's documentation.

**Weekly deprecation check** (`/functions/cron/weekly-deprecation-check.ts`):

- Runs every Monday at 4am UTC via Cloudflare Cron Trigger (`0 4 * * 1`)
- Fetches Anthropic's deprecation list (from the models API or the deprecations documentation URL)
- For each currently-configured `CLAUDE_MODEL_*` env var, checks whether that model appears in the deprecation list
- If yes:
  - **If a clean successor is recommended by Anthropic** (same tier, same price or cheaper): logs the intent, sends an urgent email to the Owner, waits 7 days for response, then automatically updates the env var and sends a confirmation email. The 7-day window gives Matt a chance to object; the automatic update ensures the site never goes down due to an ignored email.
  - **If no clean successor is recommended**: sends an urgent email flagging the situation and requires manual action. No automatic change.
- Logs all activity to the audit log (per spec §17.4)

**Quarterly model review** (separate, documented in `DEPLOYMENT-SECRETS.md`):

- Runs every 90 days
- Composes a human-readable email summarizing current model vs newer alternatives, including benchmark comparisons from public leaderboards (Artificial Analysis primary, Anthropic docs fallback)
- **Never auto-upgrades.** Always requires human action via Cloudflare Pages env var change.
- Rationale: generation upgrades (Haiku 4.5 → Haiku 5) carry real risk of behavior changes on cattle-specific photos; the value of Matt's human judgment here is high.

**Request-level fallback** (runtime, not scheduled):

Already specified in §14.7.1's error handling. If a classification call fails with "model not found" at runtime, the worker retries once with the hardcoded fallback default model and logs a loud warning. This is the last line of defense if both scheduled checks somehow fail.

**Combined defense-in-depth:**

- **Day-of-failure protection:** request-level fallback — site doesn't go down if the configured model evaporates mid-request
- **Week-of-deprecation protection:** weekly check catches deprecation notices with 6-month runway plus an additional 7-day grace window for Matt to act, or automatic migration if he doesn't
- **Quarterly improvement protection:** quarterly email nudges upgrades when newer models offer benchmark improvements at same or lower cost, but never takes action without explicit approval

**Matt's total required effort:**

- Opening the quarterly email once every 90 days (~30 seconds to read, 30 seconds to decide)
- Responding to the urgent deprecation email within 7 days if one ever arrives (probably once every 18-24 months based on historical Anthropic deprecation cadence)
- Zero ongoing monitoring effort

**Shared implementation note:**

Both scheduled checks can live in the same `/functions/cron/` directory and share utility modules for:
- Fetching Anthropic models list
- Parsing deprecation data
- Composing and dispatching emails via the inquiry-notification email channel
- Reading/writing Cloudflare Pages environment variables programmatically (requires an additional API token with Cloudflare API Settings:Edit permission, stored as `CF_API_TOKEN` env var)

The "automatically update env var" path specifically requires the `CF_API_TOKEN` secret — it's the only way to change a Pages environment variable programmatically. If that token isn't configured, both scheduled checks degrade gracefully to email-only mode (no automatic updates, just notifications).

### 14.8 🟧 Throne mechanics — card front (side profile)

The current `cardFrontThrone` for each animal is the highest-scoring eligible side-profile photo, where score is a **blended weighted sum** of prescription and aesthetic components.

**Prescription weighting** (what a buyer wants to evaluate):

| Dimension | Weight |
|---|---|
| Angle (straight-on side) | 25 |
| Legs visible | 20 |
| Full body in frame | 15 |
| Camera height appropriate | 12 |
| Head visible and clear | 8 |
| Cleanliness | 8 |
| Background quality | 6 |
| Lighting adequacy | 6 |

Sum: 100. Each subscore is 0-1; prescription score = sum of (weight × subscore) = 0-100.

**Aesthetic weighting** (craft-only, no emotional or creative judgment):

| Dimension | Weight |
|---|---|
| Technical quality (focus, exposure) | 35 |
| Composition | 30 |
| Lighting character | 20 |
| Color/tonal | 15 |

Sum: 100.

**Blend formula by availability state:**

- **Available animal:** score = 0.9 × prescription + 0.1 × aesthetic, transitioning to 0.8 × prescription + 0.2 × aesthetic when multiple candidates score closely
- **Not-available animal:** score = 0.7 × prescription + 0.3 × aesthetic, transitioning to 0.5 × prescription + 0.5 × aesthetic when multiple candidates score closely

The higher weighting on prescription for available animals reflects that buyers need evaluation-usable shots. Not-available animals can lean more aesthetic.

### 14.9 🟧 Throne mechanics — card front (beauty/action)

Separate throne slot: `cardFrontBeautyThrone`. Used when the animal is not-available.

**Phase 1 fallback:** most-recent photo classified as `action`, `scenic`, `three-quarter`, `head`, `with-dam`, or `other` by aesthetic score alone. No dedicated rubric.

**Side profiles are also eligible** but with a 15-20% aesthetic score penalty (exact value Phase 2 rubric decision). Rationale: for not-available animals, the front's job is to *invite* while the back's job is to *evaluate*. If the front happens to lead with a side profile too, the front and back become visually redundant (same photo content, same purpose), diluting both surfaces' intent. The penalty biases toward visual variety between front and back for not-available animals. It does not apply to available animals — for them, front and back intentionally align on the same side profile throne-holder because both audiences (buyer-evaluating on the front, buyer-studying on the back) want the same evaluation shot.

When the beauty pool is weak or empty (e.g., reference animals documented almost entirely via side profiles), a dramatically superior side profile can still win the front despite the penalty. The 15-20% is calibrated to maintain variety by default, not to exclude.

**Empty-throne fallback** (per §3.5): if no photo scores high enough to win the beauty throne — including after the side-profile penalty — the card front displays the best-available photo by raw aesthetic score regardless of shot type. A coverage nudge fires to admin. For not-available animals with only side profiles in their photo history (e.g., some reference animals), this fallback ensures the best side profile appears on the front without an explicit beauty-type candidate.

**Phase 2:** dedicated beauty/action rubric with its own subscores — deferred. Will formalize the side-profile penalty value, define beauty-specific scoring dimensions, and handle edge cases (cow-and-calf shots, seasonal mood shots, action sequences).

### 14.10 🟧 Life stages

Life stages drive staleness thresholds and bucketing density:

| Life stage | Age range |
|---|---|
| Newborn | 0-60 days |
| Young calf | 60-205 days |
| Weanling | 205-365 days |
| Yearling | 1-2 years |
| Mature | 2+ years |

### 14.11 🟧 Staleness thresholds

"This throne-holder is too old" triggers a coverage nudge. Threshold depends on life stage and availability:

| State | Threshold |
|---|---|
| Newborn, any availability | 30 days |
| Young calf, any availability | 60 days |
| Weanling, any availability | 90 days |
| Yearling, any availability | 180 days |
| Mature, not available | 365 days |
| Mature, available | 60 days (override) |
| Reference animal | Never stale |

Threshold is measured from the throne-holder's capture date.

### 14.12 🟧 Prefer / Hide admin overrides

Admin can flag individual photos:

- **`forceInclude`** — this photo overrides normal scoring for its slot. Time-bounded by the animal's current life-stage staleness threshold (photo expires from forceInclude when life stage would retire a same-age shot). Single unified clock.
- **`forceExclude`** — this photo is permanently removed from candidacy. No time bound.

Admin picker is simple — a Prefer/Hide per-photo toggle. Not a complex preference system.

---

## 15. 🟦 Nudges — per-animal and coverage

Nudges are gentle prompts that surface when admin attention would improve the site. Two categories.

### 15.1 Per-animal nudges

Fire on completion milestones or individual data gaps:

- An animal's throne-holder photo is past its staleness threshold
- An animal's required fields are all filled but 1-2 optional fields are missing — "completion celebration" nudge
- An animal has changed status (new calf, new availability, distinction awarded) and relevant sections need review
- An animal has no photos and exists (missing initial uploads)

Nudges display in the admin's herd list with a small indicator on the card, and surface in the status strip's "Animals needing attention" count. Tapping the indicator navigates to the relevant field with a gold-pulse highlight.

**30-day snooze default** per nudge. After 30 days of inaction, the nudge reappears. Admin can manually dismiss to push out further.

### 15.2 Coverage nudges

Fire when a required slot in an automated system can't be filled — **the gap hasn't manifested publicly yet, but is about to**:

- No summer hero shot available for the Wall's seasonal rotation
- No side-profile photos for any currently-available animal
- Missing landscape photos for a specific Gallery bucket
- No recent photos of the herd group (for home page teaser rotation)

Coverage nudges are **predictive** — they fire before the gap is visible, so admin can fix it before users notice. They go to all admins (Owner, Admin, Editor) via the admin dashboard.

### 15.3 Nudge notifications

Per-user pref (see §17.2) governs whether nudges generate email or SMS notifications. Default: off for nudges. Nudges are meant to be noticed while actively using the admin, not push-notified.

---

## 16. 🟦 Documents section

URL: `/admin/documents/`

Admin-authored documentation and file storage. **Admin-only Phase 1** — no public surface.

### 16.1 Structure

Categories:
- **Photo Guidelines** — how to take good cattle photos, what the system needs, shot examples
- **Upload Instructions** — how to install the Shortcut, how the tag picker works, troubleshooting
- **Registration Forms** — AHA registration paperwork references, templates
- **Industry Reference** — EPD explanations, Hereford association info, breed standards
- **Site Operations** — admin how-tos, nudge explanations, team member roles

### 16.2 Content types

Each category holds:
- **Authored markdown** — pages written directly in the admin by Owner/Admin/Editor
- **Uploaded files** — PDFs, images, PPTs, anything

Markdown pages render with the same typography as the public site (Playfair headers, Work Sans body). Authoring interface is a simple markdown textarea with live preview.

### 16.3 Permissions

Owner, Admin, Editor — read and write.
Contributor — no access.

### 16.4 Phase 1 content

The Documents section ships with empty categories. **Content pass** (tooltip-voice writing of the guideline pages) is a separate task, planned post-launch or late Phase 1 with Matt + Roianne + Claude.

---

## 17. 🟦 Settings

URL: `/admin/settings/*` — five sub-pages, role-gated.

### 17.1 Profile (`/admin/settings/`)

Landing sub-page. Every user manages their own.

Fields:
- Display name
- Email
- Phone (optional; required to enable SMS notifications)
- Time zone (IANA zone; drives timestamp display and nudge scheduling)
- **Admin accent color** — see §17.1.1

All inline-edited, auto-save on blur (per §12.7).

#### 17.1.1 Per-user admin accent color

Each user has an `adminAccentColor` field. When set, it overrides `--color-accent` on admin surfaces **only for that user**. Public surfaces always use the ranch-level accent from §18.

UI: 8-12 preset colors (curated to avoid clashing with ribbons or nudges), plus "default" option using the ranch accent. Live preview in the picker.

This is personality, not identity. Marty gets his red, Roianne gets her purple, without affecting anything buyers see.

### 17.2 Notifications (`/admin/settings/notifications/`)

Per-user notification preferences. Toggles:

| Event | Email default | SMS default |
|---|---|---|
| New inquiry received | On | On (if phone set) |
| Contributor uploaded | Off | Off |
| Pending tag requires resolution | On | Off |
| Upload issue detected | Owner: on, others: off | Off |
| Nudge surfaced on animal I've edited recently | Off | Off (Phase 2) |

SMS toggles are disabled with an inline hint linking to Profile when no phone is set.

SMS uses Twilio (~$15-25/year for a small team's volume). Email uses the user's own `email` field.

### 17.3 Devices (`/admin/settings/devices/`)

Two stacked sections per user:

**Passkey devices:**
- List of registered passkeys: nickname (editable), device type (auto-inferred from user-agent at registration), date added, last-used timestamp
- "+ Add a new device" — initiates WebAuthn registration flow
- Per-device "Remove" action with confirmation
- Warning line when only one device remains: *"This is your only registered device. If you lose access to it, you'll need recovery — see below."*

**Upload token:**
- Current token status: "Active" with masked preview (`••••••••••••7Abc`) or "Not yet installed"
- "Reinstall on phone" button — generates a one-time install link and presents share options (iMessage, email, copy)
- "Rotate token" with confirmation — invalidates previous token immediately, requires reinstalling the Shortcut
- Last-used timestamp

**Recovery section (bottom):**
- Owner: view recovery codes (generated once at setup; 10 single-use codes; regenerate invalidates all prior codes)
- Non-Owner users: *"If you lose access to your devices, contact [Owner name] for help restoring access."*

### 17.4 Team (`/admin/settings/team/`)

Visible to Owner and Admin. Add/remove/role-change capabilities **gated further to Owner only** per §12.4.

**Main view — team list:**
- Rows: display name, role badge, status (Active / Not yet activated / Review-required), last-active timestamp, actions menu
- Filters: All / Active / Contributors only / Activity in last 7 days

**"+ Add team member" flow:**
- Fields: display name, phone (optional), email (required for Owner/Admin/Editor, optional for Contributor), role selector (restricted by inviter's role), trust state toggle for Contributors
- For Owner/Admin/Editor: sends email invite with passkey-registration link (48-hour expiry)
- For Contributor: generates upload token, presents Shortcut install flow with "Send to phone" options (iMessage, email, copy)

**Per-user actions menu:**

| Action | Owner | Admin |
|---|---|---|
| Edit display name/email/phone | ✓ | — (own profile only) |
| Change role | ✓ | — |
| Rotate upload token | ✓ | — |
| Toggle Contributor trust state | ✓ | ✓ |
| Revoke Contributor token | ✓ | ✓ |
| Reset passkey registration (Owner-assisted recovery) | ✓ | — |
| Remove user | ✓ | — |

**Audit log (Owner-only, bottom of Team page):**

Chronological sensitive events: user additions/removals, role changes, trust state changes, ownership transfers, upload token rotations, passkey device changes (including owner-initiated resets), site config changes, Contributor batch rejections.

Per entry: timestamp, actor, action, target, brief context. Retention: 1 year default. "Export to CSV" action.

Not logged: animal record edits (per-field audit trail per §12.7), successful logins, failed login attempts (Phase 2).

### 17.5 🟧 Self-service Contributor creation

Marty and Roianne can add their own Contributors without needing Matt. This is a Phase 1 feature — the difference between a team that grows organically and one that needs ongoing admin intervention.

**Flow:**
1. Owner/Admin opens `/admin/settings/team/`, taps "+ Add team member", role = Contributor
2. Fills display name, phone (optional)
3. Taps Create
4. System generates unique upload token
5. Screen shows "Send to [name]'s phone" with three actions: iMessage, email, copy link
6. Owner/Admin sends link via chosen channel
7. Contributor taps link on iPhone → `GET /install/shortcut?install_id=<uuid>` → personalized .shortcut downloads with token pre-embedded
8. First successful upload activates the account

No Apple Developer account required. No Matt intervention.

### 17.6 🟧 Recovery model

- **Owner:** 10 single-use recovery codes, generated at Owner setup. Losing all devices → use a recovery code to authenticate and re-register a new passkey. Regenerable (invalidates all prior codes).
- **Admin / Editor / Contributor:** no self-recovery. Contact Owner, who taps "Reset passkey registration" in the user's Team row. System clears all registered passkeys and sends a one-time registration link via email.

Owner-assisted recovery is logged in the audit log as a sensitive action.

### 17.7 🟧 Ownership transfer (two-step)

Rare but consequential. Two-step mutual acknowledgment:

**Step 1 — Owner initiates** (from `/admin/settings/site/`):
- Selects an Admin from a dropdown (only Admins are eligible)
- Types the target's display name as a safety check
- Taps "Propose transfer"
- System creates `PendingOwnershipTransfer` record, notifies target via email + SMS (if set) + in-app banner on next login

**Step 2 — Target accepts or declines:**
- Banner appears on next login: *"[Current Owner] has proposed transferring ownership of Summers Ranch to you. [Accept] [Decline]"*
- Accept → roles swap, previous Owner becomes Admin, audit log entry, both parties notified
- Decline → transfer cancels, previous Owner notified, no change
- Auto-expiry: 7 days with no action → cancelled

Current Owner can cancel a pending transfer at any time.

### 17.8 Site (`/admin/settings/site/`)

Owner-only.

**Sections:**

**Style** — populated design-token values from §18. Admin sees current palette/typography with "Regenerate tokens" affordance. Manual token overrides discouraged.

**Ranch metadata** — public-facing:
- Ranch name (display)
- Tagline
- Contact phone (public)
- Contact email (public)
- Physical address (public, optional)

**Public surface toggles** (Phase 2+) — infrastructure stub for future use.

**Default notification settings for new users** — the defaults a newly-created user inherits.

**Ownership transfer** — see §17.7.

---

## 18. 🟦 Design tokens and visual system

**Locked direction** (v4 style preview): cream + burgundy + near-black ink, Playfair Display headlines, Work Sans body. Light mode default, dark mode Phase 2.

### 18.1 🟧 Token structure

Single `src/styles/tokens.css`. Tokens are CSS custom properties under `:root`, with a `body[data-mode="dark"]` override block for dark-mode values.

**Color tokens (light mode):**
```css
--color-bg: #f7f0e3;         /* warm cream */
--color-paper: #ffffff;      /* card / lifted surface */
--color-ink: #14100e;        /* near-black body text */
--color-muted: #5a5046;      /* secondary text */
--color-accent: #8b1e3a;     /* burgundy */
--color-accent-deep: #5c0f24;
--color-accent-soft: #d08a9a;
--color-cream-deep: #e8d9bd; /* subtle divider line */
```

**Color tokens (dark mode):**
```css
--color-bg: #0a0506;         /* near-black */
--color-paper: #14090b;
--color-ink: #f7f0e3;        /* cream text */
--color-muted: #a89d8c;
--color-accent: #c8425e;     /* brighter burgundy for dark contrast */
--color-accent-deep: #8b1e3a;
--color-accent-soft: #e5a4b5;
--color-cream-deep: #2f1d21;
```

**Typography tokens:**
```css
--font-display: "Playfair Display", Georgia, serif;
--font-body: "Work Sans", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, monospace;

--font-size-xs: 0.72rem;
--font-size-sm: 0.85rem;
--font-size-base: 1rem;
--font-size-md: 1.15rem;
--font-size-lg: 1.4rem;
--font-size-xl: 1.85rem;
--font-size-2xl: 2.4rem;
--font-size-3xl: 3rem;
--font-size-4xl: 4rem;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.15;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

--letter-spacing-tight: -0.01em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.05em;
--letter-spacing-kicker: 0.25em;
```

**Spacing tokens** (0-20 scale, base 4px):
```css
--space-0: 0;
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
```

**Radius, shadow, motion, z-index:** populated per A39 spec. See `tokens.css` in the repo.

### 18.2 Per-user admin accent override

Admin layout injects a per-user override:
```css
body[data-admin-user="<userId>"] {
  --color-accent: <adminAccentColor>;
}
```

Public pages never inject this. Ranch-level accent (`#8b1e3a`) is used for all public-facing surfaces.

### 18.3 Typographic rules

- **Headlines use Playfair Display** with italic emphasis on key words (e.g., "Every cow has a name. *Every name has a story.*"). Italic color is `--color-accent` on public surfaces.
- **Body copy uses Work Sans** in `--font-weight-normal` (400). Muted body uses `--color-muted`.
- **Kickers** (small uppercase labels above section titles) use Work Sans `--font-weight-semibold`, `--font-size-xs`, `--letter-spacing-kicker`, color `--color-accent`.
- **CTAs** use Work Sans `--font-weight-semibold`, `--letter-spacing-wide`, all-caps, radius 1px (square). Primary CTAs: `--color-accent` background. Secondary CTAs: transparent background, `--color-accent` text, 1px border in `--color-accent`.

### 18.4 Hero scrim treatment

All hero images use a **neutral black gradient scrim** concentrated in the bottom third only — preserves the photograph's natural color throughout the upper portion:

```css
background: linear-gradient(
  180deg,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,0) 45%,
  rgba(0,0,0,0.55) 75%,
  rgba(0,0,0,0.82) 100%
);
```

No tinted scrims (those discolored the cattle in preview testing). Hero text gets layered drop shadows for legibility over the scrim.

---

## 19. 🟦 Ribbon system

Ribbons are ceremonial and visually consistent across all surfaces. Do not theme by palette.

### 19.1 Ribbon types

**Corner ribbon (Available):**
- Diagonal across top-right of the photo
- Gold gradient fill: `#fff2c4` → `#f0d874` → `#c9a227` → `#9a7a0f`
- Text: "AVAILABLE" (industry-correct — not "For Sale")
- Font: Lato 10px black (900), 0.2em tracking, uppercase, text color `#2c2416`
- Units: px throughout (iOS text scaling durability — user zooming with rem-based values breaks the fixed-size graphic)

**Hanging ribbons (Distinction DOD/SOD, Birthday):**
- Vertical hanging with chevron swallowtail bottom
- 34px × 90px
- Position 1: `left: 12px`, Position 2: `left: 54px`
- Fabric-depth treatment: two-layer gradient (horizontal edge shading + vertical fabric weight)

**DOD (Dam of Distinction):**
- Background gradient: `#5a8bc4` → `#3b6ba5` → `#1e4a7e` → `#0f2d52`
- Emblem: ★ in gold at top
- Text: "DOD" vertically stacked, Cinzel 12px bold (800), gold color

**SOD (Sire of Distinction):**
- Background gradient: `#c94848` → `#b03030` → `#8b1e1e` → `#4a0f0f`
- Emblem: ★ in gold
- Text: "SOD" same treatment as DOD

**Birthday (girl — cows, heifers, heifer calves):**
- Background gradient: `#f5dae3` → `#eabecb` → `#c48799`
- Two-column text: "HAPPY" | "BIRTHDAY" — each letter in its own vertical span, columns 8px gap, centered in ribbon
- Cinzel 7px bold (700), deep-gold text on pink background
- No emblem (text fills the ribbon)

**Birthday (boy — bulls, bull calves, steers):**
- Background gradient: `#c8dff0` → `#9ec5e8` → `#6a9dc4`
- Same two-column HAPPY | BIRTHDAY treatment
- Cinzel 7px bold, deep-blue text on baby-blue background

### 19.2 Ribbon rules

- Corner ribbon (Available) and hanging ribbons (DOD/SOD, Birthday) never conflict — corner is top-right, hanging is top-left-side
- Two hanging ribbons can coexist: DOD+Birthday, SOD+Birthday (distinction in position 1, birthday in position 2)
- Birthday ribbons fire only on the animal's birthday and disappear the next day
- All ribbon text uses px units (not rem) — the ribbon is a fixed-size graphic that must not break under iOS text scaling

### 19.3 Ribbon copy

- "AVAILABLE" — not "FOR SALE"
- "HAPPY BIRTHDAY" — not the age number
- "DOD" / "SOD" — not "Dam of Distinction" spelled out (too long, industry uses abbreviation)

---

## 20. 🟦 Share sheet — outgoing

When users share a public URL from the site, social platforms (iMessage preview, Twitter, Facebook, LinkedIn, WhatsApp) fetch OpenGraph metadata and render a preview card.

### 20.1 OpenGraph implementation

Every public page outputs:
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta property="og:url" content="...">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
```

**No Twitter handle.** The ranch has no social media presence — leaving `twitter:site` unset is the right choice, not filled with a placeholder.

### 20.2 Per-animal composites (Phase 1)

For each animal, a **1200×630 card-front composite** is generated at build time:
- The animal's current front photo (per §3.5) as the base
- Ranch logo subtle in corner
- Animal's name and tag overlaid with the same drop-shadow text treatment as photo dates
- Availability ribbon rendered if applicable

Composite images live at `/og/animal/[id].jpg`. Each animal's detail page (`/herd/[id]/details`) references its own composite via `og:image`. The animal's card-front URL (`/herd/[id]`) rewrites `og:url` to the front so shared links deep-link properly.

**No compact-view card sharing** — shared URLs always go to a specific animal's front, not to the filtered herd view.

### 20.3 Generic ranch hero (Phase 1)

List pages (`/herd`, `/gallery`), home (`/`), about (`/about`), contact (`/contact`) use a generic ranch hero composite — the ranch's best landscape photograph with name overlay. Single image, not filter-aware.

**Filter-aware composites** (per-filter /herd images, per-section /gallery images) are Phase 2.

### 20.4 Cache invalidation

Composite URLs include a version token (e.g., `/og/animal/840.jpg?v=2026-04-19-14-23`) that updates when the underlying photo or animal data changes. Browsers and social platforms refetch when the token changes.

---

## 21. 🟦 Share sheet — incoming

The Shortcut pipeline is the incoming share mechanism — see §14.1-14.3 for mechanics.

### 21.1 What the Shortcut preserves

- Original HEIC files (no client compression)
- Live Photo MOV components (preserved as second file with `livePhotoPair` linking on the MediaAsset)
- ProRAW when present
- Original filename for admin reference
- Capture timestamp from EXIF

### 21.2 What the pipeline strips server-side (Phase 2)

- GPS coordinates (privacy)
- Camera serial numbers (privacy)
- Proprietary maker notes unless opted-in

### 21.3 iOS only through Phase 2+

Android users route through iOS admins via text/email/Google Photos share, then the iOS admin uploads via their own Shortcut (or via `/admin/upload/` web fallback).

Phase 3+ Android via Tasker parallel is possible but deferred until actual demand.

---

## 22. 🟧 Data model

### 22.1 Core entities

```typescript
interface AnimalRecord {
  id: string                    // stable internal ID, not the tag
  tag: string                   // primary human identifier, e.g. "840", "109A"
  name: string | null
  sex: 'cow' | 'bull' | 'heifer' | 'steer' | 'calf'
  breed: string                 // 'Hereford' for now; future-proof for crosses
  dateOfBirth: string | null    // ISO date
  registrationNumber: string | null  // AHA number
  distinction: 'DOD' | 'SOD' | null
  distinctionYear: number | null
  currentStatus: AnimalStatus
  sireId: string | null         // links to another AnimalRecord or external reference
  damId: string | null
  isReference: boolean          // deceased or sold-and-untracked
  performanceData: PerformanceData | null
  privateNotes: string          // admin-only, never public
  createdAt: string
  updatedAt: string
}

type AnimalStatus = 
  | 'available'        // for sale
  | 'breeding'         // active in herd, not for sale
  | 'growing'          // calf/yearling, not yet breeding, not for sale
  | 'sold'             // sold to another operation
  | 'deceased'
  | 'retired'          // kept as reference/companion, not active

interface PerformanceData {
  // admin-controlled disclosure; any field can be null to hide
  weaningWeight: number | null
  yearlingWeight: number | null
  epd: Record<string, number> | null
  // ... additional fields as needed
}

interface MediaAsset {
  id: string
  uri: string                   // R2 key or external URL
  orientation: 'portrait' | 'landscape' | 'square'
  aspectRatio: number           // exact decimal
  capturedAt: string            // ISO datetime from EXIF
  uploadedAt: string
  uploadedByUserId: string
  batchId: string               // session-generated UUID
  detectedShotType: ShotType
  livePhotoPair: string | null  // ID of the MOV component if this is a Live Photo
  originalFilename: string
  // classification outputs (nullable — not all photos classified yet)
  cardFrontEligible: boolean
  timelineEligible: boolean
  galleryHerdCandidate: boolean
  galleryRanchCandidate: boolean
  editorialCandidate: boolean
  prescriptionScore: number | null
  prescriptionSubscores: PrescriptionSubscores | null
  aestheticScore: number | null
  aestheticSubscores: AestheticSubscores | null
  timelineScore: number | null    // null in Phase 1
  galleryScore: number | null     // null in Phase 1
  editorialScore: number | null   // null in Phase 1
}

type ShotType = 
  | 'side-profile' | 'head' | 'three-quarter' 
  | 'action' | 'scenic' | 'with-dam' | 'detail' | 'landscape' | 'other'

interface PrescriptionSubscores {
  angle: number        // 0-1
  legs: number
  fullBody: number
  height: number
  head: number
  cleanliness: number
  background: number
  lighting: number
}

interface AestheticSubscores {
  technical: number    // 0-1
  composition: number
  lightingCharacter: number
  colorTonal: number
}

interface CattleMediaLink {
  // join table between AnimalRecord and MediaAsset
  animalId: string
  mediaAssetId: string
  // throne flags (independent)
  cardFrontThrone: boolean              // side-profile throne
  cardFrontThroneSince: string | null
  cardFrontThroneLostAt: string | null
  cardFrontBeautyThrone: boolean        // beauty/action throne
  cardFrontBeautyThroneSince: string | null
  cardFrontBeautyThroneLostAt: string | null
  // admin overrides
  forceInclude: boolean
  forceIncludeExpiresAt: string | null  // bounded by life-stage staleness
  forceExclude: boolean
  // attribution
  linkedAt: string
  linkedByUserId: string
}

interface AdminUser {
  id: string
  role: 'owner' | 'admin' | 'editor' | 'contributor'
  displayName: string
  email: string
  phone: string | null
  timeZone: string
  adminAccentColor: string | null
  passkeyDevices: Array<{
    credentialId: string
    nickname: string
    deviceType: string
    addedAt: string
    lastUsedAt: string | null
  }>
  recoveryCodes: Array<{         // Owner only
    codeHash: string
    used: boolean
    usedAt: string | null
  }> | null
  activationStatus: 'not-yet-activated' | 'active'
  uploadToken: string            // hashed in storage
  trustState: 'default' | 'review-required' | 'revoked'  // applies to Contributors
  notificationPrefs: Record<string, { email: boolean; sms: boolean }>
  createdAt: string
  createdByUserId: string
}

interface Inquiry {
  id: string
  receivedAt: string
  senderName: string
  senderEmail: string
  senderPhone: string | null
  subject: string                // auto-generated or user-provided
  message: string
  referencedAnimalIds: string[]  // from card CTAs and compare page
  status: 'unread' | 'read' | 'replied' | 'archived'
  readAt: string | null
  readByUserId: string | null
}

interface AuditLogEntry {
  id: string
  timestamp: string
  actorUserId: string
  action: string                 // enum of sensitive actions
  targetUserId: string | null
  context: Record<string, unknown>
}

interface PendingOwnershipTransfer {
  id: string
  fromUserId: string
  toUserId: string
  proposedAt: string
  expiresAt: string              // proposedAt + 7 days
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
  resolvedAt: string | null
}

interface SiteConfig {
  ranchName: string
  tagline: string
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null  // optional
  publicSurfaceToggles: Record<string, boolean>  // Phase 2
  newUserNotificationDefaults: Record<string, { email: boolean; sms: boolean }>
  styleDirectionId: string       // references locked v4 direction
}

interface InstallToken {
  id: string                     // UUID used in /install/shortcut?install_id=...
  forUserId: string
  createdAt: string
  expiresAt: string              // createdAt + 24 hours
  consumedAt: string | null
}

interface Nudge {
  id: string
  type: 'per-animal' | 'coverage'
  subtype: string                // e.g. 'stale-throne', 'completion-celebration', 'no-summer-hero'
  animalId: string | null        // null for coverage nudges
  targetFieldPath: string | null // deep-link to specific field on animal
  createdAt: string
  snoozedUntil: string | null
  dismissedAt: string | null
  resolvedAt: string | null
}
```

### 22.2 Phase 1 storage

- **AnimalRecord, MediaAsset, CattleMediaLink, Inquiry, AdminUser:** flat JSON files in `/data/` (committed to repo; served as static)
- **Photos:** R2 bucket, organized as `{animalId}/{mediaAssetId}.{ext}` from Phase 2; Phase 1 uses `{tag}-{slug}/` naming during transition
- **Install tokens, audit log, pending transfers, nudges:** Cloudflare KV (ephemeral/operational data, not in repo)

Phase 2 migrates canonical data to a proper database (D1 or Postgres) when scale demands it.

### 22.3 URL identity stability

**`animalId` is the stable internal identity.** Tags can change (e.g., an animal re-tagged due to a damaged ear tag), names can change, registration numbers can be assigned late. The `animalId` never changes. All internal URL paths use `animalId`.

Tag-based lookups (`/api/resolve-tag?tag=840`) resolve to `animalId`, which is then used for all subsequent operations.

---

## 23. 🟧 Repository layout

### 23.1 Top-level structure

```
/
├── src/                        # Astro source
│   ├── pages/                  # route files
│   ├── components/             # reusable components
│   ├── layouts/                # page layouts
│   ├── styles/
│   │   └── tokens.css          # design tokens (single file)
│   ├── lib/                    # shared logic
│   ├── shortcuts/
│   │   └── summers-ranch-upload-base.shortcut  # master Shortcut
│   └── og/                     # composite generation templates
├── public/                     # static assets served at root
│   ├── images/                 # hero, cattle, ranch photos
│   └── shortcut/               # hosted Shortcut installs (if not R2)
├── data/                       # canonical animal/media/user data (JSON)
│   ├── animals.json
│   ├── media.json
│   ├── links.json              # CattleMediaLink join records
│   └── admin-users.json        # baseline seed
├── docs/                       # authoritative docs (limited to 3 files)
│   ├── README.md
│   ├── CLAUDE.md               # ~150 line agent orientation
│   └── CONTRIBUTING.md
├── functions/                  # Cloudflare Workers (Pages Functions)
│   ├── api/
│   │   ├── upload.ts
│   │   ├── resolve-tag.ts
│   │   ├── inquiry.ts
│   │   └── ...
│   ├── install/
│   │   └── shortcut.ts         # install link → personalized .shortcut
│   └── admin/                  # admin-only endpoints
├── LICENSE.md
├── COPYRIGHT.md
├── README.md
└── package.json
```

### 23.2 🟧 Copy organization

Hybrid approach:
- **Short pages** (about, contact) → single-file markdown in `src/content/`
- **Long multi-section pages** (home, about with multiple sections) → folder per page with section files: `src/content/home/hero.md`, `src/content/home/meet-the-herd.md`, etc.

This lets admins edit section-by-section via the documents system eventually, without rewriting whole pages.

### 23.3 🟧 `docs/` discipline

Only three files allowed in `docs/`:
- **README.md** — project overview for any visitor
- **CLAUDE.md** — ~150 line agent orientation (what this project is, conventions, key decisions summary)
- **CONTRIBUTING.md** — how Matt and future coding agents should modify things

All other documentation lives in the admin-only Documents section (§16), not in the repo.

### 23.4 🟧 `data/` organization

- **Phase 1:** flat JSON files. Single source of truth. Read at build time by Astro.
- **Phase 2+:** when the herd or photo count grows unwieldy, migrate to:
  - `data/seed/` — canonical seed data committed to repo
  - `data/production/` — runtime-mutable data in Cloudflare KV or D1
  - Admin edits write to production; seed is for fresh deploys

### 23.5 CLAUDE.md content outline

The repo-root CLAUDE.md should cover:

1. Project overview (what Summers Ranch is, two sentences)
2. Stack summary (Astro + TS strict + Zod + Cloudflare Pages/R2/KV)
3. Key design principles (the six from §1)
4. Where to find the spec (this file)
5. Data flow (data/ → Astro build → static site; admin writes via Workers)
6. Conventions (prose over bullets in docs, inline-edit patterns in admin, etc.)
7. Ribbon system (ribbons are ceremonial, not themed)
8. What Phase 1 is vs Phase 2+

Length target: 150 lines, readable in 5 minutes.

### 23.6 LICENSE.md and COPYRIGHT.md

- **LICENSE.md** — code is all-rights-reserved with perpetual operation license for Marty and Roianne
- **COPYRIGHT.md** — docs, design, content are CC BY-NC-SA (Creative Commons attribution-noncommercial-share-alike)
- Both committed to repo during v2-rebuild kickoff

### 23.7 Cutover — v1 → v2 deletion list

When the rebuild replaces v1 in production, the following gets wiped and rebuilt:
- All herd-related components and pages (cards, herd list, animal detail)
- All admin surfaces (none existed in v1)
- All photo logic (throne, classification, carousel)

The following is preserved from v1:
- Astro scaffold and `astro.config.mjs`
- TypeScript strict config (`tsconfig.json`)
- Zod schemas (will be updated to match new data model)
- Base layout (`src/layouts/BaseLayout.astro`)
- Seed data loader (will read new data model)
- Any tokens from the new `tokens.css` (populated from v4 style preview)

The v2 rebuild starts on a fresh branch (not the existing v2-rebuild branch, which gets wiped), with this spec as the reference.

---

## 24. 🟦 Phase 2+ deferred items

The following are intentionally deferred beyond Phase 1:

**Photo system:**
- Timeline selection rubric (which photos best show growth over time)
- Gallery-Herd rubric (best photos for The Herd gallery)
- Gallery-Ranch rubric (best atmospheric photos)
- Editorial rubric (curated ranch story shots)
- Beauty/action rubric (card-front for not-available animals)
- HEIC → WebP/AVIF server pipeline
- EXIF strip + GPS removal
- Photo byte-identity across re-encoding (§14.6.1 edge case)

**Explicitly not on the roadmap — automatic animal re-identification from photos:**

Some upload flows might suggest it would be useful for the classifier to also recognize *which specific animal* is in a photo (to auto-suggest a tag for untagged uploads, or catch tag errors). This was considered and rejected.

Rationale:
- Herefords are deliberately bred to be visually uniform. Large red-brown bodies, white faces, white socks — that's the breed standard. Individual markings exist but are subtle, inconsistent across angles and lighting, and don't reliably differentiate adult cows.
- Ear tags themselves rotate, catch oblique angles, and often aren't legible at typical photograph distance.
- A perceptual/embedding system trained on this herd would likely produce embeddings that cluster tightly across all adult cows and get confused by the same cow at different ages, seasons, and lighting.
- False positives ("this looks like Sweetheart" when it's actually a different cow) would be frustrating and erode trust in the system.
- The operational benefit is small: users can just enter or skip the tag themselves, and the Phase 1 pipeline handles both cases cleanly (§14.2, §14.6.1).

**Ranch-general is a first-class upload state, not a fallback from failed identification.** The system never tries to guess. If Marty skips the tag, the photo is ranch-general; if he enters one, the photo is tagged. No middle ground.

---

**Share sheet:**
- Filter-aware OpenGraph composites
- Per-gallery-section share images
- Twitter handle if the ranch joins

**Compare view:**
- Full side-by-side build (Phase 1 ships URL-pattern placeholder only)
- OpenGraph composite for compare URLs

**Admin:**
- Atmospheric motion on Phase 2+ surfaces (Gallery Wall Live Photo loops)
- Dark mode rollout (tokens are Phase 1; UI build Phase 2)
- Nudge notifications via push
- Failed login attempts in audit log
- Media (`/admin/media/`) — photo library management surface
- Calendar (`/admin/calendar/`) — breeding/calving events

**Platform:**
- Android upload pipeline (via Tasker)
- PWA richer features (offline, install prompts beyond home-screen icon)

**Content:**
- Tooltip content pass (infrastructure Phase 1, content late Phase 1 / post-launch)
- Documents section content pass

**Phase 3+ concepts (not committed, captured for future consideration):**

- **AI-assisted buyer evaluation tool (`/admin/evaluate/`).** Admin-only private tool for Marty to evaluate *other* ranchers' animals during purchase or breeding decisions. Not a public feature. Not a tool for evaluating his own herd.

  **User flow:** Marty uploads 1-5 photos of a candidate animal (from a sale catalog, a private seller, or anywhere else), pastes or types whatever metadata he has (EPDs, registration number, seller claims, asking price), optionally states his current breeding goal. System produces a structured evaluation report including conformation observations, EPD interpretation, fit-to-goal analysis, questions to ask the seller, and red flags if any.

  **Why admin-only, never public:**
  - Uses the same Claude vision pipeline as classification, but for a completely different purpose — the buyer's side of the transaction, not the seller's
  - Output is advice to Marty, not content about any animal
  - Avoids reputation risks associated with public AI commentary on specific animals
  - Treats Marty's buyer-evaluation workflow as what it is: a private competitive advantage, appropriately kept private
  - Respects copyright — catalog photos uploaded for private evaluation are fair use; publishing AI critiques of them would not be

  **Use cases this serves:**
  - AHA sale catalog triage (narrowing hundreds of candidates to ones worth deeper investigation)
  - Out-of-state purchase decisions where physical visit isn't feasible before commitment
  - Pairing decisions within his own herd (which cow × which bull for which breeding goal)
  - Sanity-checking gut reactions to specific animals

  **Output delivery:** structured reports saved to Marty's admin space, viewable only by Owner and optionally Admin. Never by Editor or Contributor. Never leaves the admin surface.

  **Constraints:**
  - Never surface temperament judgments (AI cannot read temperament from photos)
  - Never verify seller-supplied claims as authoritative — reports note what AI observed, what AI couldn't determine, and what Marty should confirm independently
  - Bounded compute (admin-invoked, hard-capped at reasonable per-evaluation cost)
  - Clear labeling as "AI observations for your decision-making — not a verified assessment"
  - Input photos and generated reports stored privately; never aggregated, never published
  - Copyright treated carefully — uploaded catalog photos must not be republished anywhere

  **Dependencies on Phase 1 work:** requires the Phase 1 classification pipeline (§14.7.1) to be mature and well-calibrated. Any confidence in structural evaluation of arbitrary animals is downstream of reliable shot-type detection and scoring on Marty's own herd first.

  **Explicitly not proposed:** a public-facing "AI comparison engine" that lets buyers evaluate Marty's animals against their own criteria. That version would fight the seedstock business model — the buyer-breeder relationship is core to selling registered Herefords, automated scoring creates reputation risk, and unbounded public compute is budget-dangerous.

---

## 25. 🟧 Coding agent kickoff instructions

**Start with this spec.** Read it end-to-end before writing any code. Ask Matt for clarification on any points that seem ambiguous.

**Start from a fresh branch.** The existing `v2-rebuild` branch gets wiped. Start a new branch (name TBD with Matt) and begin from `main`.

**Preservation checklist — what survives from main:**
- Astro scaffold (`astro.config.mjs`, `package.json`, `tsconfig.json`)
- Zod schemas — update to match the data model in §22
- `src/layouts/BaseLayout.astro` — update to use new `tokens.css`
- Seed data loader — update to read new data model structure

**Deletion checklist — what gets wiped:**
- All existing card components (front, back, flip logic)
- All existing herd list components
- All existing animal detail page logic
- Any ribbon code (rebuilt per §19 with px units)
- Any photo cycling logic (rebuilt per §14)

**Build order (roughly; parallelize where possible):**

1. **Foundations (week 1):**
   - Install and configure `tokens.css` with locked v4 values (§18)
   - Update Zod schemas to match data model (§22)
   - Update `BaseLayout.astro` to use tokens
   - Seed data migration (wire new loader to data/ JSON structure)
   - Write or update `docs/CLAUDE.md` per §23.5

2. **Public surfaces (weeks 2-4):**
   - Home page (§8)
   - Herd page with cards (§3, §4, §7)
   - Animal detail page (§4 card back)
   - Per-animal gallery (§5)
   - About, Contact, Gallery (§9, §10)
   - Compare placeholder (§6.1)
   - OpenGraph composite generation (§20.2, §20.3)

3. **Admin foundations (weeks 3-5, overlapping):**
   - Passkey authentication (§12.2)
   - Admin layout + navigation (§12.6)
   - Herd landing with status strip and FAB (§7.4)
   - Inline edit on animal detail (§12.7)
   - Progressive disclosure patterns (§12.8)
   - Settings sub-pages (§17)
   - RBAC + capability gating (§12.4)

4. **Admin operational (weeks 5-7):**
   - Inquiries inbox (§13)
   - Documents section (§16)
   - Review queue (for Contributor uploads)
   - Pending tags queue (§14.5)
   - Upload issues queue (§14.6)
   - Audit log view (§17.4)

5. **Photo pipeline (weeks 4-7, overlapping with admin):**
   - `/api/upload` Worker (§14)
   - `/api/resolve-tag` Worker (§14.2)
   - Classification stub (shot type, orientation, basic scores)
   - Throne calculation logic (§14.8, §14.9)
   - Staleness threshold and nudge generation (§14.11, §15)
   - Web upload fallback page (§14.4)
   - Install token endpoint (§17.5)

6. **Launch readiness (week 7-8):**
   - Deploy to Cloudflare Pages
   - DNS cutover mrsummersranch.com
   - Matt builds master Shortcut per §14.2, commits to repo
   - Admin seed (Matt's Owner account) via `admin-users.json`
   - First real data seeded (handful of Marty's current animals)
   - End-to-end smoke test

**Where to ask Matt for clarification:**
- When an amendment's intent feels ambiguous — the amendments file (archived in repo history) has the reasoning, not this spec
- When a deferred Phase 2 item blocks a Phase 1 decision — escalate rather than guess
- When a ribbon, copy, or tooltip needs new words — Matt will write or approve

**Prompting notes:**
- Matt uses voice dictation. Interpret generously — "Form Bree" = Formspree, "Roianne" = Roianne. 
- Matt is a physicist, not a web developer. Translate technical tradeoffs into product/user consequences, not jargon.
- Matt is direct. Don't soften honest feedback with excessive preamble. Don't overclaim confidence. Say "I don't know" when you don't.
- Matt values research. Cite sources when you make a claim that depends on external convention or prior art.

---

## 26. Appendix — historical amendments

The amendments file (`CARD-REDESIGN-SPEC-AMENDMENTS.md`) contains the full chronological record of 42 amendments (A1-A42) written during the design sessions. Those amendments are now folded into this spec; the file is preserved in git history as reference material.

**Amendment → section map** (for anyone tracing a decision back to its reasoning):

| Amendments | Landing section(s) in this spec |
|---|---|
| A1 (slide vs flip) | §2 |
| A2 (AHA distinction manual) | §3.3, §12.7 |
| A3 (no watermarks) | §14 (upload — not enforced), §20 (share composites) |
| A4 (Media Generation deferred) | §24 |
| A5-A9 (orientation) | §3.6, §14 (classification), §22 (MediaAsset) |
| A10-A12 (motion rules) | §3.2, §7.3, §9.3 |
| A13-A20 (repo layout) | §23 |
| A21 (admin URL space) | §12.1 |
| A22-A23 (passkeys + provisioning) | §12.2, §12.3 |
| A24 (inquiries inbox) | §13 |
| A25 (notification prefs) | §17.2 |
| A26 (PWA) | §24 (Phase 2+) |
| A27 (dark mode) | §18, §24 |
| A28-A30 (ribbon copy) | §19 |
| A31 (outgoing share) | §20 |
| A32 (Shortcut upload) | §14, §21 |
| A33 (documents) | §16 |
| A34 (picker always confirms) | §14.2 |
| A35-A37 (RBAC) | §12.4, §12.5 |
| A38 (admin nav + herd + progressive) | §7.4, §12.6, §12.7, §12.8 |
| A39 (design tokens) | §18 |
| A40 (Settings, self-service Contributor, accent color, ownership transfer) | §17 |
| A41 (compare, Shortcut correction, platform scope, web upload) | §6, §14.1, §14.4 |
| A42 (card photo redesign) | §3, §4, §5 |

---

**End of consolidated specification.**

Questions? Grep this file for `🟦` to find all product-level decisions. Grep for `🟧` to find implementation details. Grep for `🟨` for specs that serve both.
