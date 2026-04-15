# Future Improvements & Pipeline Ideas

*Things we've discussed and decided to defer. Reference this instead of scrolling through chat history.*

*Last updated: April 2026*

---

## High Priority — Build When Data Exists

### Calendar / Events Tab in Admin Panel
Add a second tab to the admin panel: **"Herd"** (existing cattle management) and **"Calendar"** (event management). The Calendar tab should:

- **"Add New Event" button** at the top — walks through a simple creation wizard: event name, start date, end date, category dropdown (sale/show/auction/hunting/general), advance warning days, banner text, and optional during-event text.
- **Upcoming events** listed below in chronological order (soonest first). Each event is an editable card with all the fields visible and a delete button.
- **Past events** listed below upcoming, in reverse chronological order (most recent first). Collapsible or limited to last 10 with a "show more" option. Past events can be duplicated (for recurring annual events — "Copy to next year" button that pre-fills everything with dates shifted +1 year).
- **Category dropdown options:** Sale, Show/Expo, Auction, Hunting, Ranch Event, General
- **All fields map directly** to `ranch-calendar.json` — the admin panel reads and writes to this file via the GitHub API, same pattern as cattle-data.json.
- Don't build Google Calendar sync. This tab IS the calendar. Marty adds events here instead of maintaining a separate Google Calendar.

**Why this matters:** Marty uses a paper calendar. Adding a Google Calendar fetch is adding steps to a workflow he won't use. Putting everything in the admin panel he already bookmarks keeps it in one place. Two tabs, one bookmark.

### Pedigree / Family Tree View
When enough lineage data is entered (sire/dam chains going back 2-3 generations), add a **"Pedigree" tab or expandable section** inside the animal's expanded card view. Show a simple 3-generation family tree:

```
                  ┌─ Grandsire (paternal)
        ┌─ Sire ──┤
        │         └─ Granddam (paternal)
Animal ─┤
        │         ┌─ Grandsire (maternal)
        └─ Dam ──┤
                  └─ Granddam (maternal)
```

This is the gold standard for breeder websites and registered cattle. Requires reference animals to be populated for ancestors not in the herd. Implementation: read the `sire`/`dam` chains from `cattle-data.json` and render a simple tree. No new data structure needed — the existing fields support it.

**Prerequisite:** At least a few animals need sire/dam fields populated with real data, and some reference animals added for outside genetics.

### Claude API Photo Classification
The photo pipeline already supports this (the `ANTHROPIC_API_KEY` secret slot exists). When enabled, photos uploaded as "General" get analyzed by Claude and auto-categorized into cattle/hunting/family/ranch/mascot folders. Costs ~2-3 cents per photo. Set up an Anthropic API key and add it as a GitHub repo secret to activate.

---

## Medium Priority — Quality of Life

### Dedicated Ranch Email
Set up `info@mrsummersranch.com` via Porkbun free email forwarding (20 forwards included with domain). Forward to Marty's personal email. Takes 2 minutes in Porkbun dashboard. For replies FROM the ranch domain, Porkbun hosted email is $24/year per mailbox. Update the contact page and site-config.json once set up.

### Dedicated Ranch Phone Number
Google Voice personal account — free, gives a local 209 area code number. Rings on Marty's existing iPhone via the Google Voice app. His real number stays private. If the ranch scales up and needs business texting, upgrade to Google Workspace + Voice at $10/month.

### Domain Strategy
Consider acquiring `summersranch.farm` or `mrs.farm` — either would be the ideal domain for a cattle operation. Check availability on Porkbun. Currently using `mrsummersranch.com` (primary) and `mrsranch.com` (redirect). The `.farm` TLD immediately communicates what the site is. Redirect whichever isn't primary.

### Brand Logo SVG
The MRS brand mark needs a proper vector trace. Steps:
1. Best source: photograph the actual brand iron on a plain white/gray background with good lighting
2. Upload to Vectorizer.AI (vectorizer.ai) — best AI tracer for this
3. Crop tight, max contrast before uploading
4. Hand the output SVG to Claude Code to clean up (smooth paths, remove fur texture noise)
5. Use the final SVG as: website logo, favicon, Open Graph image, and eventually business cards/hats/decals

### GitHub Organization
Create a GitHub org (e.g., `SummersRanchCA`), transfer the repo there. Separates personal GitHub profile from the ranch site. Free, 5-minute setup. Do this before sharing the repo URL publicly.

---

## Low Priority — Nice to Have

### Seasonal Hero Photos
The calendar system supports `hero_image` per season, but we only have one hero photo currently. Ideal set:
- `spring-calves.jpg` — calves in green pasture (calving season)
- `summer-pasture.jpg` — herd on summer grass (breeding season)
- `fall-roundup.jpg` — golden hills, fall colors (roundup season)
- `winter-ranch.jpg` — ranch in fog or frost (winter)

These can be taken throughout the year as the seasons happen. Upload via the shortcut as General, then Claude Code wires them into the calendar JSON.

### Print-Friendly Animal Pedigree
Generate a printable pedigree certificate from the expanded card view — PDF with the animal's photo, lineage chart, registration number, weights, and breed info. Useful when selling registered stock. Buyers often need a physical pedigree document. Build when the pedigree tree feature exists.

### Gallery Page Auto-Population
Currently the gallery page has hardcoded photos. Could be wired to auto-populate from `images/gallery/` the same way cattle cards populate from JSON. Lower priority since the gallery changes less frequently than the cattle page.

### Cattle Page Filters by Sex/Age
Add filter tabs beyond just "All / Breeding Stock / For Sale" — could include "Bulls," "Cows," "Heifers," "Calves" based on the `sex` and `born` fields. Only valuable once the herd is fully populated (20+ animals on the page).

### Offline Admin Panel
A stretch goal: make the admin panel work offline using a Service Worker. Marty could add animal data in the field with no service, and it syncs when he's back on WiFi. Complex to build, but would solve the no-cell-service problem for data entry (not just photos).

### Cattle Management Software Integration
Research found CattleMax, Herdwatch, and Breedr don't offer public APIs for website embedding. If Marty adopts one of these for professional tracking, the website remains a separate public-facing layer. Data flows one direction: Marty's records → admin panel → website. The professional software is the source of truth; the website is the storefront.

---

## Considered — Probably Not, But We Thought About It

Things we discussed, researched, and decided against for good reasons. Kept here so nobody rediscovers the idea and wastes time re-evaluating it from scratch.

### Google Calendar Sync via GitHub Action
**The idea:** Marty maintains a public Google Calendar. A weekly GitHub Action fetches the iCal feed and updates `ranch-calendar.json` automatically. Events flow from his phone's calendar app to the website with zero manual steps.

**Why we passed:** Marty uses a paper calendar. Adding a Google Calendar that he has to maintain alongside his paper one is adding a step, not removing one. The admin panel Calendar tab (see High Priority above) puts event management in the same place he already manages cattle — one bookmark, one login. If he ever does adopt Google Calendar as his primary planning tool, the pipeline is straightforward: public calendar feed → GitHub Action cron → parse iCal → merge into ranch-calendar.json → commit. The `google_calendar_id` field in `ranch-calendar.json` is reserved for this. The calendar spec at `docs/CALENDAR-SYSTEM-SPEC.md` has the full architecture documented.

### Embedding a Visible Calendar Widget
We explicitly decided against any calendar grid, month view, or embeddable calendar widget on the public site. They're always ugly, always feel corporate, and always have empty date squares that make a small operation look inactive. The seasonal banner + upcoming events approach achieves the same goal (making the site feel alive) without the downsides.

### .ag Domain (Antigua Country Code)
Some agricultural businesses use `.ag` as a domain hack. We considered it but passed — cattle buyers in Amador County won't intuit the connection, and it's technically Antigua's country code. `.farm` is the better TLD if we move off `.com`.

---

## Gallery Curation — Build When Photo Count Grows

Deferred from `docs/CLEANUP-SPEC.md` § 3. The gallery currently has ~17
photos and a flat grid works fine. Don't build this until there are 50+
photos in `gallery-data.json` and the page starts feeling like an
endless scroll.

**Recommended approach:**
- Add a `featured` boolean to `gallery-data.json` entries
- Gallery page shows only featured photos by default with a "Show all"
  toggle
- Add a Gallery tab to the admin panel (alongside Herd and Calendar)
  for toggling featured, reordering, and deleting
- For the About page hunting section: auto-select the most recent 2–3
  photos per year by reading `photo_dates` and grouping by year

The data layer is already in place — `gallery-data.json` exists,
captions and categories are populated by the classification pass. The
`featured` flag and admin UI are the only missing pieces.

---

## Completed (For Reference)

- ✅ Photo pipeline (GitHub Actions: resize, strip EXIF, route by prefix, auto-number)
- ✅ Metadata fingerprint dedup (survives iOS re-encoding, namespaced by cattle/gallery)
- ✅ Herd archive workflow (culled/deceased animals move to `images/archive/` + `data.archived[]`, with Restore button in admin)
- ✅ iOS Shortcut (3 categories: General, Cattle, Hunting)
- ✅ Dynamic cattle page (renders from cattle-data.json)
- ✅ Admin panel (password-protected, add/edit animals)
- ✅ Calendar/events system (banners, seasons, birthdays, upcoming)
- ✅ Birthday system merged into calendar
- ✅ Brand photo with lightbox
- ✅ Cattle tag auto-numbering pipeline
- ✅ Auto-population of cattle-data.json from pipeline
- ✅ All real photos, zero stock images
- ✅ Formspree contact form
- ✅ GitHub Pages hosting with custom domain
- ✅ mrsranch.com redirect to mrsummersranch.com
