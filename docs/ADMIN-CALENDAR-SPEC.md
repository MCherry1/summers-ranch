# Admin Panel — Calendar Management Tab Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## Overview

Add a **Calendar** tab to the admin panel alongside the existing **Herd** tab. Same page, same login, same bookmark. Marty manages both cattle and ranch events from one place.

The Calendar tab reads and writes to `ranch-calendar.json` via the GitHub API, using the same pattern the Herd tab uses for `cattle-data.json`.

---

## Tab Navigation

Add a tab bar at the top of the panel (below the topbar, above the content):

```
┌──────────────────────────────────┐
│  [ 🐄 Herd ]    [ 📅 Calendar ] │
└──────────────────────────────────┘
```

- Two tabs: **Herd** (default, existing cattle management) and **Calendar**
- Same visual style as the filter tabs on the public cattle page — pill buttons, active state has `var(--earth)` background
- Switching tabs swaps the visible content below. No page reload.
- The URL should update with a hash (`admin.html#herd` / `admin.html#calendar`) so Marty can bookmark directly to the calendar tab if he wants
- Touch targets: minimum 44px height, full width on mobile

---

## Calendar Tab Layout

```
┌──────────────────────────────────────┐
│  + Add New Event          (button)   │
│                                      │
│  ─── Upcoming ───                    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Spring Sale                    │  │
│  │ May 10, 2026                   │  │
│  │ Banner starts: 30 days before  │  │
│  │ [Edit]  [Copy to Next Year]    │  │
│  │                       [Delete] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Amador County Fair             │  │
│  │ Oct 4–6, 2026                  │  │
│  │ Banner starts: 30 days before  │  │
│  │ [Edit]  [Copy to Next Year]    │  │
│  │                       [Delete] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ─── Past Events ───                 │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Red Bluff Bull Sale            │  │
│  │ Jan 25, 2026 (passed)          │  │
│  │ [Copy to Next Year]   [Delete] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ─── Seasons ───                     │
│  (read-only summary of active        │
│   seasons from ranch-calendar.json)  │
│                                      │
│  ─── Birthdays ───                   │
│  (read-only list, editable inline)   │
│                                      │
└──────────────────────────────────────┘
```

---

## "Add New Event" Flow

Tapping the button reveals an inline form (same pattern as "Add Animal" on the Herd tab — appears at the top, pushes the list down).

### Event Creation Form

```
┌──────────────────────────────────────┐
│  New Event                           │
│                                      │
│  Event Name *                        │
│  [ Spring Sale                     ] │
│                                      │
│  Category                            │
│  [ Sale ▾ ]                          │
│                                      │
│  Start Date *          End Date      │
│  [ 2026-05-10 ]       [ 2026-05-10 ]│
│                                      │
│  Advance Warning (days)              │
│  [ 30 ]                              │
│                                      │
│  Banner Text (before event)          │
│  [ Spring sale cattle available —  ] │
│  [ call for details.               ] │
│                                      │
│  Banner Text (during event)          │
│  [ We're at the spring sale today  ] │
│  [ — stop by and say hello!        ] │
│                                      │
│  Show in Upcoming section?           │
│  [✓]                                 │
│                                      │
│  [ Cancel ]        [ Create Event ]  │
└──────────────────────────────────────┘
```

### Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Event Name | Yes | Text input | e.g., "Spring Sale", "Amador County Fair" |
| Category | No | Dropdown | Sale, Show/Expo, Auction, Ranch Event, General |
| Start Date | Yes | Date picker | ISO format. Use `<input type="date">` for native mobile date picker |
| End Date | No | Date picker | If blank, event is single-day. If set, banner shows through this date |
| Advance Warning | No | Number input | Days before start date to show the banner. Default: 30. Set 0 for day-of only. |
| Banner Text (before) | No | Textarea | Shown during the advance warning window. If blank, no pre-event banner. |
| Banner Text (during) | No | Textarea | Shown on the event date(s). Overrides "before" text. If blank, "before" text continues. |
| Show in Upcoming | No | Checkbox | Default checked. If checked, appears in the public "Upcoming" section on the home page. |

### Category Dropdown Options

```
Sale
Show / Expo
Auction
Ranch Event
General
```

Categories are for organization and display. They don't change behavior — the banner and timing fields control everything. Categories could be used later for filtering or icon display.

### Input Validation

- Event Name is required. Show a red border and "Event name is required" if blank on submit.
- Start Date is required. Same validation treatment.
- End Date must be >= Start Date if provided.
- Advance Warning defaults to 30 if left blank. Must be a non-negative number.
- Banner text fields are optional but recommended. If both are blank, the event still shows in the Upcoming section but has no banner.

---

## Event Cards

Each event in the list is a card showing:

- **Event name** (bold, large)
- **Date** — formatted nicely: "May 10, 2026" or "Oct 4–6, 2026" for multi-day
- **Category** — small pill badge (same style as animal status badges)
- **Banner preview** — small muted text showing what the banner will say
- **Days until** — "In 26 days" or "3 days ago" or "Today!"

### Event Card Actions

| Button | Behavior |
|--------|----------|
| **Edit** | Expands the card into an inline edit form (same fields as creation). Save or Cancel. |
| **Copy to Next Year** | Creates a new event with the same name, category, warning days, and banner text, but with dates shifted forward by 1 year. Opens as a new edit form so Marty can adjust dates if needed before saving. |
| **Delete** | Confirmation dialog: "Delete [Event Name]? This cannot be undone." → Yes, Delete / Cancel. |

### Upcoming vs. Past

- **Upcoming:** Events where `start_date >= today` OR `end_date >= today`. Sorted by start date ascending (soonest first).
- **Past:** Events where `end_date < today` (or `start_date < today` if no end date). Sorted by start date descending (most recent first). Show the 10 most recent. "Show more" link expands to show all.
- Past event cards are visually muted (reduced opacity, no "Edit" button — only "Copy to Next Year" and "Delete").

---

## Seasons Section (Read-Only)

Below the events list, show a summary of the hardcoded seasons from `ranch-calendar.json`:

```
─── Seasons ───

  Calving Season     Feb 15 – Apr 30
  Breeding Season    Jun 1 – Aug 31
  Fall Roundup       Sep 15 – Nov 15
  Winter             Nov 16 – Feb 14

  Currently active: Calving Season ●
```

Seasons are NOT editable through this UI for now. They're stable year-over-year and rarely change. If they need editing, Claude Code can update the JSON directly. The display here is just so Marty can see what's configured.

Show a green dot next to the currently active season.

---

## Birthdays Section

Below seasons, show the birthday list from `ranch-calendar.json`:

```
─── Birthdays ───

  Marty        May 20     🎂
  Roianne      Jun 28     🎂
  Theodore     Jan 11     🎂 (turns 2 next birthday)
```

Each birthday is **editable inline** — tap the name or date to edit. This is simple enough that a full edit form isn't needed. Tap, change, tap save.

An **"Add Birthday"** link at the bottom opens a minimal inline form: Name, Date (MM-DD), Message. This is for adding new family members, new ranch hands, etc.

---

## Data Flow

The Calendar tab reads and writes `ranch-calendar.json` via the GitHub API:

1. **On load:** Fetch `ranch-calendar.json` from the repo (same `GET /repos/.../contents/ranch-calendar.json` pattern as cattle-data)
2. **On save:** Encode the updated JSON, PUT to the repo with the file's SHA (same commit pattern as cattle-data saves)
3. **Commit message:** "Update ranch calendar: [action]" — e.g., "Update ranch calendar: add Spring Sale", "Update ranch calendar: delete Red Bluff Bull Sale"

### Event → JSON Mapping

The form fields map directly to the event objects in `ranch-calendar.json`:

```json
{
  "name": "Spring Sale",
  "date": "2026-05-10",
  "end_date": "2026-05-10",
  "type": "sale",
  "banner": "Spring sale cattle available — call for details.",
  "during_text": "We're at the spring sale today — stop by and say hello!",
  "advance_days": 30,
  "show_in_upcoming": true,
  "priority": 3
}
```

- `type` maps from the Category dropdown: Sale→`sale`, Show/Expo→`show`, Auction→`auction`, Ranch Event→`ranch`, General→`general`
- `priority` is always 3 for events (the calendar JS handles priority resolution)
- `during_text` maps from "Banner Text (during event)"
- `banner` maps from "Banner Text (before event)"

---

## Security Note

The Calendar tab is behind the same password gate as the Herd tab. No additional authentication needed. The `noindex` meta tag on admin.html keeps it out of search engines.

**Reminder from the calendar spec:** NEVER add events that indicate the ranch is unattended (hunting trips, vacations, travel). The calendar is for business events only. This note should appear as a small muted reminder at the top of the Calendar tab:

*"Only add ranch business events here. Don't post travel or time away from the ranch."*

---

## Mobile-First Design

Everything on this tab should be usable on an iPhone with big fingers:

- All touch targets minimum 44x44px
- Date inputs use `<input type="date">` for native mobile date pickers (no custom date picker widgets)
- Number input for advance warning uses `<input type="number" min="0" max="90">` with native stepper
- Textareas are tall enough to show 2 lines without scrolling
- Buttons are full-width on mobile
- Edit forms expand inline — no modals or popups that might be hard to dismiss on mobile

### Swipe Gestures

Support swipe left/right to switch between Herd and Calendar tabs. This is standard mobile web behavior and does NOT require a native app — touch events work in all modern mobile browsers.

**Implementation:**
```javascript
// Track touch start and end positions
let touchStartX = 0;
panel.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
panel.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 80) {  // minimum 80px swipe
        if (diff > 0) switchTab('herd');    // swipe right → Herd
        else switchTab('calendar');          // swipe left → Calendar
    }
});
```

- Minimum swipe distance: 80px (prevents accidental triggers when scrolling)
- Swipe right → Herd tab (the "back" direction)
- Swipe left → Calendar tab (the "forward" direction)
- Add the same swipe support to the expanded cattle card view for swiping between animal photos
- Optional: subtle slide animation on tab transition (CSS `transform: translateX`) to reinforce the spatial metaphor

---

## Implementation Priority

1. ✅ **Tab navigation** — Herd/Calendar tab bar with hash routing and swipe gestures
2. ✅ **Calendar tab skeleton** — Event list rendered from `ranch-calendar.json`
3. ✅ **Add New Event form** — Inline form with every field from the spec
4. ✅ **Edit/Delete/Copy** — Inline edit form, confirm-delete dialog, copy-to-next-year
5. ✅ **Seasons and Birthdays** — Read-only seasons, editable birthdays
6. ✅ **Birthday editing** — Tap-to-edit rows + "Add Birthday" inline form

---

## Implementation Notes

All six priority items shipped together in `admin.html`. Code locations:

### DOM structure
- `<div class="admin-tabs">` contains `[🐄 Herd]` / `[📅 Calendar]` pill
  buttons. The existing herd content is wrapped in
  `<div class="admin-tab-pane" id="tabHerd">`, and the new calendar content
  lives in `<div class="admin-tab-pane" id="tabCalendar">`.
- Calendar pane sections: business-only reminder, `+ Add New Event` button,
  `#newEventCard`, `#calUpcomingSection`, `#calPastSection` with a
  `Show more` toggle, `#calSeasonsSection` (read-only), and
  `#calBirthdaysSection`.

### JS — shared plumbing
- `CALENDAR_PATH` + `CALENDAR_API_URL` + `calendarData` / `calendarSha` /
  `calendarLoaded` state. Parallel to the cattle-data equivalents.
- `loadCalendarData()` / `commitCalendarData(mutator)` — same shape as the
  existing cattle helpers. Commit messages start with
  `Update ranch calendar: ...` so the repo history is readable.
- Sign-out flow clears `calendarData`/`calendarSha`/`calendarLoaded` so a
  re-login reloads cleanly.

### Tab switching + swipe + hash routing
- `switchTab(tab)` updates the active pill, toggles pane visibility, writes
  `#herd` / `#calendar` to the URL with `history.replaceState`, and lazy-
  loads `ranch-calendar.json` on the first visit to the calendar tab.
- `hashchange` listener honors back/forward navigation.
- The boot and unlock flows re-trigger `switchTab('calendar')` if the
  current URL hash is `#calendar` so deep-linking works across the
  password gate.
- Swipe detection on `#panel`: 80px minimum horizontal delta, must
  dominate vertical delta (1.5×) so diagonal scrolls don't trigger. Swipe
  left → Calendar, swipe right → Herd.

### Event rendering
- `renderCalendar()` splits events into upcoming / past using
  `end_date || date`, sorts upcoming ascending and past descending, then
  delegates to `renderEventList` / `renderPastEvents` / `renderSeasons` /
  `renderBirthdays`.
- Past events render at 0.72 opacity via `.cal-event-card.past`. Only
  upcoming events get the `[Edit]` button per spec; past events can be
  copied or deleted.
- `whenPhrase(ev)` produces `"Today!"` / `"Tomorrow"` / `"In N days"` /
  `"N days ago"` with `.today` / `.soon` colour states for the upcoming row.
- `formatEventDate(start, end)` handles single-day, same-month range,
  same-year range, and multi-year ranges with a nice en-dash.

### Event form
- `buildEventForm(initial, { title, submitLabel, onSave, onCancel })` is
  shared between the "New event" inline card and the inline edit slot on
  each event card.
- Inputs map 1:1 to the spec's fields. The Category dropdown feeds
  `type` (sale/show/auction/ranch/general). Start/end are
  `<input type="date">` for native pickers on mobile; advance days is
  `<input type="number" min="0" max="365">`.
- Validation: event name required, start date required, end date must be
  ≥ start date when present. Invalid fields get a red border and an
  `.invalid-note` that slides in below.
- `formToEvent(form, existing)` normalizes payloads (`end_date` defaults
  to `date`, `priority` is always 3, `show_in_upcoming` defaults to true).

### Event actions
- **Edit** → `openInlineEdit(card, ev)` hides the card summary and mounts
  the edit form in a slot inside the card. Save commits and re-renders.
- **Copy to Next Year** → `copyEventToNextYear(ev)` clones the event with
  dates shifted forward by one calendar year (`isoShiftOneYear`), commits,
  and scrolls the Upcoming section into view so the copy is visible.
- **Delete** → `deleteEvent(ev)` uses `window.confirm("Delete ...?")`, then
  splices the event out and commits with
  `Update ranch calendar: delete <name>`.

### Seasons (read-only)
- `renderSeasons()` walks `calendarData.seasons` and renders one row per
  season. `isSeasonActive()` handles both normal and wrap-around ranges
  (e.g., Winter 11-16 → 02-14). The currently-active season gets the
  green dot + subtle sage tint via `.cal-season-row.active`.

### Birthdays
- `renderBirthdays()` builds tap-to-edit rows. Mascot rows compute
  "turns N next birthday" from the stored `year`.
- Tapping a row calls `openBirthdayEdit(row, birthday, idx)` which swaps
  the row contents for inline inputs (name + MM-DD) and Save/Cancel
  buttons. MM-DD is validated with `/^\d{2}-\d{2}$/`.
- The `+ Add Birthday` button reveals `#newBirthdayForm` with Name, Date
  (MM-DD), Role (owner/family/mascot), and an optional message. Commits
  with `Update ranch calendar: add birthday <name>`.
