# Photo Pipeline Enhancements — Spec

*For Claude Code implementation.*

---

## Current State (What the Pipeline Already Does)

### Gallery photos (`photo-` prefix from General shortcut)
1. Resize to 1200px max width
2. Strip EXIF/GPS metadata
3. Claude API classifies: category (cattle/hunting/family/ranch/mascot) + descriptive filename + caption
4. Move to the appropriate folder with the descriptive name

### Cattle photos (`cattle-tag-XXX-` prefix from Cattle shortcut)
1. Resize to 1200px max width
2. Strip EXIF/GPS metadata (but extract DateTimeOriginal first for photo_dates)
3. Route to `images/cattle/tag-XXX-N.jpg` with auto-numbering
4. Claude API classifies view type: side-profile, headshot, rear, three-quarter, with-handler, in-pasture, group, other
5. Store view type in `photo_types` array in `cattle-data.json`
6. Auto-select primary photo based on view type priority

### What it does NOT do
- No cropping of any kind
- No focal point detection
- Gallery captions are generated but not stored anywhere
- No support for tag numbers with letters (e.g., "A12", "R5")

---

## Enhancement 1: Smart Focal Point for Cattle Photos

### The Problem
Marty takes a quick photo in the field. The cow is in the left third of the frame. The website displays it in a 4:3 card with `object-fit: cover` centered on the middle of the image. The cow gets partially cropped out.

### The Solution
Don't actually crop the file. Instead, ask Claude to return the focal point (where the main animal is in the frame), store it in the JSON, and use CSS `object-position` to center on the animal.

### Updated Claude API prompt for cattle view classification

```
Classify this cattle photo. Respond with ONLY a JSON object, no markdown, no backticks:

{"type": "side-profile|headshot|rear|three-quarter|with-handler|in-pasture|group|other", "focus_x": 50, "focus_y": 50, "box": [15, 20, 85, 90]}

type: Classify the camera angle (see definitions below).
focus_x: Horizontal center of the main animal as a percentage (0=left, 100=right).
focus_y: Vertical center of the main animal as a percentage (0=top, 100=bottom).
box: Bounding box around the main animal as [left%, top%, right%, bottom%]. Include the whole animal with a small margin. For group shots, box the most prominent animal.

Definitions:
- side-profile: Full body visible from the side, showing the animal's build/conformation
- headshot: The animal's face or head is the main subject
(... same definitions as current ...)
```

### Two Files Per Cattle Photo

The pipeline saves two versions of each cattle photo:

- **`tag-189-3.jpg`** — Full image, resized to 1200px max width, EXIF stripped. Used in the lightbox expanded view and the growth timeline.
- **`tag-189-3-thumb.jpg`** — Auto-cropped around the animal with ~20% padding. Used on the card grid.

### Auto-Crop Logic (ImageMagick)

```python
def crop_to_subject(source_path, thumb_path, box, padding_pct=20):
    """
    Crop an image to the bounding box returned by Claude, with padding.
    box = [left%, top%, right%, bottom%]
    """
    from PIL import Image  # or use ImageMagick subprocess

    img = Image.open(source_path)
    w, h = img.size

    # Convert percentages to pixels
    left   = int(w * box[0] / 100)
    top    = int(h * box[1] / 100)
    right  = int(w * box[2] / 100)
    bottom = int(h * box[3] / 100)

    # Add padding
    pad_x = int((right - left) * padding_pct / 100)
    pad_y = int((bottom - top) * padding_pct / 100)
    left   = max(0, left - pad_x)
    top    = max(0, top - pad_y)
    right  = min(w, right + pad_x)
    bottom = min(h, bottom + pad_y)

    cropped = img.crop((left, top, right, bottom))
    cropped.save(thumb_path, "JPEG", quality=82)
```

### What This Solves

| Scenario | Without crop | With auto-crop |
|---|---|---|
| Close-up of a big bull filling 80% of frame | Card looks fine | Card looks the same (crop barely changes anything) |
| Shy calf at 20% of frame, lots of sky/grass | Tiny cow on the card, looks inconsistent | Card crops to the calf, looks similar size to the bull |
| Cow in left third, landscape orientation | CSS centers on middle, cow partially cut off | Thumbnail centers on the cow, full image in lightbox |

**On the card grid, every animal appears roughly the same size.** That's what professional breeder sites achieve with professional photography. We achieve it with a $0.02 API call and 5 lines of ImageMagick.

### Fallback

If Claude doesn't return a box (API failure, no key), skip the thumbnail. The card falls back to the full image with `object-fit: cover` and `object-position` from the focal point (or default center). Still works — just less consistent.

---

## Enhancement 2: Gallery Photo Captions

### The Problem
The pipeline already asks Claude for a caption when classifying gallery photos, but the caption is thrown away after the photo is moved. No gallery metadata is stored.

### The Solution
Create a `gallery-data.json` file (similar to `cattle-data.json`) that stores gallery photo metadata:

```json
{
  "photos": [
    {
      "file": "images/gallery/sunset-over-pasture.jpg",
      "caption": "Golden hour light across the west pasture",
      "category": "ranch",
      "date": "2026-04-13"
    },
    {
      "file": "images/gallery/family-gathering.jpg",
      "caption": "Four generations at Thanksgiving",
      "category": "family",
      "date": "2026-11-28"
    }
  ]
}
```

The gallery page can then render captions below photos. This makes the gallery feel curated rather than just a dump of images.

### Pipeline update
After classifying a gallery photo, append its metadata to `gallery-data.json` before committing.

---

## Enhancement 3: Tag Numbers with Letters

### The Problem
Some of Marty's ear tags include letters (e.g., "A12", "R5", "125B"). The current pipeline regex expects only digits in the tag number.

### Current regex (in route_by_prefix):
```python
cattle_match = re.match(r'cattle-tag-\[?(\w+)\]?-', name)
```

This actually already handles letters — `\w+` matches word characters (letters, digits, underscore). So `cattle-tag-A12-20260414-120000.jpg` would match with tag "A12".

### What to verify
1. The iOS Shortcut's tag number input should accept letters (it uses a text input, so this should already work)
2. The auto-numbering function should handle alphanumeric tags:
   ```python
   existing = list(CATTLE_DIR.glob(f"tag-{tag_number}-*.jpg"))
   ```
   This glob should work for "tag-A12-*.jpg" — verify with a test.
3. The admin panel's tag input should accept letters (it's a text field, should work)
4. The sort function in the admin panel should handle mixed alphanumeric tags gracefully

### Likely no code changes needed — just verify and test.

---

## Enhancement 4: Quality Assessment (Optional, Low Priority)

When classifying cattle photos, Claude could also assess basic photo quality:

```json
{
  "type": "side-profile",
  "focus_x": 50,
  "focus_y": 45,
  "quality": "good"
}
```

Quality values: "excellent" (sharp, well-lit, clean background), "good" (usable, decent light), "fair" (grainy, poor light, cluttered background), "poor" (blurry, very dark, animal barely visible).

The admin nudges system could then flag: "Tag #189 has 3 photos but they're all rated 'fair' — try to get a better shot in good light."

This adds almost no cost (Claude is already looking at the image) but gives the nudge system better data to work with.

### Quality-Aware Primary Photo Selection

The primary photo auto-selector should factor in quality, but with a strong recency bias:

- **"poor" rated photos are skipped** for primary selection — fall back to the next-best photo by type priority. A photo where the animal is barely visible shouldn't represent it.
- **"fair" rated photos are used anyway** — a slightly soft recent photo beats a sharp old one. The nudge system flags it for replacement.
- **"good" and "excellent" are treated the same** for selection purposes.

In short: recent wins unless the photo is genuinely unusable. The nudge handles the rest.

---

## Implementation Priority

1. ✅ **Smart focal point** — Biggest visual improvement, just add 2 fields to the API prompt
2. ✅ **Tag letters verification** — `\w+` regex already handles alphanumeric tags like `A12` / `R5`; the glob + sort work with no code change, but the cattle-photo glob now explicitly skips `-thumb.jpg` siblings.
3. ✅ **Gallery captions** — Creates `gallery-data.json` and upgrades the gallery page to render captions from it.
4. ✅ **Quality assessment** — Claude prompt now returns `quality` and `pick_primary_photo()` skips `poor`-rated photos.

---

## Implementation Notes

All four enhancements shipped in one pass. Code locations:

### `.github/scripts/process_photos.py`
- **`classify_cattle_view()`** — prompt now asks for
  `{type, focus_x, focus_y, box, quality}` in one call. Returns a dict
  (or `None` on failure) so the caller can take `type` for the
  existing behavior-driven features AND stash the focal point and
  quality for the new enhancements. Clamps percentages to 0–100 and
  validates the bounding box shape.
- **`crop_to_subject(source_path, thumb_path, box, padding_pct=20)`** —
  uses ImageMagick (`identify` + `convert -crop`) to auto-crop a
  cattle photo around the animal with 20% padding on each side. PIL
  isn't available in this environment and ImageMagick is already a
  pipeline dependency, so this is one subprocess instead of a new
  Python package.
- **`PHOTO_META`** module cache maps target path →
  `{focus_x, focus_y, box, quality}`. Populated in `process_inbox()`
  after a cattle photo is moved, right next to the existing
  `PHOTO_TYPES` cache.
- **`process_inbox()` cattle branch** — after the classification call,
  generates `tag-XXX-N-thumb.jpg` by calling `crop_to_subject()` with
  the Claude box. The thumb is a sibling of the full image, same stem.
- **`process_inbox()` gallery branch** — `classify_with_claude()` now
  also returns the caption. When a photo routes to the gallery folder
  (or hunting), the caption + category + date are stashed in
  `GALLERY_META` for the later `update_gallery_data()` step.
- **`update_cattle_data()`** — photos-array loop now rebuilds
  `photo_focus_x`, `photo_focus_y`, `photo_boxes`, and `photo_quality`
  in lockstep with `photos[]`, using the same "fresh from cache, fall
  back to previous JSON entry" pattern already used for dates and
  types. `primary_photo` is recomputed with quality awareness.
- **`update_gallery_data()`** — new step in the `__main__` chain that
  merges `GALLERY_META` into `gallery-data.json`, creating the file
  if it doesn't exist. Preserves existing entries and only touches
  photos that went through the classifier on this run.
- **Cattle-photo glob** — `CATTLE_DIR.glob("tag-*-*.jpg")` now skips
  files whose stem ends in `-thumb` so the pipeline doesn't treat
  auto-cropped thumbnails as separate animal photos. The regex still
  uses `\w+` so alphanumeric tags (`A12`, `R5`, `125B`) work.
- **`pick_primary_photo(photos, photo_types, photo_dates, photo_quality)`** —
  new optional `photo_quality` param. First pass filters out
  `quality == "poor"` candidates; falls back to all candidates if the
  entire set is rated poor so something still represents the animal.
  Existing type/date tie-break rules are preserved. Verified against
  8 unit cases including `skip-poor`, `all-poor`, `fair-ok`, and the
  original single-untyped / no-types / side-profile-wins cases.

### `cattle-data.json`
- Tag 215 placeholder now carries `photo_focus_x: [50]`,
  `photo_focus_y: [50]`, `photo_boxes: [null]`, `photo_quality: [""]`
  in lockstep with the existing `photos: [...]` array.
- Auto-inserted new animals in `update_cattle_data()` ship with the
  same empty-list defaults.

### `cattle.html`
- **`toThumbPath(src)`** helper turns `tag-189-1.jpg` into
  `tag-189-1-thumb.jpg`. `buildCard()` prefers the thumb for the
  grid image and falls back to the full image via `<img onerror>`
  when the pipeline hasn't generated a thumb yet (older photos).
- **`object-position: X% Y%`** is applied inline on the card `<img>`
  using `animal.photo_focus_x[primary_idx]` and `photo_focus_y[...]`.
  Defaults to `50% 50%` when the focal point data is missing.
- **`buildTimeline()`** now threads `focusX[]` / `focusY[]` alongside
  `photos[]` / `dates[]` / `types[]` so they stay in lockstep with
  the chronological sort.
- **Lightbox `lbState`** gains `focusX` / `focusY` arrays; `lbShow()`
  applies `lbPhoto.style.objectPosition` after each src swap so the
  animal stays roughly centered in the 60vh photo area.

### `gallery.html`
- Progressive enhancement script at the bottom fetches
  `gallery-data.json`, upgrades captions on existing `.gallery-item`
  tiles whose `data-full` matches, and appends new tiles for
  pipeline-uploaded photos. Safe no-op when the JSON doesn't exist
  yet (manually-placed gallery items still work).
