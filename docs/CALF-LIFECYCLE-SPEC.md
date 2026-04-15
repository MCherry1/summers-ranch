# Calf Tagging Lifecycle, Branding, and Admin Fixes — Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## 1. Quick Fixes (Implement First)

### No "Unnamed" Label
When an animal has no name, don't display "Unnamed" or "—" on the public cattle page. Just hide the name element entirely. The tag number is sufficient identification.

On the admin panel, "Unnamed" in the card header is fine as a visual indicator — but make it very subtle (light gray italic, which it already is).

**Status: Partially fixed.** Public cattle page updated. Admin panel can stay as-is.

### Join Date Auto-Population

When an animal's `source` is set to `"herd"` (born and raised here), the `date_entered` field should:
- Auto-populate with the `born` date value
- Be **grayed out / disabled** — not editable independently
- Update automatically if the `born` date is changed

When `source` is `"purchased"` or `"reference"`, `date_entered` is independently editable.

When `source` is blank (not yet set), `date_entered` is editable.

**Implementation:** In the admin panel edit form, add a listener on the `source` dropdown:
```javascript
sourceSelect.addEventListener('change', function() {
    if (this.value === 'herd') {
        dateEnteredInput.value = bornInput.value;
        dateEnteredInput.disabled = true;
    } else {
        dateEnteredInput.disabled = false;
    }
});
// Also sync when born date changes while source is 'herd'
bornInput.addEventListener('change', function() {
    if (sourceSelect.value === 'herd') {
        dateEnteredInput.value = this.value;
    }
});
```

---

## 2. Calf Tagging Lifecycle

### The Real-World Process

When a calf is born at Summers Ranch:
1. **Birth:** Calf receives its **mother's tag number** on a different color tag. Tag #209's calf gets a tag that says "209" but in a calf-specific color.
2. **With mom:** Calf stays with mom for several months. During this time, its identifier is "209 calf." If mom has another calf the next year, there could be another "209 calf."
3. **Weaning:** Calf is separated from mom and receives its **own unique tag number** (e.g., tag #315). All records and photos transfer from "209 calf" to "315."

### The Data Model

Add a `calf_of` field and a `calf_status` field to the animal schema:

```json
{
  "tag": "209-CALF",
  "calf_of": "209",
  "calf_status": "nursing",
  "name": "",
  "born": "2026-03-15",
  "sex": "heifer",
  ...
}
```

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tag` | string | While nursing: `"209-CALF"`. After weaning: changes to the new permanent tag. |
| `calf_of` | string | The dam's tag number. Set when the calf is created. Cleared when the calf gets its own tag. |
| `calf_status` | string | `"nursing"` (with mom), `"weaned"` (separated, awaiting own tag), `""` (has own tag, fully independent). |

### Photo Pipeline — Calf Prefix

The iOS Shortcut will use the format:
```
cattle-tag-209CALF-20260315-143022.jpg
```

The pipeline should recognize the `CALF` suffix:
- Route to `images/cattle/tag-209-CALF-1.jpg`, `tag-209-CALF-2.jpg`, etc.
- Create or update the `209-CALF` entry in `cattle-data.json` (not the `209` entry)
- Auto-populate `calf_of` with `"209"` when creating the entry

**Pipeline regex update:**
```python
# Detect calf suffix in tag
cattle_match = re.match(r'cattle-tag-\[?(\w+?)(CALF)?\]?-', name)
if cattle_match:
    tag_base = cattle_match.group(1).upper()
    is_calf = cattle_match.group(2) is not None
    tag_number = tag_base + '-CALF' if is_calf else tag_base
```

### Admin Panel — Creating a Calf

When creating a new animal:

1. If `sex` is set to `"calf"` (or `"bull calf"` or `"heifer calf"`):
   - The **tag number input is disabled/grayed out**
   - A **"Dam's tag #"** field appears (or the Dam dropdown auto-populates this)
   - The tag is auto-generated as `[dam_tag]-CALF`
   - `calf_of` is auto-set to the dam's tag
   - `calf_status` is set to `"nursing"`

2. If the dam's tag is manually entered (dam not in the system):
   - The tag still auto-generates as `[entered_number]-CALF`
   - `calf_of` is set to the entered number

### Admin Panel — Giving a Calf Its Own Tag

When an animal has `calf_status: "nursing"` or `"weaned"`:

1. A prominent button appears: **"Assign Own Tag"** (styled like "Remove from Herd" — appears alongside the status controls)
2. Clicking it:
   - Enables the tag number input field (was grayed out)
   - Clears the tag field for the admin to type the new permanent tag
   - Shows a confirmation message: "Enter the new tag number for this animal"
3. When the admin types the new tag (e.g., "315") and saves:
   - `tag` changes from `"209-CALF"` to `"315"`
   - `calf_of` is cleared
   - `calf_status` is set to `""`
   - **All photos are renamed:**
     ```
     images/cattle/tag-209-CALF-1.jpg → images/cattle/tag-315-1.jpg
     images/cattle/tag-209-CALF-2.jpg → images/cattle/tag-315-2.jpg
     (and thumbnails if they exist)
     ```
   - `photos` array in JSON is updated with new paths
   - `photo_fingerprints.json` is updated with new paths
   - Commit message: `"Assign tag #315 to calf of #209 — rename photos and records"`

### Public Cattle Page — Calf Display

Calves with `calf_status: "nursing"` appear as normal cards but with:
- Tag displayed as: **"Calf of #209"** (not "Tag #209-CALF")
- The dam's tag is a clickable link to the dam's card
- If the pink/blue newborn ribbon is active, it shows as usual

### Edge Case: Multiple Calves from Same Dam

When dam #209 has a new calf while a previous "209-CALF" still exists:
- The NEW calf gets `tag: "209-CALF-2"`, then `"209-CALF-3"`, etc.
- The pipeline auto-numbers just like regular tag photos
- But this shouldn't happen often — by the time dam #209 has her next calf, the previous one should have been weaned and assigned its own tag

If it does happen, the admin panel should show a nudge: "Tag #209 has 2 calves — the older one may need its own tag."

---

## 3. Branded Tracking

### New Field

Add `branded` to the animal schema:

```json
{
  "tag": "315",
  "branded": false,
  ...
}
```

- `true` = animal has been branded with the MRS brand
- `false` = not yet branded
- Default for new animals: `false`

### Admin Panel

Add a checkbox in the animal edit form:
```
☐ Branded with ranch brand
```

Simple checkbox, no tooltip needed (self-explanatory). Position it near the status/source fields.

### Nudge: Unbranded Cattle

Add a **persistent nudge** (not affected by the 7-day grace period) that shows when there are unbranded animals in the herd:

**"3 animals have not been branded"** — with the 🔥 icon

This nudge:
- Always shows regardless of when the animals were added (branding is a safety/legal concern)
- Cannot be permanently dismissed — if dismissed, it returns after **24 hours** (not session-based)
- Only counts active herd animals (not culled, deceased, reference, or calves still nursing — calves get branded at weaning, not birth)

### Nudge Dismissal Timer Update

Change the dismissal mechanism from session-based (`sessionStorage`) to time-based (`localStorage` with timestamp):

```javascript
function dismissNudges() {
    localStorage.setItem('srp_nudges_dismissed', Date.now().toString());
}

function isNudgesDismissed() {
    const dismissed = localStorage.getItem('srp_nudges_dismissed');
    if (!dismissed) return false;
    const elapsed = Date.now() - parseInt(dismissed, 10);
    return elapsed < 24 * 60 * 60 * 1000; // 24 hours
}
```

This applies to ALL nudges, not just the branding one. Dismissed nudges return after 24 hours. This prevents the admin panel from being permanently silent about issues that still need attention.

---

## 4. Updated Schema

```json
{
  "tag": "209-CALF",
  "calf_of": "209",
  "calf_status": "nursing",
  "branded": false,
  "name": "",
  "born": "2026-03-15",
  "date_entered": "2026-03-15",
  ...
}
```

New fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `calf_of` | string | `""` | Dam's tag number. Set while calf is with mom. Cleared when calf gets own tag. |
| `calf_status` | string | `""` | `"nursing"`, `"weaned"`, or `""` (independent). |
| `branded` | boolean | `false` | Whether the animal has been branded with the ranch brand. |

---

## 5. Pipeline Updates

### Recognize CALF suffix in filenames

```python
# In route_by_prefix():
cattle_match = re.match(r'cattle-tag-\[?(\w+?)(CALF)?\]?-', name)
if cattle_match:
    tag_base = cattle_match.group(1).upper()
    is_calf = bool(cattle_match.group(2))
    tag_number = tag_base + '-CALF' if is_calf else tag_base
    seq = next_cattle_number(tag_number)
    return "cattle", f"tag-{tag_number}-{seq}.jpg"
```

### Auto-create calf entries

When the pipeline auto-creates an entry for a new `XXX-CALF` tag:
```python
{
    "tag": tag,           # e.g., "209-CALF"
    "calf_of": tag.replace("-CALF", ""),  # e.g., "209"
    "calf_status": "nursing",
    "branded": False,
    ... (all other fields blank as per existing behavior)
}
```

---

## 6. Photo Renaming on Tag Assignment

When a calf is assigned its own tag, ALL associated files must be renamed:

```python
def rename_calf_to_tag(old_tag, new_tag, cattle_dir, data):
    """Rename all photos and update JSON when a calf gets its own tag."""
    import shutil
    
    renamed = []
    for pattern in [f"tag-{old_tag}-*.jpg", f"tag-{old_tag}-*-thumb.jpg"]:
        for old_path in sorted(cattle_dir.glob(pattern)):
            new_name = old_path.name.replace(f"tag-{old_tag}-", f"tag-{new_tag}-")
            new_path = old_path.parent / new_name
            old_path.rename(new_path)
            renamed.append((str(old_path), str(new_path)))
    
    # Update the animal record in data
    for animal in data["animals"]:
        if animal["tag"] == old_tag:
            animal["tag"] = new_tag
            animal["calf_of"] = ""
            animal["calf_status"] = ""
            animal["photos"] = [p.replace(f"tag-{old_tag}-", f"tag-{new_tag}-") 
                               for p in animal.get("photos", [])]
            if animal.get("primary_photo"):
                animal["primary_photo"] = animal["primary_photo"].replace(
                    f"tag-{old_tag}-", f"tag-{new_tag}-")
            break
    
    return renamed
```

This runs via the admin panel's GitHub API calls — read cattle-data.json, rename files via the Contents API, update and write the JSON back. All in one commit.

---

## Implementation Priority

1. **Join date auto-population** — Quick fix, 10 lines of JS
2. **Branded checkbox + nudge** — Simple field addition
3. **24-hour nudge dismissal** — Change sessionStorage to localStorage with timestamp
4. **Calf tagging system** — The big one: schema + admin UI + pipeline + rename logic
5. **Photo renaming on tag assignment** — Part of #4, but the most complex piece
