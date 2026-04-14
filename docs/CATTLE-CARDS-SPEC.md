# Cattle Card Interactions, Lineage, and Herd Management — Design Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## 1. Outside Sires and Non-Herd Lineage

### The Problem
Sometimes a calf's sire is not part of the Summers herd. A neighbor's bull gets in, or Marty uses outside genetics deliberately. The website needs to show lineage without pretending the sire is a ranch animal.

### Industry Convention
The cattle industry uses the term **"Reference Animal"** for sires or dams that are tracked for lineage purposes but are not part of the active herd. Software like Farmbrite, CattleMax, and Cattlytics all support this concept. A reference animal has a record (for pedigree tracking) but doesn't appear in active herd counts or on the main display.

### Implementation

Add a `source` field to each animal in `cattle-data.json`:

```json
{
  "tag": "189",
  "source": "herd",
  ...
}
```

Valid values for `source`:
- `"herd"` — Born or raised at Summers Ranch. Full card on the cattle page.
- `"reference"` — Outside animal tracked for lineage only. Does NOT get a card on the public cattle page. Shows only as a name/tag when listed as a sire or dam of a herd animal.
- `"purchased"` — Bought from another ranch. Full card, but could optionally show "Acquired from [Ranch Name]" on the card.

When a herd animal's sire or dam field points to a reference animal, display it as:
- **Sire: #427 (outside)** — or —
- **Sire: Red River Ranch** — if the source ranch name is known

On the admin panel, the sire/dam dropdowns should include both herd animals and reference animals, with reference animals in a separate group labeled "Outside / Reference."

Add a `source_ranch` field (optional) for reference animals:
```json
{
  "tag": "427",
  "source": "reference",
  "source_ranch": "Red River Ranch",
  "breed": "Angus",
  "sex": "bull",
  "notes": "Neighbor's bull, got in summer 2025"
}
```

Reference animals never appear as cards on the public cattle page. They exist only in the JSON for lineage tracking and dropdown population. They don't need photos.

---

## 2. Card Click/Tap Interaction — Expanded View

### Current Behavior
Cards auto-cycle photos every 5 seconds. Tap to advance manually.

### New Behavior: Stop Auto-Cycling, Add Expanded View

**On the grid (default state):** Cards show the primary photo (first in the `photos` array). NO auto-cycling on the grid. 40 cards all cycling at once would be chaotic and distracting. Static primary photos only.

**On hover (desktop):** Start a slow crossfade cycle, one photo every 4 seconds. Only the hovered card cycles. This is the "browsing" signal — the visitor is looking at this animal.

**On tap/click:** Open the expanded card view (see below).

### Expanded Card View (Lightbox-Style)

When a user taps/clicks an animal card, it opens into a full-screen overlay. NOT a new page. A modal/lightbox that floats over the current page with a dark backdrop.

**Layout (mobile-first):**
```
┌─────────────────────────────────┐
│  ✕ (close button, top-right)    │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    PHOTO (large, ~60vh)   │  │
│  │    auto-cycles with       │  │
│  │    soft crossfade         │  │
│  │    every 5 seconds        │  │
│  │                           │  │
│  │    ● ● ○ ● ● (dot nav)   │  │
│  └───────────────────────────┘  │
│                                 │
│  Tag #189 — "Bessie"           │
│  2 years old                    │
│                                 │
│  Born     March 2024            │
│  Sire     #12                   │
│  Dam      #45                   │
│  Breed    Hereford              │
│  Sex      Heifer                │
│  Calves   3                     │
│  Status   Breeding Stock        │
│                                 │
│  "Good milker, calm temperament"│
│  (notes field, if populated)    │
│                                 │
└─────────────────────────────────┘
```

**Photo behavior in expanded view:**
- Auto-cycles every 5 seconds with soft crossfade (opacity transition, 0.4s)
- Photos are in chronological order (oldest first, newest last) so you see the animal's growth over time
- Dot navigation below the photo shows position in the sequence — tap a dot to jump
- Swipe left/right to advance manually (mobile)
- Click left/right arrows to advance (desktop)

**Photo timestamps:**
- If the photo filename contains a date (from the shortcut's timestamp), extract it and display a small date below the photo: "Aug 2024" or "Mar 2025"
- Format: Month + Year only (not full date — that feels too clinical)
- The filename pattern `tag-189-1.jpg` doesn't inherently carry a date, BUT the pipeline could embed the original timestamp in the filename or in a separate metadata field in `cattle-data.json`
- **Recommended:** Add a `photo_dates` array alongside `photos` in the JSON:
  ```json
  "photos": ["images/cattle/tag-189-1.jpg", "images/cattle/tag-189-2.jpg"],
  "photo_dates": ["2024-03-15", "2025-01-22"]
  ```
- The pipeline should populate `photo_dates` from the original upload timestamp in the filename

**Close behavior:**
- Tap the ✕ button (top-right, large touch target — at least 44x44px)
- Tap anywhere outside the card
- Press Escape (desktop)
- Swipe down (mobile, optional stretch goal)

**Transition:** Card zooms/fades up into the expanded view. On close, it shrinks back to its grid position. Keep it simple — a CSS scale + opacity transition. Don't overcomplicate.

---

## 3. Photo Metadata Preservation

### The Problem
Photos taken in the field carry timestamps from the camera. The current pipeline strips ALL metadata (EXIF) for privacy (GPS removal). We need to preserve the date while removing the location.

### Solution
Update `.github/scripts/process_photos.py` to:

1. BEFORE stripping EXIF, extract the `DateTimeOriginal` tag using exiftool
2. Strip ALL EXIF (including GPS) as it does now
3. Encode the original date into the target filename OR store it in `cattle-data.json`

**Filename approach (simpler):**
Instead of `tag-189-3.jpg`, name it `tag-189-3-20250315.jpg` where the date suffix is the original photo date. The cattle page JavaScript can parse this for display.

**JSON approach (cleaner):**
Store dates in `photo_dates` array in `cattle-data.json` alongside the `photos` array. The pipeline already updates this JSON — adding dates is a small extension.

**Recommendation:** Use the JSON approach. Filenames stay clean, dates are structured data.

---

## 4. Herd Removal — Status Workflow

### Industry Terminology
In the cattle industry:
- **"Culled"** — The standard industry term for permanently removed from the breeding herd. This covers sold, slaughtered, died, or moved to a feedlot. It's not a euphemism — it's neutral ranch vocabulary.
- **"Sold"** — Sold to another ranch or at auction. Animal is alive somewhere else.
- **"Harvested"** / **"Processed"** — Industry terms for slaughtered for meat. "Harvested" is the more common public-facing term now.
- **"Deceased"** / **"Dead loss"** — Died of natural causes, illness, or accident.
- **"Retired"** — Not standard cattle terminology, but some small operations use it for old animals kept as pasture pets.

### Status Values for the Website

Update the `status` field in `cattle-data.json` to support these values:

| Status | Public Display | Card Behavior |
|--------|---------------|---------------|
| `breeding` | "Breeding Stock" | Normal card, green badge |
| `sale` | "For Sale" | Normal card, gold badge |
| `sold` | "Sold" | Red corner ribbon, pushed to bottom of grid |
| `culled` | "Culled" | Hidden from public page by default |
| `deceased` | "Deceased" | Hidden from public page by default |
| `retired` | "Retired" | Subtle gray badge, pushed to bottom |
| `reference` | (not shown) | Never shown on public page |

**For sold animals:** Show a red diagonal corner ribbon (same visual language as the pink/blue newborn bands) that says "SOLD" in white text. Card stays visible so buyers can see the ranch's track record. Card is pushed to the bottom of the grid (after all active animals). Card is NOT grayed out — photos and details remain full-color and accessible.

**For culled/deceased:** Hidden from the public cattle page entirely. Still in the JSON for recordkeeping. Admin panel shows them in a separate "Removed from Herd" section.

**For retired:** Gray badge, pushed to bottom. Some ranchers keep old favorites around.

### Admin Panel — Remove from Herd Workflow

When the admin selects `sold`, `culled`, `deceased`, or `retired` from the status dropdown:

1. A **"Remove from Herd"** button appears next to the dropdown (red outline, not filled — doesn't look dangerous until you click it)
2. Clicking "Remove from Herd" triggers a **confirmation dialog:**
   - "This will remove Tag #189 from the active herd. The animal's records and photos will be kept but it will no longer appear on the public cattle page. Are you sure?"
   - Two buttons: **"Yes, Remove"** (red) and **"Cancel"** (neutral)
3. On confirm: Status is saved, card behavior changes per the table above
4. The animal can always be restored by changing the status back to `breeding` or `sale`

**Important:** This is a SOFT delete. Nothing is actually deleted from the repo. The animal stays in `cattle-data.json` with the new status. Photos stay in `images/cattle/`. The public page just filters them out.

---

## 5. Offspring Count — "Calves" Field

### Industry Convention
Yes, breeders absolutely track this. It's called **"number of progeny"** or simply **"calves"** in beef cattle. Software like Farmbrite tracks "total number of offspring birthed" per dam, along with average calving ease and offspring survival rates. For sires, they track "number of calves sired." It's a key metric for evaluating breeding stock.

The standard terms:
- For a dam (female): **"Calves"** or **"Progeny"** — "She's had 6 calves"
- For a sire (male): **"Calves sired"** — "He's sired 12 calves this season"

### Implementation on the Public Card

Add a `calves` field to each animal in `cattle-data.json`:

```json
{
  "tag": "45",
  "sex": "cow",
  "calves": 6,
  ...
}
```

On the animal card (and expanded view), display:
- For females: **Calves: 6**
- For males: **Calves Sired: 12**
- If 0 or empty: don't show the field at all

### Auto-Increment Logic

When a new animal is added to the herd via the admin panel and a dam/sire is selected:
1. Look up the dam's record in the JSON
2. Increment the dam's `calves` count by 1
3. If a sire is specified, increment the sire's `calves` count by 1
4. Save both updates

This happens automatically when adding a new animal. The admin panel shows the current count but it's not directly editable by default.

### Manual Override on Admin Panel

The calves count field in the admin panel should work exactly as described:

```
┌─────────────────────────────────────────────────────┐
│  Calves: [ ◄ ]  [ 6 ]  [ ► ]    ☐ Edit manually    │
└─────────────────────────────────────────────────────┘
```

- **Default state:** Number is visible but the ◄ ► arrows are grayed out/disabled. The number updates automatically when new animals are added with this one as dam/sire.
- **"Edit manually" checkbox:** When checked, the ◄ ► arrows become active and the number can be adjusted up or down.
- **Touch targets:** The ◄, number, and ► are each separate boxes, side by side, large enough for Marty's fingers on mobile (minimum 44x44px each).
- **Unchecking "Edit manually":** Locks the number again. The manually set value persists — it doesn't revert.
- **Why manual override exists:** Marty might have calves from before the website existed, or a calf might not be tracked in the system. He needs to be able to set the correct number even if the auto-increment hasn't caught all historical births.

---

## 6. Updated cattle-data.json Schema

Here's the complete schema with all new fields:

```json
{
  "animals": [
    {
      "tag": "189",
      "name": "Bessie",
      "born": "2024-03-15",
      "sire": "12",
      "dam": "45",
      "breed": "Hereford",
      "sex": "cow",
      "status": "breeding",
      "source": "herd",
      "source_ranch": "",
      "calves": 3,
      "calves_manual": false,
      "notes": "Good milker, calm temperament",
      "photos": ["images/cattle/tag-189-1.jpg", "images/cattle/tag-189-2.jpg"],
      "photo_dates": ["2024-03-15", "2025-01-22"]
    },
    {
      "tag": "427",
      "name": "",
      "born": "",
      "sire": "",
      "dam": "",
      "breed": "Angus",
      "sex": "bull",
      "status": "reference",
      "source": "reference",
      "source_ranch": "Red River Ranch",
      "calves": 0,
      "calves_manual": false,
      "notes": "Neighbor's bull, got in summer 2025",
      "photos": [],
      "photo_dates": []
    }
  ]
}
```

### New Fields Summary

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | `"herd"`, `"reference"`, or `"purchased"` |
| `source_ranch` | string | Name of origin ranch (for reference/purchased animals) |
| `calves` | number | Total offspring count |
| `calves_manual` | boolean | If true, auto-increment is bypassed for this animal |
| `photo_dates` | array | ISO dates corresponding to each photo, for timeline display |
| `notes` | string | Free-text notes shown on expanded card view |

---

## Priority Order for Implementation

1. **Expanded card view** — Biggest UX improvement, needed before adding more detail fields
2. **Stop auto-cycling on grid** — Quick fix, improves page performance
3. **Status workflow and sold ribbon** — Needed before handing off to Marty
4. **Calves count + auto-increment** — Wire up with admin panel
5. **Reference animals and outside sires** — Can wait until lineage data is entered
6. **Photo date extraction in pipeline** — Enhancement, not blocking
7. **Manual calves override UI** — Admin panel refinement
