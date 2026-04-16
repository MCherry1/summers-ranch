# Summers Ranch — Project Synopsis and History

*For the incoming agent. Read this first — it gives you the context that took weeks of iteration to develop.*

---

## What this project is

Summers Ranch (mrsummersranch.com, mrsranch.com redirects) is a website for a family cattle breeding operation in Sutter Creek, California. 40 head of registered Herefords on 160 acres. The site is a **surprise gift** from Mark (physicist, son-in-law, user you're talking with) to his recently-retired father-in-law Marty and mother-in-law Roianne.

The mascot is Theodore (Mark's son, born 2025-01-11), who appears on the site as "Junior Ranch Hand."

**The site has not been launched to Marty yet.** Everything that exists is prototype work. Every photo is a test photo. Every cattle record is placeholder data. There is no legacy that needs preserving. Start fresh.

---

## How we got here

### Phase 1 — "Just a brochure site"
Mark came to me wanting help building a simple website for his father-in-law. Initial scope: homepage, about page, contact, maybe show some of the cattle. Static HTML on GitHub Pages, no frameworks. I helped design the visual aesthetic ("Modern Homestead" — Cormorant Garamond + Lato, earth brown/gold/sage/cream palette).

### Phase 2 — "Actually, the cattle matter"
Mark realized the real value would be showing the cattle professionally. We built a cattle page driven by `cattle-data.json`, added cards with photos, lineage, status. Then an iOS Shortcut was designed so Marty could upload photos from his iPhone using Share Sheet. A GitHub Actions pipeline processed uploads: resize to 1200px, strip EXIF/GPS, auto-number, route by filename prefix. This worked and we expanded it.

### Phase 3 — "Actually, this needs an admin panel"
Marty shouldn't edit JSON. We built `admin.html` — encrypted password auth (PBKDF2 + AES-GCM), herd management, calendar management, photo review. It works via direct GitHub API calls from the browser using Marty's PAT. 3,677 lines of hand-written JS at this point.

### Phase 4 — "Actually, this should be a real professional operation"
Mark's conversations with Marty revealed he's a "lifestyle rancher" — loves the animals, hasn't seriously thought about running it as a business. Mark wanted the site to quietly nudge Marty toward professionalism. We added:
- Aspirational fields (calving ease, disposition scores, weights, registration numbers) shown empty in admin as "teaching moments"
- Industry-standard terminology throughout with tooltips explaining why each field matters to buyers
- Nudge system flagging missing essentials, stale photos, unbranded cattle
- Behavior-driven calendar detection from actual data
- AI photo classification (side-profile, headshot, etc.) via Anthropic API
- Smart cropping via bounding box detection
- Duplicate detection via EXIF fingerprinting

### Phase 5 — "The calf tagging system broke our model"
Real cattle operations: calves share their dam's tag number (different color) until weaning, then get their own tag. Our entire data model used tag as primary key. We wrote `CALF-LIFECYCLE-SPEC.md` and `CALF-EDGE-CASES.md` trying to work around this. Eight separate edge cases documented. This was the signal that the architecture needed to change.

### Phase 6 — Second opinion and the rebuild decision
Mark asked another agent to review the architecture. That agent correctly diagnosed:
1. Tag-as-primary-key is fundamentally wrong — need immutable `animalId`
2. Git repo as media inbox doesn't scale and has race conditions
3. `admin.html` at 3,677 lines of vanilla JS is maintenance risk
4. Astro + TypeScript + schema-first + object storage is the right rebuild target

I reviewed the other agent's recommendations and confirmed they're correct. We're rebuilding.

---

## What Marty actually does (core user workflow)

You must preserve this workflow through the rebuild:

1. Marty is on his iPhone in the pasture
2. He takes photos of cattle with his phone camera
3. Later (at WiFi), he opens Photos app, selects the photos
4. Taps Share → runs the "Summers Ranch — Cattle" shortcut
5. Shortcut asks "Tag number?" → he types `209` (number keyboard, big keys)
6. Shortcut asks "Calf number? Leave blank if adult" → he types blank or `1`/`2` for twins
7. Shortcut uploads to GitHub
8. Pipeline processes, photos appear on the cattle page within minutes

There's also a "Summers Ranch — General" shortcut for gallery photos. No tag input; the AI classifies.

**Marty has never typed a letter into the shortcut.** He uses number keyboards only. The pipeline uppercases and normalizes everything. This is non-negotiable UX.

---

## What the site does (four connected systems)

The final product is not one website — it's four systems that share a codebase:

1. **Public brand site** — home, about, gallery, contact. Family story, warm tone, ranch aesthetic.
2. **Public herd catalog** — cattle index page with cards, expanded detail pages with growth timelines, progressive disclosure.
3. **Private admin panel** — Marty's management interface, password-protected, edits through GitHub API.
4. **Media ingestion pipeline** — iPhone → inbox → classify → route → display. AI-assisted but admin-overridable.

---

## Key design principles established through iteration

### "Better empty than wrong"
We've been burned twice by defaults. If breed isn't set, don't show "Hereford." If status isn't set, don't assume "Breeding Stock." Empty fields are the honest state.

### "The admin panel is a teacher"
Empty fields on the admin panel (calving ease, disposition, registration number) are deliberate nudges toward best practices. Tooltips on every field explain industry context. Marty learns by using it.

### "Aspirational design"
Build for who Marty could become, not just who he is now. Track fields that professional seedstock operations track, even if Marty doesn't fill them yet.

### "Behavior over configuration"
Calving season is detected from when calves are actually added to the data, not from a calendar entry. Age classifications come from birth dates, not manual selection.

### "Privacy by default"
Sale details (who bought, for how much) are always private — never shown publicly. Acquisition details have a "show publicly" checkbox, unchecked by default. Public cattle page shows only what helps buyers.

### "Mobile-first but not mobile-only"
Marty uses an iPhone. Buyers use desktops for research. Both must feel intentional, not shrunken.

### "Calves get branded at weaning, not birth"
The branded-cattle nudge is persistent (can't be permanently dismissed, returns after 24 hours) — safety and legal concern. Doesn't count calves still nursing.

### "No emoji in UI copy"
Ranch aesthetic is serious/warm, not playful. Tooltips and labels use plain language.

---

## Industry knowledge baked into the specs

This has accumulated through research during development. The new agent should preserve this:

- **Year-letter codes** — International standard skips I, O, Q, V. 2024 = T, 2025 = U, 2026 = V-skipped → W
- **BIF disposition scale** — 1 Docile, 2 Restless, 3 Nervous, 4 Flighty, 5 Aggressive, 6 Very Aggressive
- **Calving ease scale** — 1–5 (1=unassisted, 5=abnormal presentation)
- **Adjusted weaning weight** — industry standard is 205-day adjusted
- **AHA registration** — American Hereford Association requires exact birth dates, not "Spring 2024"
- **Gestation** — ~283 days, overdue flag at 300
- **Three canonical buyer views** — side profile, headshot, three-quarter (in that priority order)
- **Sale methods** — Private Treaty, Auction, Consignment, Production, Online, Other
- **"Reference animals"** — outside sires/dams tracked for lineage only, no active herd presence

---

## What has been built (current prototype state)

**Working features on the live prototype site (all to be thrown away):**

- 8 HTML pages (index, about, cattle, gallery, contact, roadmap, admin, admin-setup)
- Admin panel with herd + calendar tabs, tooltips, nudges, swipe gestures
- iOS shortcuts (Cattle + General)
- GitHub Actions pipeline with AI classification, bounding box crop, duplicate detection, fingerprint dedup
- `cattle-data.json` driven rendering
- Calendar system (`ranch-calendar.json`) with seasonal detection, birthdays, events
- ~12 placeholder cattle entries, ~40 test photos

**What's been specced but not yet built:**
- Calf lifecycle system (CALF-LIFECYCLE-SPEC + CALF-EDGE-CASES)
- Acquisition/sale tracking (ACQUISITION-SALE-SPEC)
- Cleanup/archival (CLEANUP-SPEC)

**These specs contain valuable design thinking about data flow and UX, but their implementation details are obsoleted by the new architecture. The calf system in particular collapses to almost nothing once `animalId` is the primary key.**

---

## Technical context

**Repository:** https://github.com/MCherry1/summers-ranch

**Domains:**
- mrsummersranch.com (primary, GitHub Pages)
- mrsranch.com (301 redirect via Porkbun)
- Considering `summersranch.farm` as a future option

**Anthropic API:** `ANTHROPIC_API_KEY` is set as a GitHub repo secret. Mark has ~$5 in API credits plus $70 extra usage from Max 5x plan. Classification costs ~$0.02 per photo.

**PAT:** Mark has a Personal Access Token with workflow scope expiring periodically. He's comfortable regenerating as needed.

**GitHub Pages:** Current free hosting. Moving to Cloudflare Pages is the redesign plan.

**Communication tools available in the admin panel:**
- Google Voice phone number (planned, not yet set up)
- Formspree form for contact (active, ID: mzdybyjl)
- Email: info@mrsummersranch.com

---

## Things that have broken and why (so you don't repeat them)

**Race conditions on git push** — GitHub Actions pipeline and admin panel both push to main. Workflow has `git pull --rebase` + 3-attempt retry loop. Still occasionally fails under heavy concurrent editing.

**Filenames with spaces** — GitHub API truncates at the first space during upload. Marty once entered "Candy Corn" as a tag, lost most of the photos. Pipeline now sanitizes spaces → hyphens defensively, but the real fix was in the shortcut.

**Tag case inconsistency** — Marty's shortcuts produced mixed case (`Ty124`), admin created uppercase, pipeline was inconsistent. Settled on always-uppercase (industry standard) with normalization at every input.

**Default field assumptions** — Twice we shipped with defaults like `breed: 'Hereford'` and `status: 'breeding'`. Both caused problems when Marty created records for animals that weren't either. Everything defaults to blank now.

**Unextensioned files** — iPhone sometimes delivers files without .jpg extension. Pipeline now catches and adds extension.

**Calf tagging edge cases** — Eight documented edge cases in `CALF-EDGE-CASES.md`, all artifacts of the tag-as-key design. The new architecture eliminates most of these structurally.

---

## What Marty is like

Never met him, but from Mark's descriptions:

- Lifelong ranch hand, now retired, wanted to run his own ranch his whole life
- Loves the animals and the lifestyle deeply
- Keeps excellent paper records (vaccinations, hereditary info)
- Doesn't think of it as a business yet, but the site is designed to help him make that transition
- Iphone-literate, not tech-literate beyond that
- Very smart, but won't read manuals — he learns by doing
- Appreciates craftsmanship and thoughtfulness

The site needs to feel like a gift, not a tool. Which is literally what it is.

---

## What you should do first

1. Read `RECOMMENDED-ARCHITECTURE.md` — the consolidated direction document
2. Read `BEHAVIOR-PRESERVATION-CHECKLIST.md` — every feature that must work after the rebuild
3. Read `PHASE-1-IMPLEMENTATION.md` — what to build first
4. Look at the current `admin.html` and `cattle.html` to understand the UX intent we achieved
5. Talk to Mark. He's capable at directing product but not a web developer. He'll have strong opinions about UX and be delegating heavily on technical architecture.

The previous agent (me) did a lot of work on this. You'll find references to "the previous agent" or "the first agent" in conversation. That's me. I'm being rotated out because the context is getting heavy and a fresh perspective will serve the rebuild better. I'm not sore about it — this is the right call.

Good luck. Build something beautiful.
