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

**iOS Shortcut Input (Simplified for Big Number Keys):**

The shortcut asks TWO questions, both using the number input type (big keys):

1. **"Tag number?"** → Marty types `209` (number keyboard)
2. **"Calf number? (blank if not a calf)"** → Marty types `1` for first calf, `2` for twins, or leaves blank for an adult cow (number keyboard)

The shortcut constructs the filename:
- Calf number entered → `cattle-tag-209CALF1-20260315-143022.jpg`
- Calf number blank → `cattle-tag-209-20260315-143022.jpg`

**Marty never types letters. Ever.** Both inputs use the big numeric keyboard. The shortcut adds "CALF" automatically.

**For twins:** Dam #209 has twins. Marty photographs the first calf → types `209` then `1`. Photographs the second calf → types `209` then `2`. Files become `tag-209-CALF1-1.jpg` and `tag-209-CALF2-1.jpg`.

**Shortcut implementation:**
```
1. Ask for Input: "Tag number?" (Number type)
   → save to TagNumber
2. Ask for Input: "Calf number? Leave blank if adult" (Number type)
   → save to CalfNumber
3. If CalfNumber has value:
   → set Prefix to: cattle-tag-[TagNumber]CALF[CalfNumber]
   Else:
   → set Prefix to: cattle-tag-[TagNumber]
4. (rest of shortcut continues as normal)
```

The pipeline recognizes these patterns:
- `cattle-tag-209CALF1-timestamp.jpg` → tag `209-CALF1` (first calf / twin 1)
- `cattle-tag-209CALF2-timestamp.jpg` → tag `209-CALF2` (twin 2)
- `cattle-tag-209CALF-timestamp.jpg` → tag `209-CALF` (legacy single calf format)
- `cattle-tag-209-timestamp.jpg` → tag `209` (adult)

**Pipeline regex update:**
```python
# In route_by_prefix() — try calf pattern first, then regular:
calf_match = re.match(r'cattle-tag-\[?(\w+?)(calf\d*)\]?-', name, re.IGNORECASE)
if calf_match:
    tag_base = calf_match.group(1).upper()
    calf_suffix = calf_match.group(2).upper()
    tag_number = tag_base + '-' + calf_suffix
    seq = next_cattle_number(tag_number)
    return "cattle", f"tag-{tag_number}-{seq}.jpg"

regular_match = re.match(r'cattle-tag-\[?(\w+)\]?-', name, re.IGNORECASE)
if regular_match:
    tag_number = regular_match.group(1).upper()
    seq = next_cattle_number(tag_number)
    return "cattle", f"tag-{tag_number}-{seq}.jpg"
```

**Auto-create entry for calves:**
When the pipeline creates an entry for a `XXX-CALF1` tag:
```python
{
    "tag": "209-CALF1",
    "calf_of": "209",  # extracted from tag before the CALF suffix
    "calf_status": "nursing",
    "branded": False,
    ... (all other fields blank)
}
```

### Admin Panel — Calf UI Flow

The calf interface is driven by the **animal type dropdown** (sex field). When the type changes to any calf category, the calf-specific UI appears. When it changes away from calf, the transition UI appears (if applicable).

#### State 1: Animal type is set to "calf" (or "bull calf" / "heifer calf")

```
┌──────────────────────────────────────────────────┐
│  Tag Number                                      │
│  [ _______ ]  (grayed out, empty — no real tag)  │
│                                                  │
│  Calf Tag Number              ☑ Use dam tag      │
│  [ 209     ]  (auto-filled, non-editable)        │
│                                                  │
│  Type                                            │
│  [ Calf ▾ ]                                      │
│                                                  │
│  Dam                                             │
│  [ #209 — Bessie ▾ ]                             │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Top-level **Tag Number** is grayed out and empty. Visually obvious this isn't a real tag yet.
- **Calf Tag Number** field appears (only visible when type is a calf category).
- **"Use dam tag number" checkbox** — checked by default. When checked:
  - Calf tag auto-fills from the dam's tag number (if dam is set and has a tag)
  - Calf tag field is non-editable (grayed out, shows the number)
  - If dam is not set or has no tag, the calf tag field is editable so Marty can type it manually
- When **"Use dam tag number" is unchecked:**
  - Calf tag field grays out and disappears
  - Top-level Tag Number field becomes editable (this calf already has its own tag)
  - This handles the case where a calf arrives with its own tag from day one

#### State 2: Changing type FROM calf to another type (e.g., heifer, cow, bull)

**If "Use dam tag number" was checked (calf was using dam's tag):**

```
┌──────────────────────────────────────────────────┐
│  Tag Number                                      │
│  [ _______ ]  (still grayed out)                 │
│                                                  │
│  Type                                            │
│  [ Heifer ▾ ]           [ Assign Tag ]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

- The Calf Tag Number field disappears (no longer a calf)
- An **"Assign Tag"** button appears next to the type dropdown
- Clicking "Assign Tag" → the button transforms into a **number input field**:

```
┌──────────────────────────────────────────────────┐
│  Tag Number                                      │
│  [ _______ ]  (still grayed out)                 │
│                                                  │
│  Type                                            │
│  [ Heifer ▾ ]     New tag: [ 315  ]              │
│                                                  │
└──────────────────────────────────────────────────┘
```

- The number input uses `<input type="number">` for big numeric keys
- When Marty clicks **Save**:
  - The new tag number populates the top-level Tag Number field
  - `calf_of` is cleared
  - `calf_status` is cleared
  - All photos renamed (see Photo Renaming section below)
  - Calf Tag Number field is gone

**If "Use dam tag number" was unchecked (calf already had its own tag):**
- The "Assign Tag" button does NOT appear — the animal already has a real tag
- The type simply changes, tag stays as-is
- No photo renaming needed

#### Creating a brand new calf (Add Animal form)

1. Type defaults to blank ("—")
2. Marty selects "Calf" from the type dropdown
3. Calf Tag Number field appears with "Use dam tag number" checked
4. Marty selects the dam from the Dam dropdown
5. Calf tag auto-fills with dam's tag number
6. Marty fills in born date, sex details, etc.
7. Clicks Create
8. Entry is created with `tag: "209-CALF1"`, `calf_of: "209"`, `calf_status: "nursing"`
9. The calf number (1, 2, etc.) is auto-determined: count existing `209-CALF*` entries and use the next number

### Admin Panel — Giving a Calf Its Own Tag (Save Behavior)

When Save is clicked after typing a new tag number in the "Assign Tag" field:

1. `tag` changes from `"209-CALF1"` to `"315"`
2. `calf_of` is cleared
3. `calf_status` is set to `""`
4. **All photos are renamed:**
   ```
   images/cattle/tag-209-CALF1-1.jpg → images/cattle/tag-315-1.jpg
   images/cattle/tag-209-CALF1-2.jpg → images/cattle/tag-315-2.jpg
   (and thumbnails if they exist)
   ```
5. `photos` array in JSON is updated with new paths
6. `photo_fingerprints.json` is updated with new paths
7. Commit message: `"Assign tag #315 to calf of #209 — rename photos and records"`

### Public Cattle Page — Calf Display

Calves with `calf_status: "nursing"` appear as normal cards but with:
- Tag displayed as: **"Calf of #209"** (not "Tag #209-CALF1")
- If there are twins: **"Calf 1 of #209"** and **"Calf 2 of #209"**
- The dam's tag is a clickable link to the dam's card
- If the pink/blue newborn ribbon is active, it shows as usual

### Edge Case: Twins and Multiple Calves from Same Dam

**Twins:** Dam #209 has twins. They get `tag: "209-CALF1"` and `tag: "209-CALF2"`. Marty types `209` and `1` for the first twin, `209` and `2` for the second. The shortcut and pipeline handle this natively through the calf number input.

**Next year's calf:** If dam #209 has a new calf the following year while a previous CALF1 still exists and hasn't been weaned/retagged:
- The new calf gets the next available number: `209-CALF3` (if 1 and 2 exist from twins) or `209-CALF2` (if only 1 existed)
- Marty just types the next number in the shortcut
- The admin panel should show a nudge: "Tag #209 has 2 calves — the older one may need its own tag."

**Important:** Calves from different years sharing a dam is normal. The calf number is NOT tied to birth order across years — it's just a unique differentiator. Marty picks the number; the system doesn't auto-assign it.

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

### Nudge: Pregnancy Overdue

Cattle gestation is approximately **283 days**. If a cow has `pregnancy_status` set to `"bred"` or `"confirmed"` for longer than ~300 days (giving some buffer), something needs attention — either she calved and nobody updated the record, or there's a problem.

**Trigger:** An animal with `pregnancy_status` of `"bred"` or `"confirmed"` where:
- `expected_calving` is a parseable date AND that date is more than 14 days in the past, OR
- `expected_calving` is not set but `pregnancy_status` was set more than 300 days ago (requires tracking when the status was set — add a `pregnancy_set_date` field, auto-populated when pregnancy_status changes)

**Message:** "Tag #209 may be overdue — marked pregnant [X] days ago" or "Tag #209's expected calving date has passed (was [date])"

**Priority:** Medium. This is a health/recordkeeping concern, not a revenue issue.

**Important:** This nudge should NOT automatically clear the pregnancy status. Marty clears it manually when he's confirmed the calf was born and has updated the records. The nudge just reminds him to check.

---

## 4. Updated Schema

```json
{
  "tag": "209-CALF1",
  "calf_of": "209",
  "calf_status": "nursing",
  "branded": false,
  "pregnancy_set_date": "",
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
| `pregnancy_set_date` | string | `""` | ISO date auto-set when `pregnancy_status` changes to "bred" or "confirmed". Used for overdue nudge calculation. |

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
