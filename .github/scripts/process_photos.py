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

# Cache of "photo-path -> {focus_x, focus_y, box, quality}" populated during
# process_inbox from Claude's focal-point + bounding-box + quality response
# per docs/PHOTO-PIPELINE-SPEC.md § 1 and § 4. Used to generate -thumb.jpg
# crops, to drive CSS object-position on the public card, and to skip
# "poor"-quality photos in primary selection.
PHOTO_META = {}

# Cache of "photo-path -> {caption, category, date}" populated during
# process_inbox from Claude's classification response for gallery photos.
# Used to build/update gallery-data.json so gallery.html can render real
# captions instead of the current hardcoded placeholders.
# See docs/PHOTO-PIPELINE-SPEC.md § 2.
GALLERY_META = {}

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

# Max width for processed photos. 2400px is the HiDPI sweet spot:
# - A full 4032x3024 iPhone shot becomes ~2400x1800 at JPEG q82 (~400-600KB)
# - Looks crisp on 2K/4K monitors and retina phones
# - Small enough to be bandwidth-friendly for mobile users
# - Responsive images (srcset) can still serve smaller variants to low-DPI screens
MAX_WIDTH = 2400
JPEG_QUALITY = 82

# Size threshold — skip files already under 500KB (likely already processed).
# Was 300KB when MAX_WIDTH was 1200; bumped proportionally for 2400.
SIZE_THRESHOLD = 500_000


def file_hash(filepath):
    """Compute SHA-256 hash of a file's contents."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ----- Metadata fingerprint dedup (docs/CLEANUP-SPEC.md § 1) -----
#
# SHA-256 file hashing catches byte-identical duplicates but breaks as soon
# as iOS re-encodes a photo on export. EXIF fields like DateTimeOriginal +
# SubSecTimeOriginal + the original ImageWidth/ImageHeight survive re-encoding,
# so we fingerprint on those instead. photo-fingerprints.json is a lookup
# table with separate "cattle" and "gallery" namespaces — cross-pipeline
# dupes are intentional (a great cow photo can also go in the gallery), so
# we only block same-namespace matches.

FINGERPRINT_FILE = Path("photo-fingerprints.json")


def photo_fingerprint(filepath):
    """
    Generate a fingerprint from EXIF metadata that survives re-encoding.
    Returns a 16-char md5 digest string, or None if no usable EXIF.
    """
    try:
        result = subprocess.run(
            ["exiftool",
             "-DateTimeOriginal", "-SubSecTimeOriginal",
             "-ImageUniqueID", "-ImageWidth", "-ImageHeight",
             "-s3", "-sep", "|", str(filepath)],
            capture_output=True, text=True, timeout=5,
        )
        raw = (result.stdout or "").strip()
        # Require at least one meaningful field (DateTimeOriginal is ~10 chars).
        if not raw or len(raw) < 10:
            return None
        return hashlib.md5(raw.encode()).hexdigest()[:16]
    except Exception:
        return None


def load_fingerprints():
    """Load photo-fingerprints.json, returning the schema default if missing."""
    if not FINGERPRINT_FILE.exists():
        return {"cattle": {}, "gallery": {}}
    try:
        with open(FINGERPRINT_FILE, "r") as f:
            data = json.load(f)
    except Exception:
        return {"cattle": {}, "gallery": {}}
    if not isinstance(data, dict):
        data = {}
    if not isinstance(data.get("cattle"), dict):
        data["cattle"] = {}
    if not isinstance(data.get("gallery"), dict):
        data["gallery"] = {}
    return data


def save_fingerprints(data):
    """Persist photo-fingerprints.json (pretty-printed, trailing newline)."""
    with open(FINGERPRINT_FILE, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")


def fingerprint_namespace_for(category, photo_name):
    """
    Decide which fingerprint namespace a photo belongs to. Cattle photos
    (cattle-tag-* prefix) use the "cattle" namespace; everything else
    (photo-*, hunting-*, unclassified) uses the "gallery" namespace.
    """
    if category == "cattle":
        return "cattle"
    # Prefix-based guess for before-classification check, since category
    # may not be known yet
    name = (photo_name or "").lower()
    if name.startswith("cattle-tag-"):
        return "cattle"
    return "gallery"


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


def is_heic_file(filepath):
    """
    Detect HEIC by file content, not extension. iOS shares HEIC images with
    .jpg extensions when sent through the Shortcut / share-sheet pipeline
    without an explicit "Convert Image" step, so extension alone is unreliable.

    Returns True if the file is HEIC/HEIF, False otherwise.
    """
    try:
        result = subprocess.run(
            ["file", "--brief", str(filepath)],
            capture_output=True, text=True, timeout=5,
        )
        output = (result.stdout or "").lower()
        # `file` reports HEIC as "ISO Media, HEIF Image ..." or similar
        return "heif" in output or "heic" in output
    except Exception:
        return False


def convert_heic_to_jpeg(filepath):
    """
    Convert a HEIC file in-place to a JPEG. Uses heif-convert (from
    libheif-examples, installed in the workflow). Preserves the original
    filename — only the content changes.

    Returns True on success, False on failure.
    """
    try:
        # heif-convert writes to a separate file; we then replace the original.
        # -q 95 keeps near-lossless quality for the intermediate step;
        # strip_and_resize() will re-encode at JPEG_QUALITY for the final file.
        tmp_jpeg = filepath.with_suffix(".converted.jpg")
        subprocess.run(
            ["heif-convert", "-q", "95", str(filepath), str(tmp_jpeg)],
            check=True, capture_output=True, timeout=60,
        )
        # Replace the original HEIC bytes with the JPEG bytes, keeping
        # the same filename/path so downstream logic doesn't need to care.
        tmp_jpeg.rename(filepath)
        return True
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode()[:300] if e.stderr else str(e)
        print(f"  ERROR converting HEIC {filepath}: {stderr}")
        return False
    except Exception as e:
        print(f"  ERROR converting HEIC {filepath}: {e}")
        return False


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
    Returns (category, suggested_name, caption) or (None, None, None) on
    failure. caption is the short descriptive text Claude wrote for the
    photo — used to populate gallery-data.json per
    docs/PHOTO-PIPELINE-SPEC.md § 2.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None, None, None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
    except ImportError:
        print("  anthropic package not available, skipping classification")
        return None, None, None
    except Exception as e:
        print(f"  Error initializing Anthropic client: {e}")
        return None, None, None

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

Use lowercase, hyphens, no spaces in filename. Keep it short (2-4 words).
Keep the caption to one short sentence — it shows below the photo on the gallery page."""
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
        caption  = (result.get("caption") or "").strip()

        # Validate category
        valid = {"cattle", "hunting", "family", "ranch", "mascot"}
        if category not in valid:
            category = "gallery"

        # Map category to folder name for gallery-type items
        if category in ("family", "ranch"):
            category = "gallery"

        return category, filename, caption

    except Exception as e:
        print(f"  Claude classification failed: {e}")
        return None, None, None


VALID_QUALITIES = {"excellent", "good", "fair", "poor"}


def classify_cattle_view(filepath):
    """
    Ask Claude to classify a cattle photo's view type, focal point, bounding
    box, and quality. Returns a dict with keys:
        type       : one of VALID_VIEW_TYPES, or None
        focus_x    : int 0-100 (% of frame width), or 50 fallback
        focus_y    : int 0-100 (% of frame height), or 50 fallback
        box        : [left, top, right, bottom] as ints 0-100, or None
        quality    : one of VALID_QUALITIES, or None

    Returns None on API failure / missing key / SDK unavailable. Any valid
    response is returned even if only some fields are present — the caller
    handles missing fields gracefully (center fallback, no thumb, etc.).

    Spec references: BEHAVIOR-DRIVEN-SPEC § 2 (view type),
    PHOTO-PIPELINE-SPEC § 1 (focal point + box) and § 4 (quality).
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
            max_tokens=200,
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
                            '{"type": "side-profile|headshot|rear|three-quarter|'
                            'with-handler|in-pasture|group|other",'
                            ' "focus_x": 50, "focus_y": 50,'
                            ' "box": [15, 20, 85, 90],'
                            ' "quality": "excellent|good|fair|poor"}\n\n'
                            "Field definitions:\n"
                            "- type: Classify the camera angle (see below).\n"
                            "- focus_x: Horizontal center of the main animal as a percentage (0=left, 100=right).\n"
                            "- focus_y: Vertical center of the main animal as a percentage (0=top, 100=bottom).\n"
                            "- box: Bounding box around the main animal as [left%, top%, right%, bottom%]. Include the whole animal with a small margin. For group shots, box the most prominent animal.\n"
                            "- quality: excellent (sharp, well-lit, clean background), good (usable, decent light), fair (grainy, poor light, cluttered background), poor (blurry, very dark, animal barely visible).\n\n"
                            "View type definitions:\n"
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

        view_type = str(result.get("type", "")).strip().lower()
        if view_type not in VALID_VIEW_TYPES:
            print(f"  Unknown view type from Claude: {view_type!r}")
            view_type = None

        def clamp_pct(v, default):
            try:
                iv = int(round(float(v)))
                return max(0, min(100, iv))
            except (TypeError, ValueError):
                return default

        focus_x = clamp_pct(result.get("focus_x"), 50)
        focus_y = clamp_pct(result.get("focus_y"), 50)

        raw_box = result.get("box")
        box = None
        if isinstance(raw_box, list) and len(raw_box) == 4:
            try:
                l, t, r, b = [clamp_pct(v, None) for v in raw_box]
                if None not in (l, t, r, b) and r > l and b > t:
                    box = [l, t, r, b]
            except Exception:
                box = None

        quality = str(result.get("quality", "")).strip().lower()
        if quality not in VALID_QUALITIES:
            quality = None

        return {
            "type":    view_type,
            "focus_x": focus_x,
            "focus_y": focus_y,
            "box":     box,
            "quality": quality,
        }
    except Exception as e:
        print(f"  Claude view-type classification failed: {e}")
        return None


def crop_to_subject(source_path, thumb_path, box, padding_pct=20):
    """
    Auto-crop a cattle photo to the bounding box returned by Claude with ~20%
    padding on each side. Writes the result to thumb_path. Uses ImageMagick
    (already a pipeline dependency) so no new Python package is needed.

    box is [left%, top%, right%, bottom%] where each value is an int 0-100.
    Returns True on success, False on failure (e.g. bad box, ImageMagick
    error, source file missing).
    """
    if not box or len(box) != 4:
        return False
    try:
        # Query the image dimensions so we can turn percentages into pixels
        # and apply padding before the crop.
        ident = subprocess.run(
            ["identify", "-format", "%w %h", str(source_path)],
            check=True, capture_output=True
        )
        w_str, h_str = ident.stdout.decode().strip().split()
        w, h = int(w_str), int(h_str)
        if w <= 0 or h <= 0:
            return False

        left   = int(w * box[0] / 100)
        top    = int(h * box[1] / 100)
        right  = int(w * box[2] / 100)
        bottom = int(h * box[3] / 100)

        # Pad around the subject — 20% of the box size on each axis gives
        # the animal some breathing room inside the card
        bw = max(1, right - left)
        bh = max(1, bottom - top)
        pad_x = int(bw * padding_pct / 100)
        pad_y = int(bh * padding_pct / 100)
        left   = max(0, left - pad_x)
        top    = max(0, top - pad_y)
        right  = min(w, right + pad_x)
        bottom = min(h, bottom + pad_y)

        crop_w = max(1, right - left)
        crop_h = max(1, bottom - top)
        geometry = f"{crop_w}x{crop_h}+{left}+{top}"

        subprocess.run(
            [
                "convert", str(source_path),
                "-crop", geometry,
                "+repage",
                "-quality", str(JPEG_QUALITY),
                "-interlace", "Plane",
                str(thumb_path),
            ],
            check=True, capture_output=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR cropping {source_path}: {e.stderr.decode()[:200] if e.stderr else e}")
        return False
    except Exception as e:
        print(f"  ERROR cropping {source_path}: {e}")
        return False


def pick_primary_photo(photos, photo_types, photo_dates, photo_quality=None):
    """
    Choose the best primary photo for an animal from the spec priority table:
    most-recent side-profile > most-recent headshot > rear > three-quarter >
    with-handler > in-pasture > group > other. Falls back to the first photo
    in the array when no types exist.

    Quality-aware (docs/PHOTO-PIPELINE-SPEC.md § 4): photos rated "poor" are
    skipped during selection. If every photo is rated "poor", we fall back to
    the normal selection across them all (something has to represent the
    animal). "fair"/"good"/"excellent" are treated equally — recency beats
    quality in that range.

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

    photo_quality = photo_quality or []

    def priority_of(i):
        vt = photo_types[i] if i < len(photo_types) else ""
        return VIEW_TYPE_PRIORITY.get(vt, 99)

    def date_of(i):
        return photo_dates[i] if i < len(photo_dates) else ""

    def is_poor(i):
        q = photo_quality[i] if i < len(photo_quality) else ""
        return q == "poor"

    # First pass: candidates with quality != "poor"
    candidates = [i for i in range(len(photos)) if not is_poor(i)]
    # Fall back to all photos if everything is rated poor — we still need
    # to show something.
    if not candidates:
        candidates = list(range(len(photos)))

    best_i = candidates[0]
    for i in candidates[1:]:
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
    # or with letters:     cattle-tag-Ty124-20260413-171440.jpg
    cattle_match = re.match(r'cattle-tag-\[?(\w+)\]?-', name)
    if cattle_match:
        tag_number = cattle_match.group(1).upper()  # Industry standard: uppercase
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

    photos = list(INBOX.glob("*.jpg")) + list(INBOX.glob("*.jpeg")) + list(INBOX.glob("*.png")) + list(INBOX.glob("*.heic")) + list(INBOX.glob("*.HEIC"))
    # Also catch files with no extension (broken uploads)
    for f in INBOX.iterdir():
        if f.name == '.gitkeep' or f in photos:
            continue
        if f.is_file() and f.suffix == '':
            photos.append(f)
    if not photos:
        print("No photos in inbox.")
        return

    print(f"Found {len(photos)} photo(s) in inbox.")

    # Build hash index of all existing photos for duplicate detection
    print("Building duplicate detection index...")
    existing_hashes = build_existing_hashes()
    print(f"  {len(existing_hashes)} existing photos indexed.")

    # Load metadata-fingerprint lookup table. This is the smart dedup path
    # (CLEANUP-SPEC § 1) — survives iOS re-encoding. The SHA check above is
    # kept as a belt-and-suspenders fallback for photos with no usable EXIF.
    fingerprints = load_fingerprints()
    fingerprints_changed = False
    print(f"  Fingerprints loaded: {len(fingerprints.get('cattle', {}))} cattle, "
          f"{len(fingerprints.get('gallery', {}))} gallery")

    has_api = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    if has_api:
        print("Claude API key found — will classify untagged photos.")
    else:
        print("No Claude API key — untagged photos will go to gallery.")

    for photo in photos:
        # Sanitize filename: replace spaces with hyphens, strip special chars.
        # Spaces break GitHub API uploads (filename truncates at the space).
        # This catches files that somehow made it through with bad names.
        clean_name = re.sub(r'\s+', '-', photo.name)           # spaces → hyphens
        clean_name = re.sub(r'[^\w.\-]', '', clean_name)       # strip anything weird
        if clean_name != photo.name:
            clean_path = photo.parent / clean_name
            # Add .jpg if no extension survived
            if not any(clean_name.lower().endswith(ext) for ext in ('.jpg', '.jpeg', '.png')):
                clean_path = photo.parent / (clean_name + '.jpg')
            photo.rename(clean_path)
            photo = clean_path
            print(f"  Sanitized filename: {photo.name}")

        print(f"\nProcessing: {photo.name}")

        # ----- Metadata fingerprint dedup (CLEANUP-SPEC § 1) -----
        # Extract BEFORE stripping EXIF. If the fingerprint is already in
        # the appropriate namespace, this is a true duplicate (even if the
        # bytes differ from an earlier re-encode).
        incoming_fp = photo_fingerprint(photo)
        fp_namespace = fingerprint_namespace_for(None, photo.name)
        if incoming_fp:
            ns_table = fingerprints.get(fp_namespace, {})
            if incoming_fp in ns_table:
                existing_path = ns_table[incoming_fp]
                print(f"  DUPLICATE (metadata fingerprint) — already exists as "
                      f"{existing_path}. Removing from inbox.")
                photo.unlink()
                continue

        # Fallback duplicate check — byte-identical file hash. Catches
        # photos that have no usable EXIF, or edge cases where the
        # fingerprint table is stale.
        incoming_hash = file_hash(photo)
        if incoming_hash in existing_hashes:
            print(f"  DUPLICATE (file hash) — this photo already exists in the repo. Removing from inbox.")
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

        # Step 0: HEIC preconversion. iOS Shortcuts often upload HEIC with a
        # .jpg extension (or an actual .heic extension). Detect by content
        # and convert to JPEG before the main resize step, since ImageMagick
        # on stock Ubuntu may not have libheif delegate support built in.
        if is_heic_file(photo):
            print(f"  HEIC detected — converting to JPEG before resize")
            if not convert_heic_to_jpeg(photo):
                print(f"  SKIPPED (HEIC conversion failed)")
                continue

        # Step 1: Resize and strip EXIF
        if not strip_and_resize(photo):
            print(f"  SKIPPED (processing error)")
            continue

        new_size = photo.stat().st_size
        print(f"  Processed size: {new_size / 1024:.0f} KB")

        # Step 2: Route by filename prefix
        category, target_name = route_by_prefix(photo.name)
        gallery_caption = None  # set when we fall through to Claude below

        if category and target_name:
            # Prefix told us exactly where this goes
            target_dir = get_target_dir(category)
            target = unique_path(target_dir, target_name)
            print(f"  Routed by prefix: {category} -> {target.name}")
        else:
            # No prefix match — try Claude classification
            category, suggested_name, gallery_caption = classify_with_claude(photo)

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

        # Record the metadata fingerprint under the right namespace. Use the
        # now-known category (from prefix or Claude) rather than the pre-move
        # guess, so a photo classified as cattle lands in the cattle table
        # even if it came in through the generic photo-* prefix.
        if incoming_fp:
            final_namespace = "cattle" if category == "cattle" else "gallery"
            fingerprints.setdefault(final_namespace, {})[incoming_fp] = str(target)
            fingerprints_changed = True

        # Remember the date so update_cattle_data() can populate photo_dates
        # keyed to this photo in lockstep with animal.photos.
        if captured_date and category == "cattle":
            PHOTO_DATES[str(target)] = captured_date

        # Stash gallery caption + category + date for update_gallery_data()
        # (PHOTO-PIPELINE-SPEC § 2). We store for anything that landed in
        # the gallery folder or any folder the caption applies to.
        if gallery_caption and category in ("gallery", "hunting"):
            GALLERY_META[str(target)] = {
                "caption":  gallery_caption,
                "category": category,
                "date":     captured_date or "",
            }

        # Step 4 (cattle only): ask Claude for view type + focal point +
        # box + quality. Then use the box to auto-generate a -thumb.jpg
        # variant that crops tightly around the animal. The full image
        # stays in the lightbox / growth timeline, the thumb shows on the
        # card grid so every animal appears roughly the same size.
        if category == "cattle":
            meta = classify_cattle_view(target)
            if meta:
                if meta.get("type"):
                    print(f"  View type: {meta['type']}")
                    PHOTO_TYPES[str(target)] = meta["type"]
                PHOTO_META[str(target)] = {
                    "focus_x": meta.get("focus_x", 50),
                    "focus_y": meta.get("focus_y", 50),
                    "box":     meta.get("box"),
                    "quality": meta.get("quality"),
                }
                if meta.get("quality"):
                    print(f"  Quality: {meta['quality']}")
                # Generate a -thumb.jpg auto-cropped around the animal
                if meta.get("box"):
                    thumb_path = target.with_name(target.stem + "-thumb" + target.suffix)
                    if crop_to_subject(target, thumb_path, meta["box"]):
                        print(f"  Cropped thumb: {thumb_path.name}")

    # Persist the updated fingerprint lookup table if anything moved.
    if fingerprints_changed:
        save_fingerprints(fingerprints)
        print(f"  Wrote {FINGERPRINT_FILE} ({len(fingerprints['cattle'])} cattle, "
              f"{len(fingerprints['gallery'])} gallery)")

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

    # Find all tag photos (full images only — exclude `-thumb.jpg` siblings).
    # The regex uses \w+ for the tag so alphanumeric tags like "A12", "R5",
    # or "125B" glob and parse correctly per PHOTO-PIPELINE-SPEC § 3.
    tag_photos = {}
    for photo in sorted(CATTLE_DIR.glob("tag-*-*.jpg")):
        # Skip the auto-generated thumbnails — they're siblings of the real
        # files and shouldn't enter the photos[] array.
        if photo.stem.endswith("-thumb"):
            continue
        match = re.match(r'tag-(\w+)-(\d+)\.jpg$', photo.name)
        if match:
            tag = match.group(1).upper()  # Normalize to uppercase
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
                "date_entered": "",
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
                "calving_ease": None,
                "disposition": "",
                "pregnancy_status": "",
                "expected_calving": "",
                "calves": 0,
                "calves_manual": False,
                "notes": "",
                "photos": [],
                "photo_dates": [],
                "photo_types": [],
                "photo_focus_x": [],
                "photo_focus_y": [],
                "photo_boxes": [],
                "photo_quality": [],
                "primary_photo": ""
            })
            existing_tags.add(tag)
            changed = True

    # Update photo arrays for all animals. Keep photo_dates / photo_types /
    # photo_focus_x / photo_focus_y / photo_boxes / photo_quality in lockstep
    # with photos: prefer this run's fresh data from the in-memory caches,
    # fall back to anything the JSON already had for photos we're not touching.
    for animal in animals:
        tag = animal["tag"]
        photos = tag_photos.get(tag, [])
        old_photos = animal.get("photos", [])
        old_dates  = animal.get("photo_dates", [])
        old_types  = animal.get("photo_types", [])
        old_focus_x = animal.get("photo_focus_x", [])
        old_focus_y = animal.get("photo_focus_y", [])
        old_boxes   = animal.get("photo_boxes", [])
        old_quality = animal.get("photo_quality", [])

        def _old_at(i, arr):
            return arr[i] if i < len(arr) else None

        date_lookup = {p: _old_at(i, old_dates) for i, p in enumerate(old_photos)}
        type_lookup = {p: _old_at(i, old_types) for i, p in enumerate(old_photos)}
        fx_lookup   = {p: _old_at(i, old_focus_x) for i, p in enumerate(old_photos)}
        fy_lookup   = {p: _old_at(i, old_focus_y) for i, p in enumerate(old_photos)}
        box_lookup  = {p: _old_at(i, old_boxes) for i, p in enumerate(old_photos)}
        qual_lookup = {p: _old_at(i, old_quality) for i, p in enumerate(old_photos)}

        new_dates, new_types = [], []
        new_fx, new_fy, new_boxes, new_quality = [], [], [], []
        for p in photos:
            # photo_dates
            if p in PHOTO_DATES:
                new_dates.append(PHOTO_DATES[p])
            elif date_lookup.get(p):
                new_dates.append(date_lookup[p])
            else:
                new_dates.append("")
            # photo_types
            if p in PHOTO_TYPES:
                new_types.append(PHOTO_TYPES[p])
            elif type_lookup.get(p):
                new_types.append(type_lookup[p])
            else:
                new_types.append("")
            # photo_focus_x / y / box / quality
            meta = PHOTO_META.get(p)
            if meta:
                new_fx.append(meta.get("focus_x", 50))
                new_fy.append(meta.get("focus_y", 50))
                new_boxes.append(meta.get("box"))
                new_quality.append(meta.get("quality") or "")
            else:
                new_fx.append(fx_lookup.get(p) if fx_lookup.get(p) is not None else 50)
                new_fy.append(fy_lookup.get(p) if fy_lookup.get(p) is not None else 50)
                new_boxes.append(box_lookup.get(p))
                new_quality.append(qual_lookup.get(p) or "")

        # Recompute primary_photo whenever photos or classifications move.
        # Quality-aware selection skips "poor" photos per PHOTO-PIPELINE-SPEC § 4.
        new_primary = pick_primary_photo(photos, new_types, new_dates, new_quality) or ""
        old_primary = animal.get("primary_photo", "")

        if (photos != old_photos
            or new_dates != old_dates
            or new_types != old_types
            or new_fx != old_focus_x
            or new_fy != old_focus_y
            or new_boxes != old_boxes
            or new_quality != old_quality
            or new_primary != old_primary):
            animal["photos"] = photos
            animal["photo_dates"] = new_dates
            animal["photo_types"] = new_types
            animal["photo_focus_x"] = new_fx
            animal["photo_focus_y"] = new_fy
            animal["photo_boxes"] = new_boxes
            animal["photo_quality"] = new_quality
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


def update_gallery_data():
    """
    Append newly-classified gallery photos to gallery-data.json, preserving
    existing entries. See docs/PHOTO-PIPELINE-SPEC.md § 2.

    This function only adds entries for photos that went through
    classify_with_claude during this run (stored in GALLERY_META). Manually-
    placed photos in images/gallery/ don't get captions — the spec says the
    caption comes from the classification pass. Existing entries in
    gallery-data.json are left alone unless their file path is in GALLERY_META
    (in which case we refresh the caption/category/date).
    """
    if not GALLERY_META:
        return  # nothing new to record

    data_file = Path("gallery-data.json")
    if data_file.exists():
        try:
            with open(data_file, "r") as f:
                data = json.load(f)
        except Exception:
            data = {"photos": []}
    else:
        data = {"photos": []}

    if not isinstance(data, dict):
        data = {"photos": []}
    if "photos" not in data or not isinstance(data["photos"], list):
        data["photos"] = []

    existing_by_file = {p.get("file"): p for p in data["photos"] if isinstance(p, dict)}
    changed = False
    for path, meta in GALLERY_META.items():
        entry = {
            "file":     path,
            "caption":  meta.get("caption", ""),
            "category": meta.get("category", "gallery"),
            "date":     meta.get("date", ""),
        }
        if path in existing_by_file:
            if existing_by_file[path] != entry:
                existing_by_file[path].update(entry)
                changed = True
        else:
            data["photos"].append(entry)
            changed = True

    if changed:
        from datetime import datetime
        if "meta" not in data or not isinstance(data["meta"], dict):
            data["meta"] = {}
        data["meta"]["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        with open(data_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  Updated gallery-data.json ({len(data['photos'])} entries)")


ARCHIVE_DIR = Path("images/archive")


def sync_archive():
    """
    Reconcile images/cattle/ <-> images/archive/ with cattle-data.json's
    animals[] and archived[] arrays. See docs/CLEANUP-SPEC.md § 2.

    - Animals in `archived[]` with photos still in images/cattle/ get their
      photos (and -thumb.jpg siblings) moved to images/archive/. Their
      metadata fingerprints are purged from the cattle namespace so a
      fresh upload of the same original photo wouldn't be blocked.
    - Animals in `animals[]` with photos currently in images/archive/
      (restored via the admin panel) get their photos moved back. No
      fingerprint re-registration needed since the files never left the
      repo.

    The admin panel mutates cattle-data.json to trigger this sync — the
    JSON moves happen in the browser; the physical file moves happen here.
    """
    data_file = Path("cattle-data.json")
    if not data_file.exists():
        return

    try:
        with open(data_file, "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"sync_archive: could not read cattle-data.json: {e}")
        return

    active = data.get("animals", []) or []
    archived = data.get("archived", []) or []
    if not archived and not active:
        return

    fingerprints = load_fingerprints()
    fingerprints_changed = False
    moved_count = 0

    def move_photo(src_path, dst_dir):
        """Move a single photo plus its -thumb.jpg sibling if present."""
        nonlocal moved_count
        src = Path(src_path)
        if not src.exists():
            return
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / src.name
        if dst.exists():
            # Target already exists — don't clobber, skip
            return
        src.rename(dst)
        moved_count += 1
        # Move the -thumb.jpg sibling if it's there
        thumb_src = src.with_name(src.stem + "-thumb" + src.suffix)
        if thumb_src.exists():
            thumb_dst = dst_dir / thumb_src.name
            if not thumb_dst.exists():
                thumb_src.rename(thumb_dst)

    # Archive active -> archived: move files from images/cattle/ to
    # images/archive/ and strip their fingerprints so the table stays clean.
    cattle_namespace = fingerprints.get("cattle", {})
    for animal in archived:
        tag = animal.get("tag")
        if not tag:
            continue
        # Paths recorded in the animal's photos[] might still point at
        # images/cattle/. Move whatever is still there.
        for photo_path in list(animal.get("photos", []) or []):
            if photo_path.startswith("images/cattle/") and Path(photo_path).exists():
                move_photo(photo_path, ARCHIVE_DIR)
        # Also catch any stray tag-<tag>-N.jpg files the pipeline may have
        # written directly to images/cattle/ that the JSON doesn't know about.
        for stray in CATTLE_DIR.glob(f"tag-{tag}-*.jpg"):
            if stray.stem.endswith("-thumb"):
                continue
            move_photo(str(stray), ARCHIVE_DIR)
        # Prune fingerprints — any cattle-namespace entry pointing at a
        # path for this tag is now stale.
        dead_fps = [
            fp for fp, path in cattle_namespace.items()
            if f"/tag-{tag}-" in path or path.endswith(f"/tag-{tag}.jpg")
        ]
        for fp in dead_fps:
            del cattle_namespace[fp]
            fingerprints_changed = True

    # Restore archived -> active: if an animal was moved back to
    # animals[] by the admin panel but its photos are still in
    # images/archive/, move them back to images/cattle/. We walk the
    # archive folder rather than relying on the JSON path since the
    # admin may or may not update the path when restoring.
    active_tags = {a.get("tag") for a in active if a.get("tag")}
    if active_tags and ARCHIVE_DIR.exists():
        for f in ARCHIVE_DIR.glob("tag-*-*.jpg"):
            if f.stem.endswith("-thumb"):
                continue
            m = re.match(r"tag-(\w+)-\d+\.jpg$", f.name)
            if not m:
                continue
            if m.group(1) in active_tags:
                move_photo(str(f), CATTLE_DIR)

    if moved_count:
        print(f"sync_archive: moved {moved_count} photo(s)")
    if fingerprints_changed:
        save_fingerprints(fingerprints)
        print("sync_archive: pruned fingerprints for archived animals")


if __name__ == "__main__":
    process_inbox()
    process_cattle()
    sync_archive()
    update_cattle_data()
    update_gallery_data()
    print("\nDone.")
