#!/usr/bin/env python3
"""
Summers Ranch Photo Processing Pipeline

Processes raw photos uploaded to images/inbox/ by the iOS Shortcut.
The Shortcut names files with a prefix that tells us where they go:

  cattle-tag-189-20260413-143022.jpg  → images/cattle/tag-189-1.jpg (auto-numbered)
  hunting-20260413-143022.jpg         → images/hunting/hunt-20260413.jpg
  photo-20260413-143022.jpg           → classified by Claude API, or gallery

Processing steps:
1. Strip EXIF/GPS metadata, auto-orient
2. Resize to max 1200px wide
3. Compress to JPEG quality 82
4. Route by filename prefix (cattle, hunting) or classify with Claude API
5. Auto-number cattle photos sequentially (tag-189-1, tag-189-2, tag-189-3...)
6. Move to the appropriate folder
7. Also optimize any oversized photos already in images/cattle/
"""

import os
import sys
import json
import subprocess
import base64
import re
from pathlib import Path

INBOX = Path("images/inbox")
CATTLE_DIR = Path("images/cattle")
GALLERY_DIR = Path("images/gallery")
HUNTING_DIR = Path("images/hunting")
ABOUT_DIR = Path("images/about")
MASCOT_DIR = Path("images/mascot")
HERO_DIR = Path("images/hero")

# Cache of "photo-path -> ISO date (YYYY-MM-DD)" populated during process_inbox
# from the original inbox filename (the iOS Shortcut stamps filenames with a
# timestamp like 20260413-203518 before upload). Used by update_cattle_data
# to populate each animal's photo_dates array in lockstep with photos[].
PHOTO_DATES = {}

# Max width for processed photos
MAX_WIDTH = 1200
JPEG_QUALITY = 82

# Size threshold — skip files already under 300KB (likely already processed)
SIZE_THRESHOLD = 300_000


def strip_and_resize(filepath, max_width=MAX_WIDTH, quality=JPEG_QUALITY):
    """Strip EXIF, resize, and compress a photo using ImageMagick."""
    try:
        # Auto-orient (apply rotation from EXIF before stripping), resize, strip, compress
        subprocess.run([
            "convert", str(filepath),
            "-auto-orient",
            "-resize", f"{max_width}x{max_width}>",  # Only shrink, never enlarge
            "-strip",                                   # Remove all metadata
            "-quality", str(quality),
            "-interlace", "Plane",                      # Progressive JPEG
            str(filepath)
        ], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR processing {filepath}: {e.stderr.decode()[:200]}")
        return False


def classify_with_claude(filepath):
    """
    Send image to Claude API for classification.
    Returns (category, suggested_name) or (None, None) on failure.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None, None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
    except ImportError:
        print("  anthropic package not available, skipping classification")
        return None, None
    except Exception as e:
        print(f"  Error initializing Anthropic client: {e}")
        return None, None

    try:
        with open(filepath, "rb") as f:
            image_data = base64.standard_b64encode(f.read()).decode("utf-8")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": """Classify this photo for a cattle ranch website. Respond with ONLY a JSON object, no markdown, no backticks:

{"category": "one of: cattle, hunting, family, ranch, mascot", "filename": "short-descriptive-name.jpg", "caption": "Brief caption for the photo"}

Categories:
- cattle: Photos of cows, bulls, calves, herd animals
- hunting: Hunting trips, game animals, outdoor sporting
- family: Family gatherings, portraits, holidays, celebrations
- ranch: Landscapes, property, buildings, fences, equipment, ranch scenery
- mascot: Photos clearly featuring a toddler/baby as the main subject

Use lowercase, hyphens, no spaces in filename. Keep it short (2-4 words)."""
                    }
                ]
            }]
        )

        text = response.content[0].text.strip()
        # Clean up any markdown formatting
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        result = json.loads(text)

        category = result.get("category", "gallery")
        filename = result.get("filename", None)

        # Validate category
        valid = {"cattle", "hunting", "family", "ranch", "mascot"}
        if category not in valid:
            category = "gallery"

        # Map category to folder name for gallery-type items
        if category in ("family", "ranch"):
            category = "gallery"

        return category, filename

    except Exception as e:
        print(f"  Claude classification failed: {e}")
        return None, None


def get_target_dir(category):
    """Map category string to directory path."""
    mapping = {
        "cattle": CATTLE_DIR,
        "hunting": HUNTING_DIR,
        "gallery": GALLERY_DIR,
        "mascot": MASCOT_DIR,
        "hero": HERO_DIR,
        "about": ABOUT_DIR,
    }
    return mapping.get(category, GALLERY_DIR)


def unique_path(target_dir, filename):
    """Ensure filename is unique in the target directory."""
    path = target_dir / filename
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    counter = 1
    while path.exists():
        path = target_dir / f"{stem}-{counter}{suffix}"
        counter += 1
    return path


def next_cattle_number(tag_number):
    """Find the next sequential number for a cattle tag photo."""
    existing = list(CATTLE_DIR.glob(f"tag-{tag_number}-*.jpg"))
    if not existing:
        return 1
    # Extract numbers from existing files like tag-189-1.jpg, tag-189-2.jpg
    numbers = []
    for f in existing:
        match = re.search(rf'tag-{re.escape(tag_number)}-(\d+)\.jpg$', f.name)
        if match:
            numbers.append(int(match.group(1)))
    return max(numbers, default=0) + 1


def extract_iso_date(filename):
    """
    Pull an ISO date (YYYY-MM-DD) out of an iOS-Shortcut-style filename.

    The Shortcut stamps filenames with a YYYYMMDD-HHMMSS timestamp:
        cattle-tag-189-20260413-203518.jpg
        cattle-tag-[189]-[20260413-203518].jpg
        hunting-20260413-203518.jpg
    We extract the first YYYYMMDD run and format it as 2026-04-13.
    Returns "" if no date can be parsed.
    """
    match = re.search(r'(\d{4})(\d{2})(\d{2})', filename)
    if not match:
        return ""
    year, month, day = match.groups()
    # Loose sanity check: plausible year, month, day
    try:
        y, m, d = int(year), int(month), int(day)
        if 2000 <= y <= 2100 and 1 <= m <= 12 and 1 <= d <= 31:
            return f"{year}-{month}-{day}"
    except ValueError:
        pass
    return ""


def route_by_prefix(filename):
    """
    Determine category and target filename from the upload prefix.

    Naming convention from iOS Shortcut:
    - cattle-tag-189-20260413-143022.jpg  → cattle, auto-numbered
    - hunting-20260413-143022.jpg         → hunting, keep timestamp name
    - photo-20260413-143022.jpg           → needs classification or goes to gallery
    """
    name = filename.lower()

    # Cattle: extract tag number, auto-assign sequential number
    # Shortcut formats as: cattle-tag-[125]-[20260413-203518].jpg
    # or possibly:         cattle-tag-125-20260413-203518.jpg
    cattle_match = re.match(r'cattle-tag-\[?(\w+)\]?-', name)
    if cattle_match:
        tag_number = cattle_match.group(1)
        seq = next_cattle_number(tag_number)
        return "cattle", f"tag-{tag_number}-{seq}.jpg"

    # Hunting: move directly, keep a clean name
    # Shortcut formats as: hunting-[20260413-203518].jpg or hunting-20260413...
    if name.startswith("hunting"):
        date_match = re.search(r'(\d{8})', name)
        date_str = date_match.group(1) if date_match else "undated"
        return "hunting", f"hunt-{date_str}.jpg"

    # Everything else: needs classification or goes to gallery
    return None, None


def process_inbox():
    """Process all photos in the inbox."""
    if not INBOX.exists():
        print("No inbox directory found, nothing to process.")
        return

    photos = list(INBOX.glob("*.jpg")) + list(INBOX.glob("*.jpeg")) + list(INBOX.glob("*.png"))
    if not photos:
        print("No photos in inbox.")
        return

    print(f"Found {len(photos)} photo(s) in inbox.")

    has_api = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    if has_api:
        print("Claude API key found — will classify untagged photos.")
    else:
        print("No Claude API key — untagged photos will go to gallery.")

    for photo in photos:
        print(f"\nProcessing: {photo.name}")
        original_size = photo.stat().st_size
        print(f"  Original size: {original_size / 1024:.0f} KB")

        # Capture the original upload date BEFORE we strip EXIF — the Shortcut
        # already encoded it into the filename, so we just parse it out.
        captured_date = extract_iso_date(photo.name)
        if captured_date:
            print(f"  Capture date: {captured_date}")

        # Step 1: Resize and strip EXIF
        if not strip_and_resize(photo):
            print(f"  SKIPPED (processing error)")
            continue

        new_size = photo.stat().st_size
        print(f"  Processed size: {new_size / 1024:.0f} KB")

        # Step 2: Route by filename prefix
        category, target_name = route_by_prefix(photo.name)

        if category and target_name:
            # Prefix told us exactly where this goes
            target_dir = get_target_dir(category)
            target = unique_path(target_dir, target_name)
            print(f"  Routed by prefix: {category} -> {target.name}")
        else:
            # No prefix match — try Claude classification
            category, suggested_name = classify_with_claude(photo)

            if category and suggested_name:
                print(f"  Classified by Claude: {category} -> {suggested_name}")
                target_dir = get_target_dir(category)
                target = unique_path(target_dir, suggested_name)
            else:
                # No classification — keep original name, move to gallery
                target_dir = GALLERY_DIR
                target = unique_path(target_dir, photo.name)
                print(f"  No classification — moving to gallery as {target.name}")

        # Step 3: Move
        target_dir.mkdir(parents=True, exist_ok=True)
        photo.rename(target)
        print(f"  Moved to: {target}")

        # Remember the date so update_cattle_data() can populate photo_dates
        # keyed to this photo in lockstep with animal.photos.
        if captured_date and category == "cattle":
            PHOTO_DATES[str(target)] = captured_date

    print("\nInbox processing complete.")


def process_cattle():
    """Resize any oversized cattle photos (already in the right folder)."""
    if not CATTLE_DIR.exists():
        return

    photos = list(CATTLE_DIR.glob("*.jpg")) + list(CATTLE_DIR.glob("*.jpeg"))
    oversized = [p for p in photos if p.stat().st_size > SIZE_THRESHOLD]

    if not oversized:
        return

    print(f"\nFound {len(oversized)} oversized cattle photo(s) to optimize.")
    for photo in oversized:
        print(f"  Optimizing: {photo.name} ({photo.stat().st_size / 1024:.0f} KB)")
        strip_and_resize(photo, max_width=1200, quality=JPEG_QUALITY)
        print(f"    -> {photo.stat().st_size / 1024:.0f} KB")


def update_cattle_data():
    """
    Scan images/cattle/ for tagged photos and:
    1. Auto-add any new tag numbers to cattle-data.json
    2. Update photo arrays for each animal
    """
    data_file = Path("cattle-data.json")
    if not data_file.exists():
        print("No cattle-data.json found, skipping.")
        return

    with open(data_file, "r") as f:
        data = json.load(f)

    animals = data.get("animals", [])
    existing_tags = {a["tag"] for a in animals}

    # Find all tag photos
    tag_photos = {}
    for photo in sorted(CATTLE_DIR.glob("tag-*-*.jpg")):
        match = re.match(r'tag-(\w+)-(\d+)\.jpg', photo.name)
        if match:
            tag = match.group(1)
            if tag not in tag_photos:
                tag_photos[tag] = []
            tag_photos[tag].append(str(photo))

    changed = False

    # Auto-add new tag numbers
    for tag in sorted(tag_photos.keys()):
        if tag not in existing_tags:
            print(f"  New tag #{tag} — adding to cattle-data.json")
            animals.append({
                "tag": tag,
                "name": "",
                "born": "",
                "registration": "",
                "sire": "",
                "dam": "",
                "breed": "Hereford",
                "breed_detail": "",
                "sex": "",
                "status": "breeding",
                "source": "herd",
                "source_ranch": "",
                "breeding_stock": False,
                "birth_weight": None,
                "weaning_weight": None,
                "yearling_weight": None,
                "calves": 0,
                "calves_manual": False,
                "notes": "",
                "photos": [],
                "photo_dates": []
            })
            existing_tags.add(tag)
            changed = True

    # Update photo arrays for all animals. Keep photo_dates in lockstep with
    # photos: look up this run's fresh dates from PHOTO_DATES, and carry over
    # any existing dates stored in the JSON for photos we're not touching.
    for animal in animals:
        tag = animal["tag"]
        photos = tag_photos.get(tag, [])
        old_photos = animal.get("photos", [])
        old_dates  = animal.get("photo_dates", [])
        # Build a lookup from the old arrays so we can preserve dates that
        # were already recorded (e.g. from a previous run).
        old_lookup = {}
        for i, p in enumerate(old_photos):
            if i < len(old_dates):
                old_lookup[p] = old_dates[i]
        new_dates = []
        for p in photos:
            if p in PHOTO_DATES:
                new_dates.append(PHOTO_DATES[p])
            elif p in old_lookup and old_lookup[p]:
                new_dates.append(old_lookup[p])
            else:
                new_dates.append("")
        if photos != old_photos or new_dates != old_dates:
            animal["photos"] = photos
            animal["photo_dates"] = new_dates
            changed = True

    # Rebuild sires/dams from the breeding_stock flag + sex.
    # The admin panel is the source of truth for which animals are breeders;
    # this rebuild just makes sure the cached lists stay consistent with the
    # animals' flags after a photo upload (which can't change those flags).
    sires = sorted(set(
        a["tag"] for a in animals
        if a.get("breeding_stock") and a.get("sex") == "bull"
    ))
    dams = sorted(set(
        a["tag"] for a in animals
        if a.get("breeding_stock") and a.get("sex") in ("cow", "heifer")
    ))
    if data.get("sires") != sires or data.get("dams") != dams:
        data["sires"] = sires
        data["dams"] = dams
        changed = True

    if changed:
        from datetime import datetime
        data["meta"]["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        data["animals"] = animals
        with open(data_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  Updated cattle-data.json ({len(animals)} animals, {sum(len(tag_photos.get(a['tag'], [])) for a in animals)} photos)")
    else:
        print("  cattle-data.json already up to date.")


if __name__ == "__main__":
    process_inbox()
    process_cattle()
    update_cattle_data()
    print("\nDone.")
