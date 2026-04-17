# Summers Ranch — Card Redesign Specification

*The authoritative document for the herd, card, admin, and gallery surfaces of Summers Ranch v2. This supersedes the herd-related sections of `RECOMMENDED-ARCHITECTURE.md` and `BEHAVIOR-PRESERVATION-CHECKLIST.md`. Where this document and those earlier documents conflict, this document is correct.*

*Date: April 17, 2026*

---

## 0. How to read this document

This spec has two audiences. Matt (product owner, physicist, not a web developer) needs to understand what's being built and why. Claude Code (coding agent, implementer) needs the technical specificity to build it correctly.

The document is structured so Matt can read the **Product** sections end-to-end in under an hour and skip or skim the **Implementation** sections without losing the thread. Section titles are marked:

- **🟦 Product** — what the user experiences and why. Read these.
- **🟧 Implementation** — how the coding agent builds it. Skim or skip unless curious.
- **🟨 Both** — integrated sections where product and implementation are too tightly coupled to separate.

Matt's review target for approval: all **🟦 Product** sections plus Section 18 (How to change things later) and Section 19 (Review checkpoints). Estimated reading time: 45–60 minutes.

Claude Code's target: the entire document. Estimated reading time: 90 minutes with cross-references.

---

## 1. 🟦 Product: What this is

Summers Ranch is a website for a family Hereford operation in Sutter Creek, California. Marty is the operator — retired rancher, iPhone user, not technical. Matt (his son-in-law) is the builder. The site is a gift from Matt to Marty, intended to be both **useful** (a real tool Marty will use to manage his herd) and **inspiring** (a site buyers respect, and that quietly nudges Marty toward professional seedstock practices).

The site has three distinct parts:

1. **Public signage.** Home, About, Gallery, Contact. Atmospheric, welcoming, not information-dense. The front porch of the ranch.
2. **Public herd catalog.** A sectional grid of cattle with baseball-card-style front/back presentations. Information-forward, trust-building, buyer-useful.
3. **Admin panel.** Password-protected. Marty manages the herd here. Same visual vocabulary as the public catalog so his mental model stays consistent across surfaces.

A fourth part — a media ingestion pipeline that receives photos from Marty's iPhone and routes them — exists as Phase 2 work and is not built as part of this spec. The data model and the curation systems described here are designed to accept that pipeline's output when it comes online.

**What this spec is not:** a complete v2 spec. It covers the herd, cards, admin surfaces, gallery, and supporting home-page details. It does not cover the iOS Shortcut workflow, the media processing pipeline, the admin authentication details, the calendar/seasonal detection system, the AHA registration workflow, or any Phase 2+ features. Those remain in other documents or are explicitly deferred.

---

## 2. 🟦 Product: The baseball card metaphor

The core organizing idea for the herd catalog is a **baseball card**. Every animal in the herd has a card. The card has a **front** (photo-dominant, six essential stats, emotional anchor) and a **back** (detailed information, stats, pedigree, history). The user can flip between front and back by swiping horizontally on mobile or clicking a button on desktop.

Cards live together in a **binder** — the herd page shows them organized into sections by animal type (Bulls, Cows, Heifers, Calves, Reference), the way a physical collectible binder organizes cards by category.

This metaphor is deliberate. Three reasons:
- **Legibility.** Every buyer, rancher, and family member immediately understands what a baseball card is and how to use one.
- **Honest to the data.** Cattle are discrete entities that are evaluated individually, which is exactly what baseball cards present.
- **Differentiation.** Peer Hereford ranch websites present their cattle as static text-heavy pages. The card-binder presentation stands out without being alien.

**Restraint is load-bearing.** The metaphor must stay understated. No page-flip animations between binder sections, no holographic effects, no card-back shadows following the cursor, no skeuomorphic stitched edges. Clean, tasteful, confident. The metaphor guides the flip interaction and the identity relationship between front and back; it does not govern text density or visual decoration.

**The back of the card is not card-shaped.** The front is roughly screen-shaped and photo-dominant. The back is a long-form scrollable document about the animal. The flip animation governs transition between the two; typography on the back follows standard reading-UX conventions (comfortable line length, proper hierarchy, scannable section structure). No attempt to shrink text to preserve card proportions on the back.

---

## 3. 🟦 Product: The card — front

When a visitor opens an animal's card, the front is the first thing they see. The front is designed to let the viewer evaluate the animal at a glance: who is this, what kind of animal, how do they look, what's their status.

### 3.1 Core contents

The front of every card contains:

- **A cycling photo** filling most of the card. Displays the three most recent canonical views of the animal (side profile, headshot, three-quarter) in rotation.
- **Six core data points** rendered cleanly at the bottom of the card:
  1. Tag number
  2. Name (if named — omitted entirely if not)
  3. Sex
  4. Breed
  5. Age
  6. Status (For Sale / Breeding / etc.)
- **Four corner affordances** with defined purposes:
  - Top-left: Birthday banner *or* distinction ribbon (DOD / SOD) when applicable
  - Top-right: "For Sale" diagonal ribbon when status is sale
  - Bottom-left: Capture date of the currently-displayed photo
  - Bottom-right: Registration number when registered (display only, not a link on the front)
- **A "Details ›" affordance** on the right edge indicating the card can be flipped

The six core data points and the four-corner affordances together constitute the entire non-photo content on the front. If a field is null, it is hidden, not shown as "—" or "Not set." Better empty than wrong.

### 3.2 Photo cycling behavior

Photos cycle every **5 seconds** with a **~700ms crossfade** (both photos briefly visible during transition, no snap). If only one photo of the animal exists, the display is static — it does not try to cycle through a single image.

Cycling pauses automatically when the user is engaged with the card (hovers on desktop, touches on mobile, interacts with a control). A small pause/play indicator appears on engagement in the corner of the photo, using semi-transparent-fill-with-defined-border treatment — readable on any photo without reading as a flat white box. Resumes when the user disengages.

`prefers-reduced-motion` users see no cycling — first photo is displayed statically.

### 3.3 Corner affordances in detail

**Top-left (birthday / distinction):**
- The distinction ribbon (Dam of Distinction or Sire of Distinction) occupies the top-left slot permanently when earned. It is a vertical ribbon hanging from the top edge of the card, roughly 40-50px wide, with a flat rectangular top and a chevron-notched bottom. DOD uses blue fill; SOD uses red. Vertical stacked text reads "DOD" or "SOD" in uppercase. Each has a subtle border/shadow to lift it off the photo without reading as sticker-y.
- When no distinction exists, the birthday banner occupies this slot *on the animal's birthday only*. Same vertical ribbon shape, sex-coded (blue for bulls and bull calves, pink for cows, heifers, and heifer calves — traditional gender color grammar, intentionally chosen because it matches convention).
- When both distinction and birthday coexist, the distinction ribbon stays in the top-left slot and the birthday ribbon appears immediately to its right, offset. Two ribbons, side-by-side, no collision. The ribbons never merge or compete.

**Top-right (For Sale):**
- Diagonal ribbon across the top-right corner, the classic convention for "call attention to this item." Appears only when status is `sale`. Gold fill with white or dark text reading "FOR SALE" in uppercase. Never competes with anything else — the top-right is reserved for this single ribbon.

**Bottom-left (photo date):**
- Small text overlay showing the **capture date** (month and year only) of the currently-displayed photo. Updates as the photo cycles. Same semi-transparent overlay treatment as other chrome.

**Bottom-right (registration number):**
- When registered, the AHA registration number appears as small text in the bottom-right (e.g., "AHA# 44000820"). Display only on the front — it's not tappable from the front. The back of the card turns this into an external verification link (see §4.5).
- When not registered, this slot is simply empty. No placeholder, no chrome.

### 3.4 Ribbon interactivity

**Single-tap-shows-tooltip, tap-link-within-tooltip-to-navigate.**

Tapping any ribbon opens a small contextual tooltip near the ribbon. The tooltip adds context beyond the ribbon label — never a bare repeat. Tooltip content:

- **For Sale:** *"This animal is for sale. Ask about [Name]"* with "Ask about [Name]" as the tappable link
- **Distinction (DOD):** *"Dam of Distinction — awarded by AHA, [year]. Verify on hereford.org ↗"*
- **Distinction (SOD):** *"Sire of Distinction — awarded by AHA, [year]. Verify on hereford.org ↗"*
- **Birthday:** *"Happy birthday, [Name] — born [full date]"* (no navigation link)

Tooltip behavior:
- Appears on tap (mobile) or hover (desktop).
- Non-modal: the rest of the page remains fully interactive. Scrolling still works. Other taps work.
- Auto-dismisses after 5 seconds if untouched.
- Any tap outside the tooltip dismisses it immediately.
- Tapping the link *within* the tooltip triggers navigation.

This protects Marty and other older-user peers from accidental fat-finger navigation while preserving single-tap discovery for intentional users.

### 3.5 🟧 Implementation: photo selection logic

The three photos shown in the front cycle come from applying this priority:

1. Most recent photo tagged as `side` canonical view (from the MediaAsset shot-type classification)
2. Most recent photo tagged as `head` canonical view
3. Most recent photo tagged as `three-quarter` canonical view

When a canonical type is missing:
- Fall back to the most recent non-canonical photo for that animal
- If fewer than 3 photos total exist, cycle through however many exist
- If only 1 photo exists, display static (no cycle)
- If 0 photos exist and the animal is a reference animal, display the stylized Hereford silhouette placeholder (see §15)
- If 0 photos exist and the animal is not a reference animal, display a neutral placeholder and fire a coverage nudge (see §9.2)

A photo's `forceInclude` flag (admin-set, time-bounded by life-stage staleness threshold) overrides normal priority for its shot type. `forceExclude` flag removes a photo from candidacy permanently.

---

## 4. 🟦 Product: The card — back

Flipping the card reveals the back — a long-form scrollable surface containing everything a serious buyer (or Marty) could want to know about the animal. The back replaces what the original architecture doc called the "detail page." There is no separate detail page; the back of the card is the detail page.

### 4.1 Structure: eight sections

The back of the card is organized into eight expandable sections, in order:

1. **Identity & Registration** — *default expanded*
2. **Pedigree** — *default expanded*
3. **Performance** — *default expanded if any data exists; entire section hidden if all fields null*
4. **Health Tests** — *default collapsed; entire section hidden if all fields null*
5. **EPDs** — *default collapsed; entire section hidden if all fields null*
6. **Breeding Status** (females only) — *default expanded*
7. **About This Animal** — *default expanded if Marty has written anything; entire section hidden if empty*
8. **Acquisition** — *default collapsed; entire section hidden unless `showSourcePublicly` is true (admin) or populated (public)*
9. **Timeline** — *default expanded* (photo history chronologically, always present when any public photos exist)

The ordering follows a buyer's natural reading arc: *who is this animal* (identity, pedigree) → *what can she do* (performance, health, EPDs, breeding) → *who is she as an individual* (about) → *where did she come from* (acquisition) → *what has she looked like* (timeline).

### 4.2 Section contents

**Identity & Registration:**
- Tag and tag history (if the animal has retagged, show previous tags as context)
- AHA registration number (tappable external link, see §4.5)
- Tattoo
- Date of birth
- Horn status (horned / polled / dehorned)
- Sex
- Co-ownership note, if applicable
- Distinction designations with year awarded, each linking to hereford.org for verification

**Pedigree:**
- Sire (internal link to sire's card if in-herd; external hereford.org link if reference-only; plain text if completely unknown)
- Dam (same logic as sire)
- Maternal grandsire / grand-dam when available
- Full and half siblings, as tappable chips, when they exist in the herd

**Performance:**
- Birth weight
- Weaning weight (with 205-day adjusted value when calculable)
- Yearling weight (with 365-day adjusted value when calculable)
- Scrotal circumference (bulls only, at yearling measurement)
- Weight ratios when a contemporary group is defined
- Calving ease score (1-5)
- Disposition score (1-6 BIF scale)

**Health Tests:**
- BVD-PI test status (null / negative / positive)
- Semen test status (bulls only; null / passed / failed / last-test-date)
- Genetic defect test results (list of test-name-plus-result pairs)
- Johnes disease status if declared

**EPDs:**
- Full EPD panel when Marty has submitted TPR data to AHA
- Top-X% notations surfaced as visual highlights ("Top 5% CE & MCE")
- For v1 this section will generally be empty for all Marty's animals — he has not submitted TPR data yet. The section materializes as data populates.

**Breeding Status (females only):**
- Current pregnancy status (open / bred / confirmed)
- Expected calving date (loose format accepted: "Spring 2026" or "2026-03-15")
- Breeding method (AI / natural / embryo transfer)
- Sire of current breeding
- Calving history count (number of calves to date, public-relevant outcomes only)

**About This Animal:**
- A short narrative paragraph written by Marty describing the animal's personality, history, what he values about her. This is where the ranch's warmth lives on the card.
- Length: 50-200 words typical. Not a sales pitch; personal observation.
- If empty, the entire section is hidden.

**Acquisition:**
- Source ranch (if `showSourcePublicly` is true on public view)
- Acquisition method (private treaty, auction, consignment, production, online, other)
- Acquisition date
- Always visible in admin. Visible publicly only when the admin has explicitly opted to share.

**Timeline:**
- All public-eligible photos of this animal in chronological order (oldest to most recent)
- Each photo shows capture date
- Click/tap any photo to open a lightbox with that photo enlarged
- Lightbox navigation pages through the timeline in order

### 4.3 Sticky section headers and edit affordances

The back is a long scrollable document. When a section is expanded and the user scrolls past its header, **the header pins to the top of the scroll area** and remains visible until the next section's header arrives. This is the standard iOS contacts-list pattern, correctly applied to a long document.

**In public mode**, the pinned header shows:
- Section title (left)
- Expand/collapse chevron (right)

**In admin mode**, the pinned header additionally shows:
- An "Edit" button on the right side, next to the collapse chevron

### 4.4 Admin edit interaction on the back of card

See §6 (Admin mode differences) for full details. Summary: tapping Edit converts the section's fields to inputs, replaces Edit with Save + Cancel in the pinned header, supports chained field progression via Enter key, and returns to read-only state on save. Cancel discards all section changes. No auto-save.

### 4.5 External link behavior — registration and hereford.org

**The registration number on the back of the card is a tappable external link.** Tapping it follows the same two-step tooltip protection as ribbons:

- First tap opens a tooltip: *"Verify registration #44000820 on hereford.org ↗"*
- Second tap on the tooltip link navigates to hereford.org
- Navigation uses same-tab behavior (scroll position acceptably lost; browser back returns to herd)
- The tooltip dismisses on outside tap or after 5 seconds

All external links on the back of the card use this same two-step pattern: pedigree fallback links for reference animals, distinction verification links, acquisition-source references, anywhere else external navigation might occur. Internal links (to sire/dam cards within the herd) remain single-tap.

### 4.6 Internal sire/dam links and return navigation

When an internal sire or dam link is tapped, the current card's state is saved and the linked animal's card opens. When the user closes that card (via back chevron, top-right ×, or swipe right), they return to **the originating animal's back of card**, regardless of how deep they navigated.

Memory is **one-level only**: if the user went from Animal A to Dam B to Grandam C, closing returns to Animal A, not to Dam B. This is the baseball-card-binder mental model: pull a card, look at related cards, put them all back when done. Browser back still works normally for users who want finer-grained history.

### 4.7 Inquire CTA — "Ask About This Animal"

For animals with status `sale`, two "Ask About This Animal" buttons appear on the back of the card:

- **Inline near the top**, in the Identity section's status area, where "Status: For Sale" renders. The CTA appears as a prominent button using the gold palette token.
- **Inline at the end** of the back of card content, after the Timeline.

Both buttons are identical in function and style. Having both positions means a buyer who wants to inquire immediately can do so without scrolling; a buyer who reads everything arrives at the CTA naturally at the end.

For animals *not* for sale, neither button appears. The layout region near the status field remains empty (visible whitespace is preferable to layout-shift-by-status). This region is reserved for future contextual actions on non-sale animals: "View Calves," "View Lineage," etc. — not in Phase 1.

**Button behavior:**
- Tap opens an overlay modal over the current page (does not navigate away)
- Modal contains a Formspree form (existing ID: mzdybyjl) pre-filled with:
  - Subject: "Inquiry about #[Tag] [Name]"
  - Animal reference fields
  - Empty user-fillable fields for name, email, phone, message
- Modal header shows "Inquiring about #[Tag] [Name]"
- Modal has an × close button in top-right
- On successful submit, modal fades; a brief "Thanks for your interest" toast appears at the bottom of the page for ~3 seconds, then fades
- User returns to exact scroll position and view state
- User can submit inquiries for multiple animals without leaving the herd flow

---

## 5. 🟦 Product: Herd page layout

The herd page (`/herd`) is where visitors browse all the animals. It's the most important public page.

### 5.1 Sectional binder organization

Cards are grouped into sections by animal category:

1. **Bulls**
2. **Cows**
3. **Heifers**
4. **Calves**
5. **Reference** (outside animals tracked for pedigree)

Each section has a clear header with the section name. Empty sections are **hidden entirely** — no "Bulls (0)" header, no placeholder text. The herd appears full regardless of composition.

Sold animals never appear on the public herd page (they remain in admin only, for Marty's records). If all sections are empty (improbable edge case), a warm empty-state message appears: *"The herd is resting. Check back soon."*

### 5.2 Two display modes

**Cards mode (default):**
- Desktop: 3 cards per row at standard widths, 2 at tablet, 1 at phone widths
- Mobile: one full-viewport card at a time, paged vertically
- Each card shows the full front with all affordances

**Compact mode:**
- Both desktop and mobile: list rows with thumbnail (left), summary (middle), and swipe-affordance (right)
- Swiping right on a mobile compact row flips to the full-screen back
- Clicking a desktop compact row opens full-screen card view
- Same back-of-card content regardless of which mode was used to reach it

Mode toggle is available in the herd-specific header (see §5.4). Choice persists in localStorage per device.

### 5.3 Sorting and filtering

**Sorts:**
- Tag number (default)
- Age (tap to toggle oldest-first vs. youngest-first)
- Admin mode adds a third sort: **Needs Attention** — flattens sections into one list ordered by nudge priority (high → medium → low → no nudges)

Sorts apply *within sections* in binder layout. Sorting by Age in Cards mode shows the youngest cow within the Cows section, not interleaved with the youngest calf.

**Filters:**
- All (default)
- For Sale

Only two filter chips, intentionally. The sectional layout handles category-based filtering (someone looking for "just the bulls" scrolls to the Bulls section). Adding sex/age filters would clutter the header for little additional value.

### 5.4 Page headers

Two headers always visible on the herd page:

**Site header** (shared across all pages):
- Ranch logo/name (links to Home)
- Hamburger menu with full site navigation

**Herd-specific header** (only on `/herd`):
- Mode toggle: Cards / Compact
- Sort selector: Tag / Age (with age direction toggle)
- Filter chips: All / For Sale

Both headers remain visible during scroll. If layout testing shows this is too heavy on a phone viewport, we'll revisit; initial build assumes both always-visible.

### 5.5 Card interaction

**On mobile (Cards mode):**
- Vertical swipe up/down: pages to next/previous animal
- CSS scroll snap makes paging feel native (`scroll-snap-type: y mandatory` on container, `scroll-snap-align: start` on each card)
- End-of-herd: rubber-band bounce at bottom with a warm message *("That's the whole herd. Check back for new calves.")*; silent bounce at top with no message
- Pull-to-refresh disabled (`overscroll-behavior: contain`)
- Horizontal swipe left (in the middle ~85% of card width): flip card to back
- Horizontal swipe right on back: return to front
- 20px dead zone at left and right screen edges reserved for OS back-gestures
- Intent detection: first 10-15px of movement determines whether the gesture is horizontal (flip) or vertical (page) — predominantly horizontal movement triggers flip mechanics

**On mobile (Compact mode):**
- Vertical scroll through list rows (no snap)
- Swipe right on a row flips to that animal's full-screen back
- Pull-to-refresh still disabled

**On desktop:**
- Scroll is vertical scroll (no snap in either mode)
- Click on a card opens full-screen card view
- Click on "Details ›" or on a compact row's swipe affordance flips to back
- Click on × or back chevron from back returns to the herd view at preserved scroll position

### 5.6 Flip animation details

The flip is an **interactive transition** — the card tracks the user's finger in real time during a horizontal swipe.

**Commit thresholds:**
- Distance threshold: 50% of card width dragged triggers commit
- Velocity threshold: release with horizontal velocity > 500 px/s triggers commit (a fast flick counts even at short distance)
- Below both thresholds on release: spring back to original face

**Animation timing:**
- Spring-back (threshold not met): ~250-300ms damped-spring animation
- Commit-through (threshold met): ~200-250ms damped-spring to 180°
- Button-triggered flip (tap "Details ›"): same spring, plays through without tracking

**Accessibility fallbacks:**
- `prefers-reduced-motion`: instant swap or opacity crossfade instead of 3D rotation
- Older hardware: coding agent may fall back to horizontal slide-in-from-right if 3D flip performance is poor

**Implementation notes:**
- CSS `transform: rotateY()` with `backface-visibility: hidden` on two stacked faces
- The tracking during gesture requires custom JavaScript gesture handling; the animation on commit/cancel can use CSS transitions
- Build non-animated swap first as a correctness baseline, then layer the 3D flip on top

---

## 6. 🟦 Product: Admin mode differences

The admin panel uses the **same card component** as the public herd catalog, with a mode prop distinguishing public from admin. This means Marty sees his herd organized the way buyers see it. The consistency is deliberate: his edits happen in the same visual frame that the public experiences, so he always has an accurate preview of public presentation.

### 6.1 What's different in admin mode

**On the front of the card:**
- Admin sees additional status indicators as small discreet chrome: `Needs Review` when nudges are open, `Pregnancy Overdue`, `Unbranded` as warranted
- These use distinct visual treatment (not ribbons — they're admin-only context chrome)

**On the back of the card:**
- All empty fields render as "teaching moment" prompts with placeholder text and information tooltips (see §6.2)
- The Sale Details section appears when status is `sold` (private notes, buyer, method, date)
- The Removal Details section appears when status is `culled` or `deceased`
- The Acquisition section is always visible (not gated by `showSourcePublicly`)
- Pregnancy internals (`pregnancySetDate`) are visible
- Registration workflow state is visible (eligibility, in-progress, blocked, etc.)
- Private notes are visible
- The per-animal nudge list appears at the top of the back (see §9.1)
- Each section header includes an "Edit" button

**Additional admin sections (not shown publicly):**
- **Photos management** — Prefer/Hide controls per photo, reassign to different animal, force canonical-view overrides
- **Calf reassignment / weaning retag** — workflow for transitioning a calf from dam's provisional tag to its own tag

### 6.2 Admin input flow philosophy

The admin's primary job is data entry, often in batch. Design principles:

**Chained progression with zero cursor friction:**
- Enter advances to the next logical field within the same section
- Enter on the last field of a section dismisses the keyboard and deactivates focus — the user sees the full viewport including the pinned Save/Cancel header
- No Enter-to-save (too easy to confuse with field advancement on mobile keyboards)
- All fields that take numeric input trigger number keyboards on mobile
- Tag fields auto-uppercase; auto-trim whitespace on save
- Tag fields of known-length patterns may auto-advance when complete

**Placeholder text and information tooltips on every field:**
- Every empty field shows grayed italic placeholder text suggesting what belongs in the field
- Every field label has a small italic-i-in-a-bubble icon next to it
- Tapping/hovering the icon shows a plain-language tooltip explaining:
  - What the field means
  - Why it matters to buyers
  - Examples where useful
- Tooltip content is warm and educational, following the "admin panel is a teacher" principle

**Section-level edit mode:**
- Tap Edit in a section's pinned header
- That section's fields become editable inline
- Edit button transforms into Save + Cancel, both in the same pinned header
- Other sections visually mute slightly to indicate focus
- Explicit save only — no auto-save
- Cancel discards all section changes, returns to original values
- Save commits section changes, returns section to read-only, shows brief inline "Saved" pulse on section header

**Validation:**
- Inline error rendering near the offending field
- Save button disabled while errors exist
- If user attempts save with errors, the form auto-scrolls to the first error and the Save button briefly pulses

**Collapse behavior during edit:**
- Tapping Edit on a collapsed section expands *and* enters edit mode in one action
- Sections cannot be collapsed while in edit mode (must save or cancel first)

### 6.3 Nudge-triggered edit flow

When Marty clicks a nudge:
- The animal's card opens, back-of-card state
- Auto-scrolls to the targeted section
- Expands the section if collapsed
- Highlights the targeted field with a brief gold pulse (2-3 seconds)
- Highlights (gold-pulses) the section's Edit button
- **Does NOT auto-enter edit mode** — Marty taps Edit to confirm he's ready to change something

This preserves the principle: *edit mode is always opened explicitly, never automatically.*

### 6.4 Post-save chaining

When Marty saves a section:
- Brief inline "Saved" pulse on the section header (~1-2 seconds)
- If there are more nudges on the same animal, a non-blocking toast appears at the bottom of the viewport: *"2 more items need attention on this animal — next: weaning weight."*
- The toast has one action: "Go to it" (scrolls to the next nudge's section, highlights per §6.3)
- Dismissing the toast with × or letting it time out (5s) just dismisses it — Marty stays where he is
- If no more nudges exist on this animal, no toast appears
- Nudges remain listed at the top of the back-of-card for reference regardless

### 6.5 Admin sort: "Needs Attention"

The admin-only third sort option flattens all sections into one list, ordered by nudge priority:
- High priority nudges first (sale stale photos, pregnancy overdue, unbranded)
- Medium priority next (missing basics, coverage gaps)
- Low priority after (stale photos for non-sale, missing canonical views)
- Animals with no open nudges at the bottom

This sort exists because Marty's most common admin workflow is "what needs my attention right now." The default sort (Tag) and the secondary sort (Age) serve browsing; "Needs Attention" serves triage.

### 6.6 Archive and sold animals in admin

- **Sold animals** appear in a greyed section at the bottom of the admin herd view, after Reference
- **Archived animals** (removed from herd) appear in a collapsible section below Sold
- Marty can restore an archived animal to active herd
- Sold animals cannot be "un-sold" by admin action — if an error, Marty must manually edit status and sale fields

---

## 7. 🟦 Product: Nudges — per-animal and coverage

Nudges are the system's mechanism for surfacing work that needs doing. There are two distinct nudge classes with different semantics.

### 7.1 Per-animal nudges

Tied to a specific animal's data state. React to missing or stale fields on a specific record.

**Examples:**
- "Animal #840 has no weaning weight"
- "Animal #847's side profile photo is 200 days old and she's listed for sale"
- "Animal #853 is branded: false and has been in the herd for 90+ days"
- "Animal #861 has pregnancy overdue — expected calving was 2026-03-15"

**Where they appear:**
- Aggregated in the admin dashboard nudge section
- Listed at the top of the back-of-card (in admin mode) for that specific animal
- Clicking a nudge deep-links per §6.3

**Priority levels:**
- **High:** Sale animal with stale photos (>60 days), sale animal with no photos, pregnancy overdue (>300 days from `pregnancySetDate` or >14 days past `expectedCalving`)
- **Medium:** Missing basics, multiple calves same dam (retagging needed), registration eligibility aging >60 days
- **Low:** Stale photos for non-sale animals (life-stage thresholds, see §15), missing canonical view classifications

**Persistent nudges:**
- Unbranded active herd animals do not count calves still nursing
- Dismissal is 24-hour localStorage-based; nudge returns after 24 hours if not addressed
- Persistent nudges reappear regardless of dismissal

### 7.2 Coverage nudges

A new class of nudge, distinct from per-animal nudges. Fire predictively when a system need cannot be fulfilled.

**Characteristics:**
- Not tied to a specific animal
- Fire before the gap is publicly visible (predictive, not reactive)
- Address by *adding new content* rather than editing existing records
- Deep-link where possible — a "gallery missing summer landscape" nudge might deep-link to the admin upload pane with the correct category pre-selected

**Examples:**
- "Hero slot rotates in 47 days. Eligible summer hero candidates: 0"
- "Wall secondary slot rotating next month. Eligible 'Theodore' photos: fewer than 3"
- "Animal #840 is newly for sale and is missing a three-quarter shot for complete public presentation"
- "3 animals are registration-eligible and have been eligible for 60+ days. Consider submitting"

**Where they appear:**
- Same admin dashboard nudge section, mixed with per-animal nudges, sorted by priority
- Visually distinguished (slightly different icon indicating "system" vs. "animal")
- Matt can see them too — they reflect his work as well as Marty's

**Priority scaling:**
- Based on urgency/time-to-impact
- A Wall slot rotation 60+ days out: low priority
- 30-60 days out: medium priority
- <30 days out: high priority
- Overdue (should have rotated already, couldn't): high priority and persistent

### 7.3 Dismissal behavior

- Both nudge classes support 24-hour localStorage-based dismiss
- Dismissed nudges return after 24 hours regardless
- Persistent nudges (unbranded, overdue pregnancy, can't-rotate-slot) reappear even after dismiss

---

## 8. 🟦 Product: The Gallery — "The Wall"

The Gallery page is **not** a masonry grid of photos. It is a curated editorial composition — conceptually, a gallery wall in a home, themed around ranch, family, and place.

### 8.1 Concept

Every image on the wall earns its position. The Wall displays 9-13 photos at a time arranged in an intentional composition. Some images are larger (the hero), some medium, some small — an editorial page design rather than an auto-flow grid. The composition is stable; what fills the composition rotates.

### 8.2 Slot roles

The Wall has named slots, each with a defined role:
- **1 Hero slot** — largest. Landscape or emotionally anchoring image. Rotates seasonally (4 changes per year)
- **2-3 Secondary slots** — medium-sized. Content mix of cattle, people, ranch work. Rotate monthly, staggered
- **4-8 Supporting slots** — smaller, varied. Rotate monthly, staggered differently from secondaries so the whole Wall doesn't swap at once

### 8.3 Content categories

The AI classifier (Phase 2) tags each piece of media with a `galleryCategory`:
- `landscape` — ranch scenery, wide shots
- `theodore` — the Junior Ranch Hand
- `marty` — Marty at work or in a portrait
- `roianne` — Roianne at work or in a portrait
- `family` — family moments, group shots
- `ranch-work` — people working on the ranch
- `cattle-life` — cattle in context, not for-sale evaluation
- `seasonal` — photos with strong seasonal association
- `hunting` — hunting-themed content (Marty's hobby; no dedicated section, flows in when seasonally apt)

Each piece of media can also have `seasonalAffinity`: `spring` | `summer` | `fall` | `winter` | `year-round` | `null`

And `isWallCandidate`: admin override (default true for gallery-classified photos passing quality thresholds).

### 8.4 Automated curation

The curation engine handles slot-filling based on:
- Category matches (hero slot prefers `landscape` or `cattle-life` seasonal shots)
- Seasonal affinity matches current season
- Freshness preferences (more recent photos weighted higher)
- No-repeat-too-soon rules (photo shouldn't cycle back into same slot for N months)
- Quality classification (only "excellent" or "good" photos are candidates)

**Rotation is fully automatic.** No "refresh the Wall?" prompt. Rotations happen on predefined schedules (hero seasonal, secondary/supporting monthly) and swap silently.

**Admin override:** Matt (rarely Marty) can pin a specific photo to a specific slot. Pins are time-bounded by the same life-stage staleness clock; they auto-expire rather than persist forever.

### 8.5 Coverage nudges for the Wall

When the curation engine cannot fill a slot — no eligible photos exist for the category + season + quality combination — a coverage nudge fires (see §7.2).

Examples:
- "Hero slot rotates in 47 days. No eligible summer hero candidates."
- "Secondary slot needs cattle-life winter photos. Fewer than 3 available."

The nudge deep-links to the admin media upload view with the needed category pre-selected.

### 8.6 Lightbox behavior

Clicking any Wall photo opens a lightbox showing that photo at full size. Lightbox navigation (swipe left/right on mobile, arrow keys on desktop) cycles through **all Wall images in their layout sequence** — not by category, not by random. The Wall *is* the curation; the lightbox respects that sequence.

### 8.7 Captions

Minimal. No internal links to the Herd (gallery photos are historical artifacts; linking them to current cow cards creates awkwardness when animals change or leave).

Format: `[Name], Month Year` when a subject is identified, or just `Month Year` otherwise. Pure landscape shots may have no caption at all.

### 8.8 Mobile adaptation

On mobile, the Wall becomes a **vertical stacked composition** that preserves the slot hierarchy: hero at top, secondaries below, supporting images further down. Same curation, same rotation, adapted layout.

### 8.9 Phase 1 deliverable for the Wall

Phase 1 ships a **static placeholder Wall** with 9-13 hand-arranged placeholder images. The slot structure is present and visible. The curation engine, seasonal rotation, AI classification, and coverage nudges are all Phase 2+.

Phase 1's job for the Wall: establish the visual pattern and the data model fields that support future automation. Matt arranges the placeholder Wall manually for launch.

---

## 9. 🟦 Product: Home page

The Home page is the front porch of the ranch. Quiet, welcoming, not information-dense.

### 9.1 Structure

**Above the fold:**
- Full-viewport hero image (atmospheric landscape, rotates seasonally via the same curation engine as the Wall's hero slot)
- Overlay: **"Summers Ranch"** in the display font, subtitle with breed + location ("Registered Herefords — Sutter Creek, California")
- "Established [year]" (requires Matt to confirm the correct year with Marty)
- Subtle scroll-down indicator

**Below the fold:**
- Short welcoming paragraph (2-3 sentences) — the ranch's essence in brief
- Single prominent call-to-action: **"See the Herd"** → `/herd`
- Theodore moment — photo + one line of copy ("Junior Ranch Hand")
- Footer

**What's not on the Home page:**
- No featured cattle section
- No blog
- No recent news
- No recent sales
- No featured animal cards

The cards on the Herd page do the "featuring" work themselves through their design. Home is quiet on purpose. Peer sites cluttered with feature carousels are exactly what we're distinguishing from.

### 9.2 Family narrative belongs on About

The energy of "these animals are special" — the Draft A impulse — lives on the **About page** as family story. About describes the ranch, the people, the animals they've bred over decades. That surface doesn't go stale and it's the right register for warmth.

---

## 10. 🟦 Product: About, Contact, Gallery pages

### 10.1 About

Family story. Photos of the family and ranch. Marty, Roianne, Theodore. Property history. How Marty and Roianne came to the ranch.

Content guidance:
- Warm, not corporate
- Personal voice — Marty or Matt writing, not marketing
- Mentions some notable animals (Sweetheart, the longtime matriarch; notable sires) as part of the ranch's story, with restraint
- Hunting as Marty's hobby is mentioned here (if at all) as part of his character, not as a service offering

Content is placeholder in Phase 1. Matt will review with Marty and Roianne during pre-launch content review.

### 10.2 Contact

Formspree form (existing ID: `mzdybyjl`). Simple fields: name, email, phone, subject, message. No surprise requirements.

Other content:
- Email: info@mrsummersranch.com
- Phone number (Google Voice planned, not yet live)
- Physical location: Sutter Creek, CA (town/county only, no address for security)

### 10.3 Gallery

See §8 (The Wall). Gallery is called "The Wall" internally and in spec documents; the nav label is "Gallery" for external familiarity.

---

## 11. 🟦 Product: Navigation and hamburger

### 11.1 Site header

The site header appears on every page and contains:
- **Ranch logo/name on the left** — always links to Home
- **Hamburger menu on the right** — opens the navigation menu

### 11.2 Hamburger menu contents

**Public user (no admin cookie):**
- Home
- About
- Herd
- Gallery
- Contact

**Admin-authenticated user (admin cookie present in browser):**
- Home
- About
- Herd
- Gallery
- Contact
- — divider —
- Admin
- Log Out

The admin link does not appear to public users. It lives in the footer as plain text for first-time admin access (see §11.3).

### 11.3 Footer

Every page's footer contains:
- Copyright line with auto-updating year
- Privacy (link to /privacy)
- Terms (link to /terms, if created)
- Admin (plain text link, small, alongside other utility links — not prominent but not hidden)

The Admin link in the footer is the entry point for Marty's first login on a new device. Once he logs in, the hamburger menu picks up the admin shortcut automatically.

### 11.4 Login page

When Marty taps Admin in the footer, he lands on a simple login page:
- Password field (no username — single-user system for now)
- "Remember me" checkbox, **unchecked by default**
  - If unchecked: session expires when browser closes
  - If checked: HTTP-only cookie persists for 30 days on this device
- Submit button
- No "forgot password" flow yet (Marty knows his password; if ever forgotten, Matt handles recovery manually)

---

## 12. 🟦 Product: Privacy — what's never public

Certain data is always private, regardless of admin toggle state:
- Sale details: who bought, for how much, sale notes
- Removal details: date, reason, circumstances
- GPS coordinates from photos (stripped on ingest)
- Device info from photos
- Pregnancy tracking internals (`pregnancySetDate`)
- Registration workflow state before "registered"
- Private admin notes

Certain data is private by default but user-controllable:
- Acquisition source ranch (admin opts in via `showSourcePublicly`)
- Acquisition method

Everything else on the data model is public when populated. Absence is invisible — empty fields simply don't render.

**No cookie banner.** The site uses localStorage only for UI preferences (mode toggle, nudge dismissals), which qualifies as functional/strictly-necessary storage under GDPR and CCPA frameworks. No analytics, no trackers, no third-party cookies. Privacy policy in the footer discloses what's stored and why. If analytics or tracking are ever added later, this policy gets revisited.

---

## 13. 🟨 Photo pipeline — staleness thresholds

Life-stage-anchored photo staleness drives the nudge system and the Prefer-flag expiry.

| Life stage | Definition | Staleness threshold |
|---|---|---|
| Newborn | 0–60 days | 30 days |
| Young calf | 60–205 days (pre-weaning) | 60 days |
| Weanling | 205–365 days | 90 days |
| Yearling | 1–2 years | 180 days |
| Mature (not for sale) | 2+ years | 365 days |
| Mature (for sale) | 2+ years, status `sale` | 60 days |
| Reference | any | never nudges |

**Prefer-flag (`forceInclude`) expiry matches the staleness threshold for the animal's life stage.** A Prefer flag set on a newborn photo expires after 30 days. A Prefer flag set on a mature adult's photo expires after 365 days. Single unified clock. After expiry, the automatic photo-selection logic resumes.

**Hide flag (`forceExclude`) does not expire.** Hide is a permanent judgment about a specific photo being wrong-to-show.

### 13.1 Prefer flag refresh nudges

A medium-priority nudge fires when:
- A Prefer flag is set on a photo
- The photo's shot type has a newer alternative (>90 days newer)

Message: *"Preferred side-profile photo of #840 is from March 2024. A newer photo from October 2025 is available."*

Tapping the nudge deep-links to the Media tab's view for that animal, with the old and new photos side-by-side.

---

## 14. 🟨 Data model additions and changes

### 14.1 Animal schema additions

Add to the existing `Animal` interface:

```typescript
interface Animal {
  // ... existing fields
  
  // Distinction designations (AHA DOD/SOD, show championships, etc.)
  distinctionBadges: DistinctionBadge[]
  
  // Health test fields
  bvdPiTestStatus: 'negative' | 'positive' | null
  semenTestStatus: {
    status: 'passed' | 'failed'
    lastTestDate: string
  } | null  // Bulls only
  geneticDefectTests: GeneticDefectTest[]
  johnesDiseaseStatus: 'negative' | 'positive' | 'untested' | null
  
  // Horn status — already covered by breed detail in practice, but worth making explicit
  hornStatus: 'horned' | 'polled' | 'dehorned' | null
  
  // Co-ownership
  coOwnership: string | null  // Free-text field: "Co-Owned With: Clif & Sheri Overmier"
  
  // Narrative
  aboutThisAnimal: string | null  // Marty's personal description
}

interface DistinctionBadge {
  type: 'DOD' | 'SOD' | 'champion' | 'other'
  year: number
  organization: 'AHA' | 'other'
  reference: string | null  // e.g., URL to specific recognition listing
  notes: string | null
}

interface GeneticDefectTest {
  testName: string  // e.g., "Dwarfism", "Idiopathic Epilepsy"
  result: 'free' | 'carrier' | 'affected' | 'tested-negative'
  testedDate: string
}
```

### 14.2 MediaAsset schema additions

Add to the existing `MediaAsset` interface:

```typescript
interface MediaAsset {
  // ... existing fields
  
  // Gallery-specific classification (null for cattle-only photos)
  galleryCategory: 'landscape' | 'theodore' | 'marty' | 'roianne' | 'family' | 'ranch-work' | 'cattle-life' | 'seasonal' | 'hunting' | null
  seasonalAffinity: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round' | null
  isWallCandidate: boolean  // Admin override; default true if galleryCategory is set and quality is excellent/good
}
```

### 14.3 CattleMediaLink schema additions

```typescript
interface CattleMediaLink {
  // ... existing fields
  
  // forceInclude is now time-bounded
  forceIncludeExpiresAt: string | null  // ISO date; computed from life-stage threshold when flag is set
}
```

### 14.4 New schemas

```typescript
interface Nudge {
  nudgeId: string
  class: 'per-animal' | 'coverage'
  priority: 'high' | 'medium' | 'low'
  type: string  // See nudge type list below
  label: string  // Human-readable short description
  description: string  // Longer explanation
  
  // For per-animal nudges
  animalId: string | null
  targetField: string | null  // Specific field to deep-link to
  targetMediaId: string | null  // For photo-related nudges
  
  // For coverage nudges
  coverageArea: 'gallery-wall' | 'canonical-views' | 'registration-batch' | 'seasonal-pool' | null
  deepLinkHint: string | null  // Pre-filled upload category, etc.
  
  createdAt: string
  persistUntil: string | null  // null for non-persistent; ISO date for scheduled reappearance
  isPersistent: boolean  // Cannot be permanently dismissed
}

interface WallSlot {
  slotId: string
  role: 'hero' | 'secondary' | 'supporting'
  preferredCategory: string | null
  preferredSeasonalAffinity: string | null
  rotationCadence: 'seasonal' | 'monthly'
  currentMediaId: string | null
  lastRotatedAt: string | null
  nextRotationAt: string | null
}
```

### 14.5 URL routing

- `/herd` — herd page, binder layout
- `/herd/[animalId]` — front of card (full-screen)
- `/herd/[animalId]/details` — back of card (full-screen)
- `/herd/tag/[tag]` — redirect: looks up animalId by current displayTag OR any entry in tagHistory, 301 to canonical URL
- `/gallery` — The Wall
- `/admin` — admin herd dashboard (auth required)
- `/admin/herd/[animalId]` — admin view of animal (front of card with admin chrome)
- `/admin/herd/[animalId]/details` — admin view of back of card (with edit affordances)
- `/admin/media` — media tab (Phase 2+)
- `/admin/calendar` — calendar tab (Phase 2+)
- `/privacy` — privacy policy page
- `/terms` — terms page

The herd detail page route from the original architecture (`/herd/[animalId]` rendering a separate long-form detail page) is eliminated. The back of the card replaces it entirely.

---

## 15. 🟦 Product: Reference animals and placeholders

Reference animals are outside genetics tracked for pedigree only — often a bull whose semen was purchased, or a dam whose offspring was acquired. They have no active herd presence and often no photos.

**Visual treatment:**
- Reference animals appear in the Reference section at the bottom of the herd page
- They have their own card with the same structure as active animals
- When no photo exists, the card displays a **stylized Hereford silhouette placeholder** — a custom SVG rendered in the site's palette
  - Not the ranch's brand (which represents this ranch's animals specifically)
  - Not a real-photo placeholder (which would imply they have a photo)
  - Clearly recognizable as "no photo, reference entry" without needing a caption
- The silhouette design is a future small deliverable; coding agent can use a temporary placeholder SVG in Phase 1

**Never for reference animals:**
- No staleness nudges (no expectation of refresh)
- Not included in the home page herd teaser (if one were to exist)
- Not counted in public herd counts for "active operation" signaling

---

## 16. 🟦 Product: Content that doesn't go public when stale

A design principle that governs multiple features: **stale content is worse than no content.**

Features that surface time-sensitive material must either auto-expire or be admin-nudged when stale. Examples:

- **Seasonal banners** on the home page or herd page (future calendar work) must not persist past their season
- **"Recent sales"** sections (future) must hide entries older than N months
- **Auction announcements** must disappear after the auction
- **For-sale animals** with photos older than 60 days trigger high-priority nudges
- **The Wall** rotation is automatic; nothing stale because the engine swaps before content ages

Where automation can't prevent staleness, **coverage nudges** (§7.2) fire predictively to prevent the problem from appearing publicly.

A 2-year-old "catch us at the fair" banner actively damages trust. Hiding it is better than showing it.

---

## 17. 🟨 Typography, palette, and visual system

### 17.1 Current provisional choices

The coding agent's initial build uses:
- **Cormorant Garamond** (serif) for display text and headings
- **Lato** (sans-serif) for body text
- Palette tokens as defined in the Phase 1 Implementation doc (earth, saddle, gold, rust, sage, stone, cream, linen, warm-white)

**These are provisional.** Matt has not committed to them; Marty and Roianne have never seen them. The spec designates a **pre-launch style review round** where 3-4 coherent typography + palette combinations will be presented to Marty and Roianne for selection.

### 17.2 Rationale for the current provisional choices

Research on peer Hereford seedstock sites shows the industry baseline is:
- All-caps sans-serif navigation
- Neutral sans-serif body copy
- Little elegant typography; most sites feel utilitarian

The Cormorant Garamond + Lato combination punches above this baseline without being alien. Cormorant is a modern Garamond cut with warm, readable feel — not austere like Didot, not decorative like Playfair. It reads as quality-minded without being pretentious. Lato pairs well with it as a humanist sans that handles UI text cleanly.

**The choice is defensible but not locked.** It puts the ranch a step above peer presentation without reading as a different category of business entirely.

### 17.3 Design tokens — structural requirement

All color, typography, spacing, and radius values **must live in a single tokens file** (`src/styles/tokens.css`). Swapping typography or palette should be a tokens-file edit, not a components rewrite.

This matters for the pre-launch style review round. Presenting alternative combinations to Marty and Roianne needs to be a matter of swapping token values, previewing the site, and discussing.

### 17.4 Overlay chrome visual language

All photo-layered UI chrome (pause indicator, photo date caption, registration number, position dots, Details chevron, tooltips) uses a unified treatment:
- Defined edge (thin border)
- Semi-transparent fill (readable against dark or light imagery underneath)
- Sufficient contrast to never read as a flat white box

Coding agent should establish a small set of reusable overlay primitives rather than styling each element independently.

### 17.5 No emoji in UI copy

Exceptions: the stylized Hereford silhouette placeholder (not an emoji, but a similar affordance) and nothing else. No birthday hat emoji (the banner replaces it). No decorative emoji in labels, headings, buttons, tooltips, or nudge copy. Icons used for UI affordances are SVG icons from a consistent set.

---

## 18. 🟦 Product: How to change things later (without being a web developer)

This section exists specifically for Matt. It's a plain-language map of where common things live in the codebase, so non-developers can make edits without reading source code.

### 18.1 Page copy

All user-facing text lives in a **content directory**, organized by page:
- Home page copy: `src/content/home.md` (or similar Markdown/YAML structure)
- About page copy: `src/content/about.md`
- Contact page copy: `src/content/contact.md`
- Footer copy: `src/content/footer.md`
- Tooltip copy (for admin fields): `src/content/tooltips/` directory, one file per tooltip

**To change page copy:** open the file, edit the text, save, commit. The change appears on the site.

Coding agent must maintain this structure strictly. User-facing text should never be hardcoded in component files. If Matt sees text on the site that isn't in `src/content/`, that's a bug.

### 18.2 Design tokens

All colors, fonts, and spacing values live in `src/styles/tokens.css`. Changing the primary color, swapping a font, or adjusting spacing scale is a single-file edit.

### 18.3 Cattle data

Cattle records are stored as structured data files in `data/animals.json` (managed by the admin panel in production). Matt can inspect or manually edit these files, though the admin panel is the intended interface.

### 18.4 Per-animal tooltips and field definitions

The admin panel shows tooltips on every field explaining what the field means. This tooltip content lives in `src/content/tooltips/` — each field's tooltip is a small file that Matt can edit without touching component code.

### 18.5 iOS Shortcut configuration

The iOS Shortcut Marty uses to upload photos (Phase 2) will have its endpoint URL and any configuration parameters documented in a dedicated setup document: `docs/ios-shortcut-setup.md`. When the Phase 2 pipeline is built, coding agent produces this documentation.

### 18.6 Nudge copy

The text of each nudge ("Animal #840 has no weaning weight," etc.) is templated. Templates live in `src/content/nudge-templates.json`. Matt can rewrite any template without changing code.

### 18.7 What Matt should NOT expect to edit without help

These are genuinely code territory:
- Component behavior (how the card flips, how swipes work, how sort algorithms run)
- Data schema definitions (`src/schemas/*.ts`)
- Build configuration
- Routing

For any of these, Matt works with a coding agent or developer.

---

## 19. 🟦 Review checkpoints for Matt

Coding agent will request Matt's review at specific checkpoints. This section defines what Matt should look at and what he should *not* need to look at.

### 19.1 Checkpoint 1: Foundation

**After:** Astro project scaffold, Zod schemas written, seed data loading, base layout, tokens file.

**Matt reviews:**
- Visit `localhost:4321` (the dev URL)
- Confirm the site loads and shows *something* (may be blank placeholder pages)
- No specific content to review yet

**Matt does NOT need to review:**
- Code organization
- Schema structure
- Build configuration
- Type checking

**Coding agent verifies on its own:**
- `npm run build` succeeds with zero TypeScript errors
- Zod validation passes for all seed data
- No console errors on page load

**Checkpoint acceptance:** Matt sees the site load. Done.

### 19.2 Checkpoint 2: Public static pages

**After:** Home, About, Contact, base Gallery placeholder pages complete with placeholder copy.

**Matt reviews:**
- Visit each page at `localhost:4321`
- Specifically look at:
  - Does the overall tone feel right (warm, restrained, not corporate)?
  - Does anything read as jarring or mismatched?
  - Is the navigation obvious?
- Matt should NOT expect to approve copy in detail — placeholder copy is fine at this checkpoint
- Matt should NOT critique typography or palette yet — those are for the pre-launch style round

**Coding agent verifies on its own:**
- All pages render
- Navigation works
- Responsive layout works on mobile
- No broken links

**Checkpoint acceptance:** Matt's gut says "the site has the right vibe." Doesn't need to be final; needs to be not-wrong.

### 19.3 Checkpoint 3: Herd page and card component

**After:** Herd page at `/herd` renders with sectional binder layout, card components with front + back, mode toggle, sorts, filters, flip interaction, responsive layout.

**Matt reviews:**
- Visit `/herd` on desktop and mobile (use responsive dev tools if no phone available)
- Specifically:
  - Does the sectional binder layout feel right? (Bulls → Cows → Heifers → Calves)
  - Does the card cycling work smoothly?
  - Does flipping a card feel tactile? (Try both tap and swipe on mobile)
  - Does the back of card scroll naturally with sticky section headers?
  - Do the ribbons (For Sale, birthday, distinction) look restrained rather than gimmicky?
  - Does the compact mode provide a clean alternate view?
- Seed data has 11 animals; Matt should be able to navigate through all of them

**Coding agent verifies on its own:**
- Flip animation performs at 60fps on a reference device
- Swipe gesture doesn't conflict with OS edge-back
- Pull-to-refresh is disabled
- Scroll snap works on mobile
- Tooltip tap-to-show, tap-again-to-navigate pattern works

**Checkpoint acceptance:** Matt can browse the herd and feels the card interaction is good. Specific UX issues become feedback for iteration.

### 19.4 Checkpoint 4: Back-of-card content and interactions

**After:** All eight back-of-card sections render, expandable, with proper section ordering. Sticky headers work. External link tooltips work. Inquire modal works for sale animals.

**Matt reviews:**
- Open multiple cards' backs
- Expand and collapse sections
- Tap registration number — does the tooltip appear? Does the second tap open hereford.org?
- Tap For Sale ribbon — does the inquiry modal open pre-filled?
- Submit an inquiry (to yourself as a test) — does the Formspree email arrive?

**Coding agent verifies on its own:**
- All section content renders correctly from seed data
- Sections hide cleanly when all fields are null
- Internal sire/dam links work
- One-level return memory works

**Checkpoint acceptance:** Matt can inspect an animal thoroughly and submit an inquiry.

### 19.5 Checkpoint 5: Home page hero, Gallery placeholder, final Phase 1 polish

**After:** Home page with hero composition, Gallery placeholder Wall with 9-13 photos arranged, responsive refinements, Lighthouse score achieved.

**Matt reviews:**
- Home page — does the quiet-welcome land?
- Gallery — is the placeholder Wall visually coherent?
- All pages on mobile — does anything feel cramped or awkward?

**Coding agent verifies on its own:**
- Lighthouse: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO
- All spec acceptance criteria met

**Checkpoint acceptance:** Matt approves Phase 1 as complete.

### 19.6 Between-checkpoint behavior

Between checkpoints, coding agent should commit frequently with clear PR-style summaries. Matt should NOT need to review intermediate commits unless coding agent explicitly requests.

If coding agent asks "does this look right?" without a specific checkpoint request, Matt should feel free to respond with "proceed, I'll look at the next checkpoint."

---

## 20. 🟦 Deferred for future specification

Explicitly not part of this spec. These features are acknowledged to exist in the future but are not being designed or built in Phase 1.

**Phase 2 (shortly after Phase 1 launch):**
- Admin panel for cattle management (add/edit/delete animals through UI)
- Media pipeline (Cloudflare Workers receiving iPhone Shortcut uploads)
- Cloudflare R2 integration for photo storage
- AI classification integration (shot type, quality, bounding box)
- Real data flows replacing seed data
- Nudge system full implementation with deep-linking
- Wall curation engine (automated rotation)

**Phase 2+ (not yet planned):**
- Admin UI for each additional feature (Calendar, Media tab with Prefer/Hide controls)
- AHA registration workflow integration (form pre-fill, PDF generation)
- Seasonal detection system (calving season auto-banner)
- "Recent Sales" or archive section with staleness guards
- Events/auction announcement system

**Much later, if at all:**
- Buyer accounts with login
- Shop (merchandise: hats, key chains, t-shirts) — explicitly separate from cattle purchasing
- Newsletter signup
- Blog (only if Marty or Matt would maintain it; "stale content is worse" applies hard)

**Open design questions deferred to future specs:**
- Seasonal detection model for small-herd operations (calving season especially — reactive vs. forecast vs. manual vs. hybrid)
- Pre-launch style variations presentation for Marty and Roianne
- Registration workflow UX (the "button on the card that launches AHA registration" idea)
- Public sold-animal archive (design when Marty has actual sold animals to archive)

---

## 21. 🟧 Coding agent kickoff instructions

### 21.1 Branch strategy

- Create a **fresh branch** off `main` for the rebuild: `v2-card-rebuild` (or similar clean name)
- Do NOT continue work on the existing `v2-rebuild` branch — it contains checkpoint 1-2 work built against the old spec that needs to be replaced

### 21.2 What to preserve from existing v2-rebuild work

The following survives the wipe and carries forward:
- Astro project scaffold and configuration
- TypeScript configuration (strict mode, path aliases)
- Package.json dependency set (Astro, Zod, @astrojs/check)
- Existing Zod schemas (will need updates per §14, but structure carries forward)
- Seed data in `data/seed/` (may need supplementation for new fields in §14)
- Design tokens file (`src/styles/tokens.css`)
- Base layout component (`src/layouts/BaseLayout.astro`) — may need minor updates
- Home page copy and About page copy (content, not code) — carry forward as placeholder, revisit during pre-launch
- Contact page Formspree form wiring
- Hamburger menu / footer if those exist

### 21.3 What to delete entirely

- All herd page code (`src/pages/herd/*`, `src/components/cattle/*`)
- All card components built against the old spec
- Any detail page scaffolding (`src/pages/herd/[animalId].astro` in its current form)
- Any card-cycling components that don't match the new spec's cycling behavior

### 21.4 CLAUDE.md at repo root

**Replace CLAUDE.md at the repo root** with a v2-focused version that:
- Describes the current architecture (Astro + TS + Zod, Cloudflare Pages target)
- Points at this spec (`Website_Review-and-Redesign/phase-1-kickoff/CARD-REDESIGN-SPEC.md`) as authoritative
- Describes the v2-card-rebuild branch as the active work
- Notes that main branch still serves the live prototype at mrsummersranch.com
- Removes the old brochure-site architecture description

### 21.5 Build order for Phase 1

Sequenced to allow Matt's review at each checkpoint:

1. **Foundation (Checkpoint 1):** Scaffold, updated schemas, seed data loading, design tokens, base layout
2. **Public static pages (Checkpoint 2):** Home, About, Contact, Gallery placeholder — all with placeholder copy
3. **Herd page and card component (Checkpoint 3):** Herd at `/herd` with binder layout, cards with front + back, flip interaction, sorts/filters, compact/cards modes
4. **Back-of-card content and interactions (Checkpoint 4):** All eight sections, sticky headers, external link tooltips, inquire modal
5. **Final polish (Checkpoint 5):** Home hero, gallery Wall placeholder, responsive refinements, Lighthouse

### 21.6 Things to ask Matt about before deciding

Don't silently extend or change architectural decisions. Ask Matt if:
- A case arises that this spec doesn't cover
- You need to add a dependency beyond Astro + Zod + Astro plugins
- You need to change design tokens beyond what the spec prescribes
- You want to defer any Phase 1 acceptance criterion to Phase 2
- Anything affects the iOS Shortcut workflow (Phase 2 concern but may come up)

You can decide without asking:
- Internal code organization within `src/components/`
- CSS strategy (scoped styles, utilities, Astro patterns)
- Internal naming conventions
- Placeholder image strategy for Phase 1
- Test framework choice (not required for Phase 1)
- Specific library choices for gesture handling (any reasonable choice: Hammer.js, custom, Astro-native)

### 21.7 Things Matt should NOT be asked to review

Matt is a physicist, not a web developer. Do not ask him to review:
- Code organization
- Component architecture
- Build configuration
- TypeScript errors (fix them; don't surface them)
- CSS structure
- Dependency choices

Matt reviews **product experience** — things he can see, tap, and feel. See §19 for specific checkpoint review prompts.

### 21.8 Definition of "Phase 1 complete"

All of the following must be true:
- [ ] v2-card-rebuild branch contains the full implementation
- [ ] `npm run build` succeeds with zero TypeScript errors and zero Zod validation errors
- [ ] All 11 seed animals render as cards on `/herd`
- [ ] Every card has a working front and back
- [ ] The flip interaction works on both desktop (click) and mobile (swipe or button)
- [ ] Sticky section headers behave correctly on long backs
- [ ] External link tooltips work per spec (tap-show, tap-link-to-navigate)
- [ ] Inquire modal works, Formspree receives test submissions
- [ ] Home, About, Contact, Gallery pages render with placeholder content
- [ ] Navigation works (hamburger, footer, internal links)
- [ ] Responsive across mobile / tablet / desktop
- [ ] Lighthouse: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO
- [ ] Cloudflare Pages preview URL is live
- [ ] Matt has signed off on all five checkpoints

When all boxes are checked, coding agent writes a short Phase 1 completion summary for Matt with:
- The preview URL
- A brief tour of what's built
- What Phase 2 covers
- Any known Phase 1 issues deferred to Phase 2

---

## 22. Appendix: cross-reference to earlier handoff documents

This spec supersedes:
- The herd catalog, card, and detail page sections of `RECOMMENDED-ARCHITECTURE.md`
- The matching sections of `BEHAVIOR-PRESERVATION-CHECKLIST.md`

This spec does NOT supersede:
- `PROJECT-SYNOPSIS-AND-HISTORY.md` (context remains accurate)
- The admin authentication, iOS Shortcut, and pipeline sections of earlier docs (still valid for Phase 2 reference)
- The Phase 1 Kickoff Brief — this spec is the next document after that kickoff

**In case of conflict between this spec and an earlier document, this spec is correct.** When in doubt, ask Matt before implementing an apparent contradiction.

---

*End of Card Redesign Specification.*
