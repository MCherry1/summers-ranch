# CLAUDE.md — Summers Ranch Website

## Project Overview

This is a static cattle ranch website for **Summers Ranch** (mrsummersranch.com). It's a brochure site for a family-owned cattle breeding operation (not slaughter — they breed, track lineage, and sell at auction or private treaty). The herd is 40–100 head.

The site is hosted on **GitHub Pages** with a custom domain via Porkbun. No build tools, no framework — pure HTML/CSS/vanilla JS. The domain `mrsranch.com` redirects to `mrsummersranch.com`.

---

## First Priority: Gather Content

Before doing ANY code work, **prompt the user to fill in `site-config.json`**. Walk through each section conversationally:

### Step 1 — Ranch Basics
Ask for: ranch name (confirm "Summers Ranch" or alternate), tagline, year established, location (city/state/county/street/zip), phone, email, primary cattle breed, secondary breed if any, approximate herd size, selling method (auction, private treaty, both), Facebook/Instagram URLs.

### Step 2 — Family Members
Ask for each family member's first name, role on the ranch, brief 1–2 sentence bio, and **birthday (YYYY-MM-DD)**. Birthdays power the site-wide birthday banner system. They should upload portrait photos to `images/about/`.

### Step 3 — Mascot / Junior Ranch Hand
Ask for: son's first name only (no last names on the public site), **birthday in YYYY-MM-DD format** (used for auto-age calculation and birthday banner), a short description of what he does on the ranch. They should upload 3–5 photos to `images/mascot/`.

### Step 4 — Ranch Story
Ask for: 2–3 paragraphs about ranch history (or bullet points — offer to write the prose), a philosophy quote or motto, brief text for three philosophy pillars.

### Step 5 — Cattle
Ask for a list of animals for the site (start with 3–6): tag number, name (optional), birth date, sire tag, dam tag, breed, sex, status (breeding/for sale/sold). Photos go in `images/cattle/` named by tag (e.g., `tag-189.jpg`).

### Step 6 — Contact Form & Map
Ask if they want a contact form (need Formspree ID) and a Google Maps embed URL for their location.

After `site-config.json` is filled, proceed to code updates.

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

## Image Requirements

- **Hero/banner:** 1920px wide, WebP or JPEG, < 250KB
- **Cattle cards:** 800px wide, < 100KB
- **Gallery:** 600px thumbnails, 1600px full-size for lightbox
- **Portraits:** 500px wide for circle crops
- Use `loading="lazy"` below the fold
- GitHub repo limit: 1GB total — optimize aggressively

If user provides raw photos, create an optimization script.

---

## Implementation Order

1. Gather content via `site-config.json`
2. Replace all `[placeholders]` in HTML with real content
3. Implement mascot birthday logic (auto-age + birthday banner)
4. Optimize and add real photos
5. Set up Formspree contact form
6. Add Google Maps embed
7. Add YouTube embeds for any videos
8. Test responsive design at all breakpoints
9. Run Lighthouse audit
10. Push to GitHub and verify live site

---

## Design Reference

See `spec/design-spec.md` for the full aesthetic specification. Key points:
- Palette: earth browns (#3D2B1F), gold accents (#C6A84B), sage green (#6B7F5E), cream (#FAF6F0)
- Fonts: Cormorant Garamond (display), Lato (body) — loaded via Google Fonts CDN
- Tone: "Modern Homestead" — authentic, warm, not corporate or kitschy
- Mobile-first responsive, scroll-triggered animations
- No runtime dependencies beyond Google Fonts
