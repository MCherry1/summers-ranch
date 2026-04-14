# Behavior-Driven Content, Photo AI, and Admin Nudges — Design Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## 1. Behavior-Driven Calving Season (Replaces Hardcoded Dates)

### The Problem
Calving season dates are currently hardcoded (Feb 15 – Apr 30). But calving doesn't follow a calendar — it follows the cows. Some years it starts early, some late, some is spread out. Hardcoded dates might show "Calving season is underway" when nothing's happening, or miss early calves.

### The Solution
Detect calving season from Marty's actual behavior. When he starts adding calves through the admin panel, the site reacts automatically.

**Trigger:** A new animal is added to `cattle-data.json` with:
- `born` date within the last 14 days, AND
- `sex` is one of: `calf`, `heifer`, `bull calf`, or `born` date makes the animal less than 60 days old

**Banner text:** "Calving season is underway — [N] calves in the last [X] days!"
Where:
- [N] = count of animals born within the sliding window
- [X] = days since the first calf in the current window, rounded to nearest 15 (so "15 days", "30 days", "45 days", etc.)

**The calving window — sliding with a cap:**
- **Opens** when the first qualifying calf is added (a calf with `born` within last 14 days)
- **Stays open** as long as new calves keep coming (any calf `born` within the last 30 days)
- **Closes** 30 days after the most recent calf's `born` date — banner disappears, New Arrivals section hides
- **Sliding window for the count:** The [N] count only includes calves born within the last [CAP] days from today, NOT from the start of calving season. This prevents "75 calves in the last 7,000 days" if calving never fully stops.
- **Window cap:** 90 days. This is the outer edge of a typical beef cattle calving season. Even if Marty is getting calves year-round (it happens with open breeding), the counter resets to a 90-day lookback. So it would show "12 calves in the last 90 days" at maximum.

**Rounding the day count:**
- Round to nearest 15: 1–7 days → "this week", 8–22 → "15 days", 23–37 → "30 days", 38–52 → "45 days", 53–67 → "60 days", 68–82 → "75 days", 83–90 → "90 days"

**Active flag logic (pseudocode):**
```
today = current date
calves = all animals where born >= (today - 90 days) AND age-appropriate sex
most_recent_calf = max(born) among calves

if calves is empty:
    calving_active = false
elif (today - most_recent_calf) > 30 days:
    calving_active = false  // 30 days since last calf, season over
else:
    calving_active = true
    first_calf = min(born) among calves
    window_days = min(today - first_calf, 90)  // cap at 90
    count = len(calves where born >= (today - window_days))
    rounded_days = round_to_15(window_days)
    banner = "Calving season is underway — {count} calves in the last {rounded_days}!"
```

**Priority:** This behavior-driven banner has priority 2 (same as seasons). Birthdays (priority 10) and specific events (priority 3) still override it.

**Implementation notes:**
- This runs client-side in `js/ranch-calendar.js` alongside the existing season logic
- The hardcoded calving season in `ranch-calendar.json` can remain as a FALLBACK — if no calves have been added but we're in the Feb-Apr window, still show the generic seasonal status text
- When behavior-detected calving is active, it overrides the generic season with the specific count

### Example Timeline
```
March 2: Marty adds Tag #250, born March 1, sex: bull calf
  → Banner: "Calving season is underway — 1 calf this week!"
  → New Arrivals section appears on cattle page

March 8: Marty adds Tag #251 and #252
  → Banner: "Calving season is underway — 3 calves in the last 15 days!"

March 28: Adds Tag #253
  → Banner: "Calving season is underway — 4 calves in the last 30 days!"

April 15: No new calves since March 28 (18 days ago, still within 30-day window)
  → Banner still showing: "Calving season is underway — 4 calves in the last 45 days!"

April 28: 30 days since last calf (March 28)
  → Banner disappears. Calving season over.

May 1: Site is back to normal, no calving content.

--- Edge case: long calving season ---

If calving stretches from Feb 1 to June 15 with calves trickling in:
  → Window caps at 90 days. Banner shows: "Calving season is underway — 18 calves in the last 90 days!"
  → Calves born more than 90 days ago drop out of the count but are still in the herd
  → 30 days after the final calf, banner disappears
```

---

## 2. Claude API Photo Classification

### What It Does
When a cattle photo comes through the pipeline, Claude API analyzes it and classifies the view type. This metadata is stored in `cattle-data.json` and used for:
1. Auto-selecting the best primary photo for the card
2. Populating the "Featured Shots" section in the expanded card view
3. Identifying gaps (e.g., "no side profile exists for this animal")

### View Type Classifications

Ask Claude to classify each cattle photo into one of:

| Type | Description | Priority for Primary |
|------|-------------|---------------------|
| `side-profile` | Full body from the side, showing conformation | 1 (highest) |
| `headshot` | Face/head prominent | 2 |
| `rear` | View from behind, showing width/muscle | 3 |
| `three-quarter` | Angled view, between side and front | 4 |
| `with-handler` | Animal being shown or handled by a person | 5 |
| `in-pasture` | Casual shot in the field, grazing, etc. | 6 |
| `group` | Multiple animals in frame | 7 |
| `other` | Doesn't fit above categories | 8 |

### Primary Photo Auto-Selection

The primary photo (shown on the grid card) should be the **most recent `side-profile`**. If none exists, fall back through the priority list: most recent headshot → three-quarter → with-handler → in-pasture → first photo in the array.

This means as Marty uploads better photos over time, the primary automatically improves. A casual pasture shot from day one gets replaced by a proper side profile when one arrives.

### Updated Pipeline Integration

In `.github/scripts/process_photos.py`, after a cattle photo is processed and moved to its final location:

1. If `ANTHROPIC_API_KEY` is set, send the photo to Claude API
2. Ask Claude to classify the view type (use the table above)
3. Store the classification in `cattle-data.json` in a new `photo_types` array alongside `photos` and `photo_dates`:

```json
{
  "photos": ["images/cattle/tag-189-1.jpg", "images/cattle/tag-189-2.jpg"],
  "photo_dates": ["2024-03-15", "2025-01-22"],
  "photo_types": ["in-pasture", "side-profile"],
  "primary_photo": "images/cattle/tag-189-2.jpg"
}
```

4. Recompute `primary_photo` based on the priority table above (most recent highest-priority type)

### Claude API Prompt for Classification

```
Classify this cattle photo. Respond with ONLY a JSON object:
{"type": "one of: side-profile, headshot, rear, three-quarter, with-handler, in-pasture, group, other"}

Definitions:
- side-profile: Full body visible from the side, showing the animal's build/conformation
- headshot: The animal's face or head is the main subject
- rear: Viewed from behind, showing width and muscling
- three-quarter: Angled between side and front, partial body visible
- with-handler: A person is actively handling, showing, or standing with the animal
- in-pasture: Casual shot of the animal grazing, walking, or standing in the field
- group: Multiple animals visible, no single subject
- other: None of the above
```

---

## 3. Expanded Card — Dual Section Layout

### Updated Layout

When a card is tapped/clicked, the expanded view now has two photo sections:

```
┌─────────────────────────────────────┐
│  ✕ (close)                          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   FEATURED SHOTS            │    │
│  │   3 most recent classified  │    │
│  │   photos (side, head, rear) │    │
│  │                             │    │
│  │   [side]  [head]  [rear]    │    │
│  │   Mar 25  Jan 12  Nov 3     │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tag #189 — "Bessie"               │
│  2 years old · Reg #AHA-43567890   │
│  (all detail fields here)           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  GROWTH TIMELINE            │    │
│  │  ● ● ● ● ● ● ● ○ ● ●     │    │
│  │  [    auto-cycling photo   ]│    │
│  │  [    chronological order  ]│    │
│  │  Mar 2024                   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Featured Shots Section

- Shows up to 3 photos: the most recent `side-profile`, `headshot`, and one other (prefer `rear` or `three-quarter`)
- Displayed as thumbnails in a row, each with its date below (e.g., "Mar 2025")
- Tapping a featured photo does NOT auto-cycle — it stays on that photo. The image enlarges to fill the photo area and remains static until the user taps elsewhere
- After 30 seconds of no interaction, returns to the growth timeline auto-cycle
- If photo classification data doesn't exist (no API key), this section doesn't render — fall back to the single-photo timeline layout from the base spec

### Growth Timeline Section

- All photos in chronological order (oldest first)
- Auto-cycles every 5 seconds with soft crossfade
- Date displayed below each photo as "Month Year"
- Dot navigation showing position in sequence
- Tapping a dot or swiping jumps to that photo — pauses auto-cycle for 10 seconds, then resumes
- Tapping any photo in the timeline pauses on it for 10 seconds before resuming

### When Featured Shots Data Doesn't Exist

If `photo_types` is empty or not present (pipeline hasn't classified photos yet), the expanded card uses the simpler single-section layout from `CATTLE-CARDS-SPEC.md`. The Featured Shots section is a progressive enhancement — it appears when AI classification data exists, and is absent when it doesn't. Everything still works without it.

---

## 4. Admin Panel — Nudges & Gentle Reminders

### Overview

A "Needs Attention" section at the top of the admin panel (below the header, above the sort/add controls). Shows only when there are items to address. Completely absent when everything is up to date.

### Nudge Types

| Nudge | Trigger | Message | Icon |
|-------|---------|---------|------|
| Stale photos | Animal has no photo less than 6 months old | "Tag #189 hasn't been photographed in 7 months" | 📷 |
| Sale without recent photo | Status is `sale` and newest photo is >60 days old | "Tag #125 is for sale but photos are 3 months old — buyers want current shots" | 🏷️ |
| Missing key fields | Animal lacks `born`, `sex`, or `breed` | "Tag #250 is missing birth date and sex" | ⚠️ |
| No side profile | Animal has photos but no `side-profile` type (requires AI classification) | "Tag #189 has no side profile — this is the #1 photo buyers want" | 📐 |
| Empty herd | Zero animals in the JSON | "Your herd is empty — add your first animal!" | 🐄 |

### Design

```
┌──────────────────────────────────────────────┐
│  ⚡ Needs Attention (3)                       │
│                                              │
│  📷 Tag #189 hasn't been photographed        │
│     in 7 months                     [View]   │
│                                              │
│  🏷️ Tag #125 is for sale but photos are      │
│     3 months old                    [View]   │
│                                              │
│  ⚠️ Tag #250 is missing birth date  [View]   │
│                                              │
│  ────── Dismiss all ──────                   │
└──────────────────────────────────────────────┘
```

- Gold/amber background (not red — these are gentle nudges, not errors)
- Each nudge has a [View] button that scrolls to that animal's card in the list
- "Dismiss all" clears the nudges for this session (they reappear next visit if still relevant)
- Nudges are computed client-side from `cattle-data.json` — no additional data storage needed
- Maximum 5 nudges shown at once. If more exist, show "and 3 more..." with an expand option

### What This Solves

Marty opens the admin page to add a new calf. At the top he sees "Tag #125 is for sale but photos are 3 months old." He thinks "oh yeah, I should snap a new photo of her this week." Natural, gentle, effective. No nagging, no emails, no notifications. Just there when he's already in the admin page doing ranch work.

---

## Implementation Priority

1. ✅ **Behavior-driven calving season** — Modify `js/ranch-calendar.js` to scan cattle-data.json. Biggest impact for least code.
2. ✅ **Admin nudges** — Add the needs-attention section to admin.html. Pure client-side logic.
3. ✅ **Claude API photo classification** — Extend the pipeline script. Requires API key.
4. ✅ **Primary photo auto-selection** — Depends on #3. Small addition to the cattle page JS.
5. ✅ **Featured Shots section in expanded card** — Depends on #3 and #4. Most complex UI piece.

---

## Implementation Notes

All four sections shipped together. Code locations:

### § 1 — Behavior-driven calving season
- **`js/ranch-calendar.js`** — `computeCalvingState()` scans `cattle-data.json`
  for calves (animal age < 60 days OR sex in `{calf, bull calf, heifer,
  heifer calf}`) born within the last 90 days, filters out
  culled/deceased/reference, applies the spec's rules:
  - inactive when the list is empty
  - inactive when most-recent calf is > 30 days old (season over)
  - active otherwise, with `windowDays = min(today - first_calf, 90)`
  - count is the number of calves born within `windowDays`
- **`roundDaysPhrase()`** implements the spec's bucket rounding:
  1–7 → "this week", 8–22 → "15 days", 23–37 → "30 days", 38–52 → "45 days",
  53–67 → "60 days", 68–82 → "75 days", 83–90 → "90 days".
- When active, a synthetic `activeSeason` object is built so the existing
  banner/status/New Arrivals machinery sees it as a normal calving season
  (priority 2, same as the hardcoded fallback). The hardcoded Feb–Apr
  entry in `ranch-calendar.json` still takes over when no calves are in
  the system yet.
- **`cattle.html`** — no changes needed. The existing New Arrivals section
  at `cattle.html:652` already keys off `state.activeSeason.name` matching
  "calving", and the synthetic object satisfies that check.

### § 2 — Claude API photo classification
- **`.github/scripts/process_photos.py`** — new `classify_cattle_view()`
  function sends each cattle photo to Claude with the prompt specified in
  the spec and returns one of the eight view types.
- New `PHOTO_TYPES` module cache keyed by target path, populated after a
  cattle photo is moved in `process_inbox`.
- New `pick_primary_photo(photos, photo_types, photo_dates)` helper
  implements the priority table (side-profile → headshot → rear →
  three-quarter → with-handler → in-pasture → group → other). Ties break
  by newest ISO date, then by array order (first photo wins — matches the
  "fall back to first" rule when nothing discriminates).
- `update_cattle_data()` now writes `photo_types[]` in lockstep with
  `photos[]` and `photo_dates[]`, and recomputes `primary_photo` on every
  run. New auto-inserted animals ship with the full expanded schema.

### § 3 — Expanded card dual-section layout
- **`cattle.html`** — new `.lb-featured` row above `.lb-photo-wrap` in the
  lightbox markup. `.lb-timeline-label` badge anchors the Growth Timeline
  section when the featured row is visible.
- `buildTimeline()` sorts photos chronologically (oldest first) from
  `photo_dates`, falling back to original order for undated photos.
  `pickFeatured()` selects up to three thumbnails: most-recent
  side-profile, most-recent headshot, then rear → three-quarter → any
  classified.
- Featured thumbnails jump to the corresponding photo and pause the
  auto-cycle for **30 seconds** via the new `pauseUntil` field on
  `lbState`. Dot-nav, arrow, swipe, and photo-tap nav pause for
  **10 seconds** per spec.
- Progressive enhancement: when no photos carry a classification, both
  `.lb-featured` and `.lb-timeline-label` stay hidden and the lightbox
  behaves exactly like the single-section layout from `CATTLE-CARDS-SPEC.md`.

### § 4 — Admin "Needs Attention" nudges
- **`admin.html`** — new `<section class="nudges">` between the panel
  header and panel actions, styled with the spec's gold/amber background.
- `computeNudges()` scans `data.animals` and emits entries for:
  - **Empty herd** (🐄) when there are zero animals
  - **Missing fields** (⚠️) when `born`, `sex`, or `breed` are blank
  - **Stale photos** (📷) when the newest photo is more than 6 months old
  - **Sale with stale photos** (🏷️) when status is `sale` and photos > 60d
  - **No side profile** (📐) when `photo_types` contains classified photos
    but no `side-profile` entry (progressive — only fires once the
    pipeline has written types)
- Maximum 5 nudges shown at once; an "and N more…" toggle expands the
  full list. "Dismiss all" stores dismissed IDs in `sessionStorage` so
  they stay gone for the tab session and reappear next visit if still
  relevant.
- Each nudge row has a `[View]` button that scrolls the matching animal
  card into view, auto-opens the edit form, and flashes a gold glow via
  the new `.highlight-flash` keyframe animation.

### Schema additions
- **`cattle-data.json`** — tag 215 now carries `photo_types: [""]` and
  `primary_photo: ""` alongside the previous fields so the schema stays
  concrete for all consumers.
