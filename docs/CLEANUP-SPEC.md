# Duplicate Detection, Herd Cleanup, and Photo Curation — Spec

*For Claude Code implementation.*

---

## 1. Smart Duplicate Detection (Metadata Fingerprint)

### The Problem
The current duplicate check uses SHA-256 file hashing. But when Marty selects the same photo from his iPhone library twice (weeks apart), the phone may re-encode it differently each time — different JPEG compression artifacts, different file bytes, but visually identical. The hash won't match.

### The Solution: EXIF Fingerprint Lookup Table

Every iPhone photo has unique EXIF metadata that survives re-encoding:
- `DateTimeOriginal` (when the shutter was pressed)
- `SubSecTimeOriginal` (sub-second precision, if available)
- `ImageUniqueID` (some cameras set this)
- Image dimensions (width x height of the original)

Create a fingerprint from these fields. Before the pipeline strips EXIF, extract the fingerprint. Compare against a lookup table. If it matches, it's a duplicate.

### The Lookup Table: `photo-fingerprints.json`

Stored in the repo root (not public-facing, just pipeline data):

```json
{
  "cattle": {
    "a1b2c3d4e5f6": "images/cattle/tag-215-1.jpg",
    "f6e5d4c3b2a1": "images/cattle/tag-TY124-1.jpg"
  },
  "gallery": {
    "1a2b3c4d5e6f": "images/gallery/sunset-over-pasture.jpg"
  }
}
```

Keys are fingerprint hashes. Values are the final destination paths. Two separate namespaces: `cattle` and `gallery`.

### Fingerprint Generation

```python
def photo_fingerprint(filepath):
    """
    Generate a fingerprint from EXIF metadata that survives re-encoding.
    Returns a short hash string, or None if no usable EXIF.
    """
    try:
        result = subprocess.run(
            ["exiftool", "-DateTimeOriginal", "-SubSecTimeOriginal",
             "-ImageWidth", "-ImageHeight", "-s3", "-sep", "|", str(filepath)],
            capture_output=True, text=True, timeout=5
        )
        raw = result.stdout.strip()
        if not raw or len(raw) < 10:
            return None
        return hashlib.md5(raw.encode()).hexdigest()[:16]
    except Exception:
        return None
```

### Pipeline Integration

1. **Before processing**, extract the fingerprint from the raw inbox photo
2. **Load** `photo-fingerprints.json`
3. **Check the appropriate namespace:**
   - If the photo is `cattle-tag-*` → check only the `cattle` namespace
   - If the photo is `photo-*` or `hunting-*` → check only the `gallery` namespace
4. **If fingerprint exists in that namespace** → duplicate. Delete from inbox, skip processing.
5. **If fingerprint exists in the OTHER namespace** → NOT a duplicate. Cross-pipeline reuse is intentional. Process normally.
6. **After processing**, add the fingerprint → destination path to the lookup table
7. **Commit** `photo-fingerprints.json` alongside image changes

### Key Design Decision: Cross-Pipeline Duplicates Are OK

Marty uploads a beautiful cow photo as cattle tag 200. Later he uploads the same photo to the gallery because it's gorgeous. This is INTENTIONAL. The cattle and gallery namespaces are separate. Only same-pipeline duplicates are blocked.

### Fallback

If EXIF is stripped before upload (old shortcut behavior) or no usable metadata exists, fall back to the existing SHA-256 file hash check. Belt and suspenders.

### Keeping the Lookup Table Clean

When an animal is culled and its photos are cleaned up (see §2 below), remove the corresponding fingerprints from the `cattle` namespace. When a gallery photo is deleted, remove its fingerprint from the `gallery` namespace.

---

## 2. Herd Culling — Full Cleanup

### The Problem
When Marty removes an animal from the herd (status → culled/deceased, then "Remove from Herd" confirmation), the current system hides the card from the public site but leaves all the photos and JSON data in the repo. Over years, this accumulates dead weight — zombie photos for animals that no longer exist.

### The Solution: Archival, Not Deletion

Don't permanently delete anything immediately. Move culled animal data to an archive. This protects against "oops I didn't mean to cull that one" and keeps historical records available if needed.

### Archive Workflow (triggered by "Remove from Herd" confirmation)

When an animal's status is set to `culled` or `deceased` AND the admin confirms removal:

**Step 1: Move photos to archive folder**
```
images/cattle/tag-215-1.jpg → images/archive/tag-215-1.jpg
images/cattle/tag-215-2.jpg → images/archive/tag-215-2.jpg
images/cattle/tag-215-1-thumb.jpg → images/archive/tag-215-1-thumb.jpg
```

Create `images/archive/` if it doesn't exist. Not served on the public site, not in any image folder the gallery or cattle page reads from.

**Step 2: Move animal record to archive section in JSON**

```json
{
  "animals": [ ... active animals ... ],
  "archived": [
    {
      "tag": "215",
      "name": "Old Bessie",
      "archived_date": "2026-04-14",
      "archived_reason": "deceased",
      ... all original fields preserved ...
    }
  ]
}
```

**Step 3: Clean up fingerprints**
Remove the archived animal's photo fingerprints from `photo-fingerprints.json` `cattle` namespace. This means if Marty happens to upload a photo that was previously used for this now-archived animal, it won't be blocked as a duplicate.

**Step 4: Commit all changes in one atomic commit**
```
"Archive Tag #215 (Old Bessie) — deceased. Photos moved to images/archive/"
```

### Admin Panel: Archive Section

Add a collapsible "Archived Animals" section at the bottom of the Herd tab. Shows count: "12 archived animals." Expandable to show the list. Each archived animal has:
- Tag, name, archived date, reason
- A **"Restore"** button that moves it back to the active herd

### What About Sold Animals?

`sold` is different from `culled`/`deceased`. Sold animals STAY on the public site (with the red "Sold" ribbon) because buyers want to see what the ranch has produced. Only `culled` and `deceased` trigger the archive cleanup. The admin can manually archive a sold animal later if they want to clean it up.

### Periodic Cleanup (Optional Future Enhancement)

A GitHub Action could run monthly to check if `images/archive/` exceeds a size threshold (e.g., 500MB) and alert the admin. Or it could auto-delete archived photos older than 2 years. But don't build this now — the archive is enough.

---

## 3. Photo Curation (Future Task)

### The Problem
Over time, the gallery will accumulate too many photos. The hunting section might have 30 photos when only 2-3 per year are appropriate. Without curation, the site becomes an endless scroll.

### This is a FUTURE task. Document the approach, don't build it now.

### Recommended Approach: "Featured" Flag

Add a `featured` boolean to `gallery-data.json` entries. The gallery page shows only featured photos by default, with an expandable "Show all" option.

The admin panel gets a Gallery tab (alongside Herd and Calendar) where Marty can:
- See all gallery photos as thumbnails
- Tap to toggle "featured" on/off
- Drag to reorder featured photos
- Delete photos he doesn't want at all

For hunting specifically:
- The About page hunting section should show only the most recent 2-3 photos per year
- Auto-select by looking at `photo_dates` and showing the newest from each year
- If more than 3 exist for a year, show 3 and hide the rest

### Gallery Page Layout (Future)

Instead of a flat grid, organize by category:
- "Ranch Life" (category: ranch, family)
- "The Herd" (category: cattle — gallery copies, not the cattle card photos)
- "The Hunt" (category: hunting, grouped by year)

Each section shows 6-8 featured photos with a "View all" link that expands.

### Don't Build This Now

The gallery has ~17 photos. Curation doesn't matter until there are 50+. By then, the `gallery-data.json` structure and the admin panel Gallery tab can be built. The data layer is already in place — `gallery-data.json` exists and photos have captions and categories.

---

## Implementation Priority

1. ✅ **Metadata fingerprint duplicate detection** — Build now. Prevents the most common user error.
2. ✅ **Herd culling archive workflow** — Build now. Needed before Marty starts managing the herd for real.
3. 📋 **Photo curation** — Documented in `docs/FUTURE-IMPROVEMENTS.md`. Deferred until 50+ gallery photos.

---

## Implementation Notes

### § 1 — Metadata fingerprint dedup

- **`.github/scripts/process_photos.py`** — new `photo_fingerprint()`
  helper shells out to `exiftool` for `DateTimeOriginal`,
  `SubSecTimeOriginal`, `ImageUniqueID`, and original `ImageWidth`/
  `ImageHeight`, joins them with `|`, and hashes the result to a
  16-char MD5 digest. Extraction runs BEFORE `strip_and_resize()` so
  the EXIF is still intact.
- **`load_fingerprints()` / `save_fingerprints()`** read and write
  `photo-fingerprints.json` at the repo root with the `{cattle: {},
  gallery: {}}` schema from the spec. Missing file → empty schema
  default, malformed file → empty schema default (belt and
  suspenders).
- **`fingerprint_namespace_for(category, name)`** picks the namespace.
  Prefix-based check for pre-classification photos (`cattle-tag-*` →
  `cattle`, everything else → `gallery`). After the photo is routed,
  the caller uses the final category directly.
- **`process_inbox()`** pipeline order:
  1. Compute fingerprint (EXIF-based).
  2. If it exists in the pre-move namespace → duplicate, remove from
     inbox, skip to next photo.
  3. Otherwise fall back to the SHA-256 file hash check for photos
     that have no usable EXIF.
  4. Process normally.
  5. After the photo lands at its target path, record the fingerprint
     under the final (post-classification) namespace so future
     uploads of the same photo get caught.
- **`save_fingerprints()`** runs once at the end of `process_inbox()`
  if anything changed. The workflow commits
  `photo-fingerprints.json` alongside the photos.

### § 2 — Herd culling archive workflow

- **`admin.html`** — `saveAnimal()` watches for `status in
  {culled, deceased}` combined with the existing
  `_getConfirmedRemove` flag. When both match, the commit mutator
  stamps `archived_date` (local YYYY-MM-DD) and `archived_reason`,
  pushes the animal into `data.archived[]`, and splices it out of
  `data.animals[]`. Commit message: `Archive tag #<tag> (<name>) —
  <reason>`. The admin then re-renders instead of trying to update
  the now-missing card.
- **New "Archived Animals" section** (`#archivedSection`) lives at
  the bottom of the Herd tab, hidden entirely when
  `data.archived[]` is empty. Collapsible toggle, opens a list of
  rows showing tag + name + reason + date, each with a **Restore**
  button. `renderArchived()` is called from the existing
  `render()` alongside `renderNudges()`.
- **`restoreArchivedAnimal(idx)`** prompts with a confirm dialog,
  strips the archive metadata, sets `status = 'breeding'` as the
  default, moves the animal back to `data.animals[]`, and commits
  with `Restore tag #<tag> from archive`. The pipeline then moves
  the photos back from `images/archive/` → `images/cattle/` on its
  next run.
- **`.github/scripts/process_photos.py`** — new `sync_archive()`
  reconciles the filesystem with `cattle-data.json`. For each
  animal in `archived[]`, moves any still-present
  `images/cattle/tag-<tag>-*.jpg` (and `-thumb.jpg` siblings) to
  `images/archive/`, and prunes the corresponding entries from
  `photo-fingerprints.json`'s `cattle` namespace. For each animal
  back in `animals[]`, walks `images/archive/` and moves matching
  photos back. Runs between `process_cattle()` and
  `update_cattle_data()`.
- **`.github/workflows/process-photos.yml`** — trigger paths now
  include `cattle-data.json` so archive/restore commits from the
  admin panel re-run the pipeline. The commit step stages
  `gallery-data.json` and `photo-fingerprints.json` in addition to
  the existing `images/` + `cattle-data.json` set.

### Verification
- `python3 ast.parse` on `process_photos.py` → clean.
- `photo_fingerprint()` smoke-tested against the live exiftool
  install; namespace selection verified for cattle-tag-*, photo-*,
  and explicit category arguments.
- `load_fingerprints()` / `save_fingerprints()` round-trip tested
  in a temp directory.
- `sync_archive()` end-to-end: archive case moves files, prunes
  fingerprints, leaves active animals alone; restore case moves
  files back. Thumbs travel with their parents.
- `new Function()` parses the full `admin.html` inline script clean.
