# CLAUDE.md — Summers Ranch Website

## Project Overview

This is a static cattle ranch website for **Summers Ranch** (mrsummersranch.com). It's a brochure site for a family-owned cattle breeding operation (not slaughter — they breed, track lineage, and sell at auction or private treaty). The herd is 40–100 head.

Hosted on **GitHub Pages** with a custom domain via Porkbun. No build tools, no framework — pure HTML/CSS/vanilla JS. The domain `mrsranch.com` redirects to `mrsummersranch.com`.

---

## IMPORTANT CONTEXT: This Is a Surprise

The site is being built as a **surprise gift** by the ranch owners' son-in-law. The ranch owners (M and R) do NOT know this is being built yet. This means:

- **The builder has:** Family photos, photos of his son (the mascot), some generic cattle/ranch photos grabbed quietly, possibly some videos of calves and ranch scenery. He knows the family well and can provide ranch story content, names, birthdays, location, contact info.
- **The builder does NOT have:** Specific cattle tag numbers, lineage/pedigree data, individual animal details, breeding records, or which animals are currently for sale. Only M and R have that.
- **The goal:** Launch a polished, complete-looking site that M and R can be proud of immediately, with a clear and easy path for them to add their cattle-specific data later.

### What This Means for Implementation

**DO NOT create fake cattle data.** No placeholder tag numbers, no made-up lineage, no dummy animal cards with "[Bull Name]" text. That would look wrong to cattle people and be awkward to undo.

**Instead, build the site in two phases:**

---

## Phase 1: Surprise Launch (Build This Now)

This is what gets built with available content. It should look FINISHED, not like a work-in-progress.

### What the builder CAN provide (ask for these):

**Ranch basics:**
- Ranch name (confirm "Summers Ranch"), tagline, year established
- Location (city, state, street address, zip)
- Phone, email
- Cattle breed(s) — he knows what they raise generally
- Approximate herd size
- Social media URLs

**Family info:**
- M's name, role, birthday, brief bio
- R's name, role, birthday, brief bio
- Son's first name, birthday (for auto-age + birthday banner)
- Family photos and mascot photos — he has these

**Ranch story:**
- He knows the family well enough to draft the About page story
- Philosophy, values, how long they've been ranching
- Offer to help write the prose from bullet points

**General cattle/ranch photos:**
- Herd-at-a-distance shots, pasture scenery, calves, ranch life
- These go in `images/gallery/` and `images/hero/` — NOT `images/cattle/`
- Any videos (calves nursing, ranch scenery) can be uploaded to YouTube and embedded

**Contact form & map:**
- Formspree ID (he sets this up)
- Google Maps embed URL

### How to Handle the Cattle Page (Phase 1)

The cattle page should NOT show individual animal cards. Instead, build it as a **herd overview page**:

1. **Banner photo** of the herd (general, no specific animals)
2. **Herd overview text** — what breeds they raise, their breeding philosophy, herd size, that they sell via auction and private treaty
3. **Photo gallery strip** — 4–6 nice cattle photos in a grid, presented as the herd generally (NOT as "Tag #189" individual cards)
4. **"Interested?" CTA** — "We sell breeding stock and sale cattle throughout the year. Give us a call to ask about current availability." with phone number and link to contact page
5. **NO individual animal cards, no tag numbers, no lineage data**

This looks intentional and professional — many small ranch sites present their cattle this way. It doesn't look unfinished.

### Pages for Phase 1:
- **Home:** Full build with hero, intro, cards, mascot section, contact bar ✅
- **About:** Full build with story, philosophy, family grid ✅
- **Cattle:** Herd overview + photo gallery + contact CTA (NO individual cards) ⚠️ REBUILD THIS
- **Gallery:** Ranch/cattle/landscape photos + video embeds ✅
- **Contact:** Full build with info, form, map ✅

---

## Phase 2: Owner Handoff (After the Surprise)

After M and R see the site and are excited about it, the builder will show them how to add their cattle data. This is when:

1. **Individual animal cards get added** to the cattle page
2. Each animal gets: tag number, name, birth date, sire/dam, breed, status, photo
3. The filterable grid (breeding stock / for sale) gets activated
4. The iOS Shortcut (see `docs/IOS-SHORTCUT-GUIDE.md`) gets set up on their phones for uploading cattle photos directly
5. They may also want to revise the About page text, update the tagline, etc.

### To prepare for Phase 2, make sure:
- The animal card CSS and HTML template exist in the code as a **commented-out section** with clear instructions
- The filter tabs (All / Breeding Stock / For Sale) are built but **hidden** until Phase 2
- `site-config.json` has the empty cattle array ready to populate
- Animal cards support **multiple photos per animal** — tapping a card opens a mini gallery
- There's a comment in `cattle.html` that says something like:
  ```html
  <!-- PHASE 2: Individual animal cards go here.
       See site-config.json for the data format.
       Each card needs: tag, name, born, sire, dam, breed, status, photo.
       Uncomment the filter tabs above when adding cards. -->
  ```

### Multi-Photo Naming Convention (for cattle)

Each animal can have multiple photos. Naming convention:
```
tag-189-1.jpg       (primary photo — shown on the card)
tag-189-2.jpg       (additional angle)
tag-189-3.jpg       (additional angle)
```

Or with descriptive suffixes:
```
tag-189-front.jpg
tag-189-side.jpg
tag-189-calf.jpg
```

The iOS Shortcut (cattle variant) asks for tag number then photo number/description, and builds the filename automatically.

On the site: the animal card shows the `-1` (or first found) image as the primary. Clicking/tapping the card opens a lightbox that cycles through all photos for that tag number. Claude Code should build the card component to support this in the commented-out Phase 2 code.

---

## Birthday System (All Family Members)

The site has a family-wide birthday banner. In `index.html` there's a hidden `#birthdayData` div with a `<span>` per person:

```html
<div id="birthdayData" style="display:none">
    <span data-name="M" data-birthday="YYYY-MM-DD" data-role="owner"></span>
    <span data-name="R" data-birthday="YYYY-MM-DD" data-role="owner"></span>
    <span data-name="Son" data-birthday="YYYY-MM-DD" data-role="mascot"></span>
</div>
```

On page load, JS checks every entry:
- `data-role="mascot"` also auto-calculates age for the mascot section heading
- If today is anyone's birthday, a gold banner slides in at the top
- Owners get: "Happy Birthday to [Name] from the Summers Ranch family!"
- Mascot gets: "Happy Birthday to our Junior Ranch Hand, [Name]!"
- Multiple same-day birthdays combine names

When gathering content, **ask for all family member birthdays** and populate both this div and the `birthday` fields in `site-config.json`.

---

## Content Gathering (What to Ask the Builder)

Walk through these conversationally. Remember — he's NOT a rancher, he's a physicist/tech person married into the family. He knows the family well but doesn't have cattle-specific operational data.

### Step 1 — Ranch Basics
Ranch name, tagline, year established, location, phone, email, breed(s), herd size, selling method, social media.

### Step 2 — Family Members
M and R's first names, roles, birthdays, bios. He can describe them and you can draft bios.

### Step 3 — Mascot
Son's first name (first name only on the public site), birthday (YYYY-MM-DD), what he does on the ranch. The builder has photos of his son.

### Step 4 — Ranch Story
Draft the About page together. He can give you the broad strokes — how long they've ranched, what they care about, their approach — and you write the polished prose.

### Step 5 — Photos
- Family portraits → `images/about/`
- Mascot photos → `images/mascot/`
- Generic cattle/ranch photos → `images/gallery/` and `images/hero/`
- He may upload via the iOS Shortcut (see `docs/IOS-SHORTCUT-GUIDE.md`) or via GitHub directly

### Step 6 — Contact & Map
Formspree form ID for the contact form. **No exact address or Google Maps embed** — for ranch security (livestock/equipment theft, trespassing), use town and county only. The contact page should say something like "Located in [Town], [County] County, [State]. Call us for directions — visitors welcome by appointment." The ranch owners can choose to add a map later in Phase 2 if they want.

### Step 7 — DO NOT Ask For
- Individual cattle tag numbers (he doesn't have them)
- Lineage/pedigree data (only the owners know this)
- Which animals are for sale (changes constantly)
- Breeding records, health records, etc.

---

## Image Requirements

- **Hero/banner:** 1920px wide, WebP or JPEG, < 250KB
- **Cattle/gallery photos:** 800px wide, < 100KB
- **Portraits:** 500px wide for circle crops
- Use `loading="lazy"` below the fold
- GitHub repo limit: 1GB total — optimize aggressively
- Strip EXIF/GPS data from all photos (privacy)

If user provides raw photos, create an optimization script.

---

## Implementation Order

1. Gather content from the builder (Steps 1–6 above)
2. **Rebuild cattle.html** as a herd overview page (no individual cards)
3. Replace all `[placeholders]` across all pages with real content
4. Wire up birthday system with real names and dates
5. Optimize and add real photos
6. Set up Formspree contact form
7. Replace map section with town/county text and "call for directions" (NO exact address or map pin)
8. Add YouTube embeds for any videos
9. Comment out (don't delete) the individual animal card system for Phase 2
10. Test responsive design at all breakpoints
11. Run Lighthouse audit
12. Push to GitHub and verify live site

---

## Design Reference

See `spec/design-spec.md` for the full aesthetic specification. Key points:
- Palette: earth browns (#3D2B1F), gold accents (#C6A84B), sage green (#6B7F5E), cream (#FAF6F0)
- Fonts: Cormorant Garamond (display), Lato (body) — loaded via Google Fonts CDN
- Tone: "Modern Homestead" — authentic, warm, not corporate or kitschy
- Mobile-first responsive, scroll-triggered animations
- No runtime dependencies beyond Google Fonts

---

## Reference Docs in This Repo

- `spec/design-spec.md` — Full design specification with color palette, typography, page layouts
- `docs/PHOTO-GUIDE.md` — How to add/update photos (for the ranch owners after handoff)
- `docs/IOS-SHORTCUT-GUIDE.md` — Building an iOS Shortcut for one-tap photo uploads
- `site-config.json` — Content configuration template
