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
import hashlib
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

# Cache of "photo-path -> view-type string" populated during process_inbox
# by Claude API classification (side-profile / headshot / rear / etc.).
# Used by update_cattle_data() to populate animal.photo_types in lockstep
# with animal.photos, and to pick the best primary_photo by priority.
# See docs/BEHAVIOR-DRIVEN-SPEC.md § 2.
PHOTO_TYPES = {}

# View-type priority table from the spec. Lower number = better primary
# photo candidate. Unknown types rank last.
VIEW_TYPE_PRIORITY = {
    "side-profile":  1,
    "headshot":      2,
    "rear":          3,
    "three-quarter": 4,
    "with-handler":  5,
    "in-pasture":    6,
    "group":         7,
    "other":         8,
}
VALID_VIEW_TYPES = set(VIEW_TYPE_PRIORITY.keys())

# Max width for processed photos
MAX_WIDTH = 1200
JPEG_QUALITY = 82

# Size threshold — skip files already under 300KB (likely already processed)
SIZE_THRESHOLD = 300_000


def file_hash(filepath):
    """Compute SHA-256 hash of a file's contents."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def build_existing_hashes():
    """Build a set of SHA-256 hashes of all existing photos in the repo."""
    hashes = set()
    for directory in [CATTLE_DIR, GALLERY_DIR, HUNTING_DIR, ABOUT_DIR, MASCOT_DIR, HERO_DIR]:
        if not directory.exists():
            continue
        for photo in directory.iterdir():
            if photo.suffix.lower() in (".jpg", ".jpeg", ".png") and photo.name != ".gitkeep":
                hashes.add(file_hash(photo))
    return hashes


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


def classify_cattle_view(filepath):
    """
    Ask Claude to classify a cattle photo's view type per the spec
    (docs/BEHAVIOR-DRIVEN-SPEC.md § 2). Returns one of the strings in
    VALID_VIEW_TYPES, or None if classification failed / no API key / the
    anthropic SDK is unavailable. The caller should tolerate None and leave
    the photo uncategorized rather than guessing.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
    except ImportError:
        print("  anthropic package not available, skipping view-type classification")
        return None
    except Exception as e:
        print(f"  Error initializing Anthropic client for view-type: {e}")
        return None

    try:
        with open(filepath, "rb") as f:
            image_data = base64.standard_b64encode(f.read()).decode("utf-8")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Classify this cattle photo. Respond with ONLY a JSON object, "
                            "no markdown, no backticks:\n\n"
                            '{"type": "one of: side-profile, headshot, rear, '
                            'three-quarter, with-handler, in-pasture, group, other"}\n\n'
                            "Definitions:\n"
                            "- side-profile: Full body visible from the side, showing the animal's build/conformation\n"
                            "- headshot: The animal's face or head is the main subject\n"
                            "- rear: Viewed from behind, showing width and muscling\n"
                            "- three-quarter: Angled between side and front, partial body visible\n"
                            "- with-handler: A person is actively handling, showing, or standing with the animal\n"
                            "- in-pasture: Casual shot of the animal grazing, walking, or standing in the field\n"
                            "- group: Multiple animals visible, no single subject\n"
                            "- other: None of the above"
                        ),
                    },
                ],
            }],
        )

        text = response.content[0].text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        result = json.loads(text)
        view_type = result.get("type", "").strip().lower()
        if view_type not in VALID_VIEW_TYPES:
            print(f"  Unknown view type from Claude: {view_type!r}")
            return None
        return view_type
    except Exception as e:
        print(f"  Claude view-type classification failed: {e}")
        return None


def pick_primary_photo(photos, photo_types, photo_dates):
    """
    Choose the best primary photo for an animal from the spec priority table:
    most-recent side-profile > most-recent headshot > rear > three-quarter >
    with-handler > in-pasture > group > other. Falls back to the first photo
    in the array when no types exist.

    Tie-breaking rules (in order):
      1. Lower priority value wins (side-profile beats headshot).
      2. Within same priority, newer ISO date wins.
      3. Within same priority + same (or missing) date, the earlier photo in
         the array wins — this matches the spec's "fall back to the first
         photo" rule when nothing discriminates.

    Returns the chosen photo path, or None if there are no photos.
    """
    if not photos:
        return None

    def priority_of(i):
        vt = photo_types[i] if i < len(photo_types) else ""
        return VIEW_TYPE_PRIORITY.get(vt, 99)

    def date_of(i):
        return photo_dates[i] if i < len(photo_dates) else ""

    best_i = 0
    for i in range(1, len(photos)):
        p_i, p_best = priority_of(i), priority_of(best_i)
        if p_i < p_best:
            best_i = i
        elif p_i == p_best:
            d_i, d_best = date_of(i), date_of(best_i)
            if d_i > d_best:
                best_i = i
            # Equal priority AND equal/missing dates: keep the earlier index
            # (the first-photo fallback). Do nothing.
    return photos[best_i]


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

    # Build hash index of all existing photos for duplicate detection
    print("Building duplicate detection index...")
    existing_hashes = build_existing_hashes()
    print(f"  {len(existing_hashes)} existing photos indexed.")

    has_api = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    if has_api:
        print("Claude API key found — will classify untagged photos.")
    else:
        print("No Claude API key — untagged photos will go to gallery.")

    for photo in photos:
        print(f"\nProcessing: {photo.name}")

        # Duplicate check — compare raw file hash against all existing photos
        incoming_hash = file_hash(photo)
        if incoming_hash in existing_hashes:
            print(f"  DUPLICATE — this photo already exists in the repo. Removing from inbox.")
            photo.unlink()
            continue

        original_size = photo.stat().st_size
        print(f"  Original size: {original_size / 1024:.0f} KB")

        # Capture the original photo date BEFORE we strip EXIF.
        # Priority: EXIF DateTimeOriginal (actual capture time) → filename timestamp
        captured_date = ""
        try:
            result = subprocess.run(
                ["exiftool", "-DateTimeOriginal", "-s3", str(photo)],
                capture_output=True, text=True, timeout=5
            )
            exif_date = result.stdout.strip()  # Format: "2026:04:13 20:35:18"
            if exif_date and len(exif_date) >= 10:
                captured_date = exif_date[:10].replace(":", "-")
                print(f"  EXIF capture date: {captured_date}")
        except Exception:
            pass
        if not captured_date:
            captured_date = extract_iso_date(photo.name)
            if captured_date:
                print(f"  Filename date: {captured_date}")

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

        # Add to duplicate index so same-batch dupes get caught too
        existing_hashes.add(incoming_hash)

        # Remember the date so update_cattle_data() can populate photo_dates
        # keyed to this photo in lockstep with animal.photos.
        if captured_date and category == "cattle":
            PHOTO_DATES[str(target)] = captured_date

        # Step 4 (cattle only): ask Claude for a view-type classification
        # so the lightbox's Featured Shots section has metadata to work with
        # and the primary photo can be auto-selected by quality.
        if category == "cattle":
            view_type = classify_cattle_view(target)
            if view_type:
                print(f"  View type: {view_type}")
                PHOTO_TYPES[str(target)] = view_type

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
                "breed": "",
                "breed_detail": "",
                "sex": "",
                "status": "",
                "source": "",
                "source_ranch": "",
                "breeding_stock": False,
                "birth_weight": None,
                "weaning_weight": None,
                "yearling_weight": None,
                "calves": 0,
                "calves_manual": False,
                "notes": "",
                "photos": [],
                "photo_dates": [],
                "photo_types": [],
                "primary_photo": ""
            })
            existing_tags.add(tag)
            changed = True

    # Update photo arrays for all animals. Keep photo_dates + photo_types
    # in lockstep with photos: look up this run's fresh dates/types from the
    # in-memory caches, and carry over anything already stored in the JSON
    # for photos we're not touching.
    for animal in animals:
        tag = animal["tag"]
        photos = tag_photos.get(tag, [])
        old_photos = animal.get("photos", [])
        old_dates  = animal.get("photo_dates", [])
        old_types  = animal.get("photo_types", [])
        date_lookup = {}
        type_lookup = {}
        for i, p in enumerate(old_photos):
            if i < len(old_dates):
                date_lookup[p] = old_dates[i]
            if i < len(old_types):
                type_lookup[p] = old_types[i]
        new_dates = []
        new_types = []
        for p in photos:
            if p in PHOTO_DATES:
                new_dates.append(PHOTO_DATES[p])
            elif p in date_lookup and date_lookup[p]:
                new_dates.append(date_lookup[p])
            else:
                new_dates.append("")
            if p in PHOTO_TYPES:
                new_types.append(PHOTO_TYPES[p])
            elif p in type_lookup and type_lookup[p]:
                new_types.append(type_lookup[p])
            else:
                new_types.append("")

        # Recompute primary_photo whenever photos or classifications move.
        new_primary = pick_primary_photo(photos, new_types, new_dates) or ""
        old_primary = animal.get("primary_photo", "")

        if (photos != old_photos
            or new_dates != old_dates
            or new_types != old_types
            or new_primary != old_primary):
            animal["photos"] = photos
            animal["photo_dates"] = new_dates
            animal["photo_types"] = new_types
            animal["primary_photo"] = new_primary
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
