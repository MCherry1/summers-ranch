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

{"type": "side-profile|headshot|rear|three-quarter|with-handler|in-pasture|group|other", "focus_x": 50, "focus_y": 50}

type: Classify the camera angle (see definitions below).
focus_x: Horizontal position of the main animal as a percentage (0 = left edge, 50 = center, 100 = right edge).
focus_y: Vertical position of the main animal as a percentage (0 = top, 50 = center, 100 = bottom).

Definitions:
- side-profile: Full body visible from the side, showing the animal's build/conformation
- headshot: The animal's face or head is the main subject
(... same definitions as current ...)
```

### Storage in cattle-data.json

Add a `photo_focus` array alongside `photos`, `photo_dates`, and `photo_types`:

```json
{
  "photos": ["images/cattle/tag-189-1.jpg", "images/cattle/tag-189-2.jpg"],
  "photo_dates": ["2024-03-15", "2025-01-22"],
  "photo_types": ["in-pasture", "side-profile"],
  "photo_focus": ["30,60", "50,45"]
}
```

Each entry is "X,Y" as percentages. Default "50,50" if classification fails.

### CSS Usage on the Cattle Page

When rendering a card image:
```javascript
var focus = animal.photo_focus && animal.photo_focus[photoIndex]
    ? animal.photo_focus[photoIndex]
    : "50,50";
var parts = focus.split(",");
img.style.objectPosition = parts[0] + "% " + parts[1] + "%";
```

This means:
- Cow in left third → `object-position: 30% 50%` → card crops around the cow
- Cow centered → `object-position: 50% 50%` → default behavior, no change
- Cow low in frame → `object-position: 50% 70%` → card shifts down

**No actual file cropping needed.** The full image is preserved (good for the lightbox expanded view). Only the card thumbnail smartly centers on the subject.

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

---

## Implementation Priority

1. **Smart focal point** — Biggest visual improvement, just add 2 fields to the API prompt
2. **Tag letters verification** — Probably already works, just needs testing
3. **Gallery captions** — Nice to have, creates gallery-data.json
4. **Quality assessment** — Low priority, enhances nudges
