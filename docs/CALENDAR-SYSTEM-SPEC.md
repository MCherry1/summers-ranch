# Ranch Calendar & Seasonal Content System — Design Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## Philosophy: What This Is NOT

This is NOT a calendar. No calendar grid. No month view. No empty date squares. No "add to calendar" buttons. No iCal embed. No Google Calendar widget. Those are always ugly and always feel like afterthought corporate tools crammed onto a website that doesn't need them.

## Philosophy: What This IS

A **data-driven content engine** that makes the site feel alive and current without anyone manually updating HTML. One JSON file controls everything — banners, seasonal text, hero photo swaps, birthday messages, and an "upcoming" section. The site reads today's date and shows the right content automatically.

**Design inspiration to study:**

- **PAX (paxsite.com):** Their homepage shows only the NEXT event with a date and CTA. After an event ends, it flips to "SEE YOU NEXT YEAR" with next year's dates. Clean, contextual, automatic. No calendar grid anywhere.
- **Wineries (Long Meadow Ranch, Domaine Carneros):** The best winery sites rotate seasonal content — harvest updates in fall, tasting room hours in summer, holiday gift guides in December. It feels alive because it changes with the seasons, but it's driven by scheduled content, not manual updates.
- **Apple product launches:** A single announcement bar across the top. Appears when there's something to say. Disappears when there isn't. Never tacky.

**The Summers Ranch version of this:** A visitor comes to the site in March and sees "Calving season is underway — new arrivals coming soon!" in a warm banner. In October, the hero photo is golden fall pastures and there's a note: "Fall calves are ready — call about availability." In December, it's quiet — just the ranch in winter. On Marty's birthday, a celebratory banner slides in. Before a sale event, an announcement appears 30 days out. The site breathes with the seasons and the ranch's rhythm.

---

## Architecture: One JSON Rules Everything

Merge the existing birthday system (`#birthdayData` div in index.html) and the new `ranch-calendar.json` into a single unified file. Delete the hardcoded birthday divs from HTML. Everything reads from one source.

### `ranch-calendar.json` Structure

```json
{
  "birthdays": [
    {
      "name": "Marty",
      "date": "MM-DD",
      "role": "owner",
      "message": "Happy Birthday to Marty from the Summers Ranch family!"
    }
  ],

  "seasons": [
    {
      "name": "Calving Season",
      "start": "MM-DD",
      "end": "MM-DD",
      "banner": "Calving season is underway — new arrivals coming soon!",
      "hero_image": "images/hero/spring-calves.jpg",
      "status_text": "Calves are hitting the ground at Summers Ranch.",
      "priority": 2
    }
  ],

  "events": [
    {
      "name": "Spring Sale",
      "date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "type": "sale|hunting|general",
      "banner": "Spring sale cattle available — call for details.",
      "advance_days": 30,
      "during_text": "We're at sale today!",
      "after_text": null,
      "show_in_upcoming": true,
      "priority": 3
    }
  ],

  "meta": {
    "last_updated": "ISO date",
    "google_calendar_id": "optional — for future sync"
  }
}
```

**Priority system:** When multiple things overlap (birthday + calving season + sale event), highest priority number wins for the banner slot. Birthdays always win (priority 10). Events trump seasons. Only ONE banner shows at a time — never stack them.

---

## What the System Drives (5 Outputs)

### 1. Banner Strip (all pages)

A thin, tasteful bar that appears at the top of the page when there's something to announce. Gold/saddle gradient background, single line of white text, centered. Same style as the existing birthday banner.

**Shows when:**
- It's someone's birthday (priority 10)
- An event is happening right now or within its `advance_days` window (priority 3)
- A season with a non-null `banner` field is active (priority 2)

**Shows nothing when:** There's no active birthday, event, or banner-worthy season. The site looks completely normal. No empty banner. No "nothing to see here." It simply doesn't render.

**Implementation:** Single `<div id="siteBanner">` at the top of every page, hidden by default. JavaScript reads the JSON, evaluates what's active, picks the highest-priority item, and shows or hides accordingly. Same CSS as the existing birthday banner.

### 2. Seasonal Hero Photo (home page only)

The hero section background image changes based on the current season. If a season has a `hero_image` specified and that file exists, use it. Otherwise, use the default hero image.

**Implementation:** The hero `background-image` is set via JavaScript after reading the JSON. Add a graceful fallback — if the seasonal image fails to load, keep the default.

### 3. "On the Ranch" Status Line (home page only)

A single sentence below the intro section that says what's currently happening. Reads the `status_text` from the active season.

**Design:** Small text, italic, centered, muted color. Think of it as a caption or a whispered aside. Example: *"Calves are hitting the ground at Summers Ranch."* When no season has status text, this element hides.

### 4. Upcoming Section (home page or roadmap page)

A small "Coming Up" section that lists events in the next 90 days. NOT a calendar grid. Style it like the roadmap milestones — clean timeline dots with a title and date.

**Shows only when:** There are events in `events[]` with `show_in_upcoming: true` and a date within the next 90 days.

**Shows nothing when:** No upcoming events. The section doesn't render at all. No "nothing coming up" message. Just absent.

**Design reference:** Look at how the existing `roadmap.html` milestones are styled — dot, title, date, one-line description. Use that same aesthetic but smaller/more compact.

### 5. Birthday Messages (all pages, same as current)

Merge the existing birthday system into this. Same behavior, same style — just read from `ranch-calendar.json` instead of hardcoded HTML `data-` attributes. Auto-age calculation for Theodore stays.

---

## What the System Does NOT Do

- No calendar grid. Ever.
- No month/week/day views.
- No "add to calendar" buttons.
- No event detail pages. Events are one-liners.
- No countdown timers. Those feel desperate.
- No auto-scrolling carousels of events. Static, contextual, one thing at a time.
- No empty states. If there's nothing to show, show nothing.

---

## Google Calendar Integration (Future — Do NOT Build Now)

This is documented for later implementation. The idea:

1. Marty creates a Google Calendar called "Summers Ranch"
2. He makes it public (Settings → Access permissions → Make available to public)
3. A GitHub Action runs weekly, fetches the public iCal feed, parses it, and updates `ranch-calendar.json` with any new events
4. Events from Google Calendar get tagged with `type: "general"` and `show_in_upcoming: true`
5. The site picks them up on next page load

**Why not build this now:** The ranch only has a handful of events per year. Manually updating the JSON (or having Claude Code do it) is faster and simpler until the volume justifies automation. Document the Google Calendar ID field in the JSON and the pipeline concept, but don't build the Action yet.

**Alternative for now:** The builder (you, the son-in-law) can tell Claude Code "add the spring sale for May 10" and it updates the JSON in 10 seconds. Or update it yourself — it's one JSON file with obvious fields.

---

## Implementation Steps for Claude Code

1. **Create `ranch-calendar.json`** with the structure above. Populate with:
   - Existing birthday data (Marty 05-20, Roianne 06-28, Theodore 01-11)
   - Approximate ranch seasons (calving Feb-Apr, breeding Jun-Aug, fall roundup Sep-Nov, winter Nov-Feb)
   - No specific events yet (the family will add these)

2. **Create a shared JavaScript module** (or inline script) that:
   - Fetches `ranch-calendar.json` on page load
   - Evaluates today's date against all entries
   - Determines: active birthday? active event? active season?
   - Picks the highest-priority banner (if any)
   - Returns: `{ banner, heroImage, statusText, upcoming[], mascotAge }`

3. **Update every page** to include the banner div and load the script:
   - `index.html` — banner + hero swap + status line + upcoming section
   - `about.html` — banner only
   - `cattle.html` — banner only
   - `gallery.html` — banner only
   - `contact.html` — banner only
   - `roadmap.html` — banner + upcoming section (or merge upcoming into roadmap)

4. **Remove the old birthday system** — delete the `#birthdayData` div and the birthday-specific JavaScript from `index.html`. The new unified system replaces it entirely.

5. **Test with date overrides** — add a `?date=2026-03-15` URL parameter that overrides today's date for testing. This lets you verify that calving season banner shows in March, birthday banner shows on the right day, etc. Remove or disable this in production if desired, or keep it for debugging.

---

## Content Guidance

When populating the JSON, keep these tone guidelines:

- **Banners:** One sentence. Warm but informational. End with an action if appropriate ("call for details"). No exclamation marks except birthdays.
- **Status text:** Reads like a quiet observation. *"The herd is wintering on stockpiled grass."* Not *"IT'S WINTER ON THE RANCH!!"*
- **Event names:** Plain English. "Spring Sale" not "MEGA SPRING CATTLE BLOWOUT."
- **Birthday messages:** Celebratory but not over the top. The existing messages are the right tone.

---

## File Locations

- `ranch-calendar.json` — root of repo, alongside `cattle-data.json`
- JavaScript can be inline in each page (simplest) or in a shared `js/ranch-calendar.js` file (cleaner but adds an HTTP request)
- Hero images for seasons go in `images/hero/` with descriptive names

---

## How Updates Happen Long-Term

| Who | What | How |
|-----|------|-----|
| Nobody | Seasons change, banners rotate | Automatic — dates in the JSON drive everything |
| Nobody | Birthdays show | Automatic — dates in the JSON |
| Nobody | Upcoming events appear/disappear | Automatic — within 90 days they show, after they pass they hide |
| Marty (future) | Add a sale date | Admin panel adds it to the JSON, or texts the builder |
| Builder | Add/edit events | Tell Claude Code "add the elk hunt for October 15-22" or edit JSON directly |
| GitHub Action (future) | Sync from Google Calendar | Weekly cron pulls public calendar feed → updates JSON |

The whole point is that 95% of the time, nobody does anything. The site just works.
