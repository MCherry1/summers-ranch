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
Ask for each family member's first name, role on the ranch, and brief 1–2 sentence bio. They should upload portrait photos to `images/about/`.

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

## Mascot Birthday System

The mascot section uses a `data-birthday` attribute on the HTML element. JavaScript auto-calculates current age and checks if today is the birthday.

```javascript
const birthday = new Date(el.dataset.birthday);
const today = new Date();
let age = today.getFullYear() - birthday.getFullYear();
const m = today.getMonth() - birthday.getMonth();
if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
const isBirthday = today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
// If isBirthday, show a birthday banner at the top of the page
```

On the mascot's birthday, display a celebratory banner across the top of every page:
"Happy Birthday to our Junior Ranch Hand, [Name]! 🎂"

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
