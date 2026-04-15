# Calf Lifecycle — Edge Cases and Bug Prevention

*Addendum to CALF-LIFECYCLE-SPEC.md. Claude Code should review these before implementing.*

---

## Edge Case 1: Existing Animal Gets Type Changed to "Calf"

**Scenario:** Tag #315 exists with 5 photos (`tag-315-1.jpg` through `tag-315-5.jpg`). Someone changes its type to "calf."

**The bug:** The calf UI appears, grays out the main tag, shows the calf tag field. If "Use dam tag" gets checked and dam is #209, the system would want to change the tag to "209-CALF1." But there are 5 photos already named `tag-315-*`. Do we rename them backwards to `tag-209-CALF1-*`? That's bizarre and destructive.

**The fix:** When changing an existing animal's type TO "calf," if the animal already has a non-empty tag number and photos:
- Do NOT gray out the main tag
- Do NOT show the calf tag field
- Show a note: "This animal already has its own tag. To track as a dam's calf, create a new calf entry instead."
- The type change itself is allowed (maybe it was miscategorized), but the tag system doesn't engage calf mode for animals that already have established identities.

**Rule:** Calf tag mode only activates for NEW animals or animals with no existing tag/photos.

---

## Edge Case 2: Shortcut/Pipeline vs Admin Tag Mismatch

**Scenario:** Marty uploads photos via shortcut as `cattle-tag-209CALF1-timestamp.jpg`. The pipeline creates an entry for `209-CALF1`. Later, Marty opens the admin panel and creates a "new calf" for dam #209. The admin auto-assigns `209-CALF2` (since CALF1 exists). But CALF1 was the same animal — now there are two entries.

**The fix:** When creating a new calf in the admin panel for a given dam:
- Before auto-assigning the next CALF number, show a list of existing calves for that dam: "Dam #209 already has: CALF1 (created by photo upload, no details yet). Is this the same animal?"
- Option A: "Yes, this is CALF1" → opens the existing CALF1 entry for editing
- Option B: "No, this is a different calf" → creates CALF2

This prevents duplicate entries for the same animal entering through two different paths.

---

## Edge Case 3: Rename Collision

**Scenario:** Calf `209-CALF1` gets assigned tag #315. But tag #315 already exists in the system (maybe a previously sold animal, or a data entry error).

**The fix:** Before executing the rename, check if the new tag already exists in `cattle-data.json`:
- If it exists and has status `culled`/`deceased`/`archived`: warn "Tag #315 was previously used for [name]. Are you sure?"
- If it exists and is active: block the rename. "Tag #315 is already in use. Choose a different tag number."

Also check if `tag-315-*.jpg` files already exist in `images/cattle/`. Even if the JSON entry was archived, photos might still be there (if cleanup hasn't run). Rename would overwrite them silently.

**Rule:** Always check both JSON and filesystem before renaming.

---

## Edge Case 4: Calf Number Gaps

**Scenario:** Dam #209 had twins: CALF1 and CALF2. CALF1 was weaned and assigned tag #315 (renamed, entry cleared). CALF2 is still nursing. Next year, dam #209 has another calf. What calf number?

**Option A:** Reuse CALF1 (it's "available" now). Problem: confusing if anyone looks at photo history or git commits.
**Option B:** Use CALF3 (always increment). Problem: gaps look weird — "where's CALF1?"

**The fix:** Always use the next number, never reuse. Gaps are fine — they indicate history. The calf number is a differentiator, not a count. CALF3 just means "the third calf we've tracked for this dam." Add a comment in the spec: "Calf numbers are never reused for a given dam, even if previous calves have been assigned their own tags."

---

## Edge Case 5: Changing Type BACK to Calf After Getting a Real Tag

**Scenario:** Animal was `209-CALF1`, got assigned tag #315, photos renamed. Then someone changes the type back to "calf."

**The fix:** Same as Edge Case 1. The animal has tag #315 and photos named `tag-315-*`. It already has an established identity. Don't re-engage calf mode. Show the same note: "This animal already has its own tag."

**Rule:** Once an animal has been assigned its own tag (i.e., `calf_of` has been cleared and `calf_status` is empty), it cannot go back to calf mode. The type dropdown can still show "calf" for descriptive purposes (it's still young), but the tag infrastructure doesn't change.

---

## Edge Case 6: Partial Rename Failure

**Scenario:** Calf `209-CALF1` has 8 photos. Admin assigns tag #315. The rename process uses GitHub API to rename each file. After renaming 5 files, the API rate limits or errors out. Now 5 files are named `tag-315-*` and 3 are still `tag-209-CALF1-*`. The JSON has been updated to tag "315" but points to a mix of old and new paths.

**The fix:** Implement the rename as a two-phase commit:

Phase 1 — Dry run: Build the complete list of renames. Verify all source files exist and all target filenames are available. If anything fails validation, abort before touching anything.

Phase 2 — Execute: Rename all files and update the JSON in a single Git commit. Since we're using the GitHub API (which works on a tree/commit level), this CAN be atomic:

```
1. Get the current tree SHA
2. Create a new tree with all files renamed
3. Create a commit pointing to the new tree
4. Update the ref to the new commit
```

This is the GitHub "create tree + create commit" API pattern, and it's atomic — either all files rename or none do. The admin panel should use this instead of individual file-by-file PUT calls.

If the atomic approach is too complex, at minimum:
- Do all renames first, THEN update the JSON last
- If a rename fails partway, the JSON still has the old paths (which still exist for unrenamed files), and the admin can retry
- Add a "consistency check" that scans for mismatches between JSON photo paths and actual files

---

## Edge Case 7: Dam's Tag Changes

**Scenario:** Dam #209 is sold. Her tag gets reused for a new animal (common in ranching). Calf `209-CALF1` still has `calf_of: "209"` pointing to what is now a different animal.

**The fix:** The `calf_of` field stores the tag number, not a reference to a specific animal. This is inherently fragile. To make it robust:
- When a dam is culled/sold/removed, check if any active calves reference her tag
- If found, show a nudge: "Dam #209 has active calves. Assign their own tags before reusing #209."
- Don't block the removal — just warn. The calves' `calf_of` field becomes a historical reference.

Long-term fix: use an internal unique ID (not the tag number) for dam/sire references. But that's a major schema change for a future version.

---

## Edge Case 8: Calf Photos After Tag Assignment

**Scenario:** Calf was `209-CALF1`, assigned tag #315, all photos renamed. The next day, Marty runs the shortcut and uploads a photo as `cattle-tag-209CALF1-timestamp.jpg` (muscle memory, forgot the calf was retagged).

**The fix:** The pipeline creates `tag-209-CALF1-1.jpg` and an entry for `209-CALF1` (which no longer exists in the JSON since it was renamed to 315). This creates an orphan entry.

Prevention options:
- The pipeline could check: "does 209-CALF1 exist in the JSON? If not but 315 exists with `calf_of` history showing it was formerly 209-CALF1, route the photo to 315 instead."
- This requires the rename process to leave a breadcrumb: add a `formerly` field to the animal: `"formerly": "209-CALF1"`. The pipeline checks `formerly` fields when a tag doesn't match any current entry.
- Simpler alternative: just let the orphan entry get created. The admin nudge system will flag it: "Tag 209-CALF1 has photos but no details." Marty opens it, realizes the mistake, and manually moves the photo. Not elegant but functional.

**Recommendation:** Implement the `formerly` field. It's one extra field and prevents the most common post-rename error.

---

## Summary: Rules to Implement

1. **Calf mode only activates for animals without an established tag/photos.** Existing animals changing type to "calf" don't get calf tag behavior.
2. **Once a calf has been assigned its own tag, it cannot go back to calf mode.** The type can change but the tag infrastructure is permanent.
3. **Calf numbers are never reused for a given dam.** Always increment.
4. **Before renaming, check both JSON and filesystem for collisions.**
5. **Rename should be atomic** (single Git commit with tree manipulation) or at minimum JSON-last with retry capability.
6. **When creating a calf in admin, check for existing pipeline-created entries** for that dam to prevent duplicates.
7. **When a dam is removed, warn about active calves** referencing her tag.
8. **Add a `formerly` field** to track tag history and catch post-rename shortcut errors.
