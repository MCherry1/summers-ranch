# Summers Ranch — Public Website Design Specification

*Prepared for Claude Code implementation. Version 1.0.*

---

## 1. Research Summary: What Works in Ranch Websites

After surveying dozens of cattle ranch and breeding operation websites (Pharo Cattle Company, Adams Ranch, Jorgensen Land & Cattle, Werner Family Angus, King Ranch, R.A. Brown Ranch, Ohio Land & Cattle, 6666 Ranch, and others), clear patterns emerge for what works and what doesn't.

### What the best ranch sites have in common

- **Hero photography dominates.** Every successful ranch site leads with a full-bleed landscape or cattle photo. The land and animals ARE the brand — text is secondary.
- **Simple navigation.** Typically 5–7 top-level items: Home, About/History, Cattle/Our Herd, Sales, Gallery/Media, Contact. Some add a Blog or News section.
- **Family story prominently told.** Buyers in the cattle world care deeply about who they're buying from. Multi-generational heritage, philosophy, and values are front and center.
- **Cattle presented individually or by category.** Breeding stock sites show individual animals with photos, lineage info, and stats. Sale animals get their own gallery or catalog section.
- **Mobile-responsive.** Ranchers and buyers are frequently on phones — in the field, at auction, in the truck. Every modern ranch site is responsive.
- **Contact info is easy to find.** Phone number (not just email), physical address, and sometimes a map. These are businesses where people still pick up the phone.
- **Earthy, authentic color palettes.** Browns, tans, sage greens, deep navy, cream/off-white. Never neon. Never corporate blue. Photos provide all the color variety needed.

### What to avoid

- Clip art, stock photos of generic farms, or cartoon cattle
- Overly corporate or tech-startup aesthetics
- Busy, cluttered layouts with too many sidebar widgets
- Auto-playing background music (yes, some ranch sites still do this)
- Tiny text on image backgrounds without sufficient contrast
- Slow-loading pages from unoptimized full-resolution photos

---

## 2. Site Architecture

### Pages

```
summersranch.com/
├── index.html          — Home (hero + snapshot of everything)
├── about.html          — About the Ranch / Our Story
├── cattle.html         — Our Cattle (herd overview + categories)
├── gallery.html        — Photo & Video Gallery
├── contact.html        — Contact Information
└── webcam.html         — Live Ranch Cam (optional, future)
```

### Navigation Structure

**Desktop:** Horizontal nav bar, logo left, links right, phone number far right.
**Mobile:** Hamburger menu with full-screen overlay. Phone number always visible as a tap-to-call button.

```
Logo | About | Our Cattle | Gallery | Contact | ☎ (555) 123-4567
```

---

## 3. Aesthetic Direction

### Design Philosophy: "Modern Homestead"

Not corporate. Not kitschy. Think: a high-quality ranch real estate listing or an agricultural magazine editorial spread. The land and the animals speak through photography, supported by clean, warm typography and generous white space.

### Color Palette

```css
:root {
  /* Primary */
  --color-earth:      #5C4033;   /* Warm dark brown — headers, nav */
  --color-saddle:     #8B6914;   /* Saddle tan — accents, buttons */
  --color-sage:       #7A8B6F;   /* Muted sage green — secondary accents */

  /* Neutrals */
  --color-cream:      #FAF6F0;   /* Warm off-white — page background */
  --color-linen:      #F0EBE3;   /* Slightly darker cream — card backgrounds */
  --color-charcoal:   #2C2C2C;   /* Near-black — body text */
  --color-stone:      #6B6560;   /* Warm gray — secondary text */

  /* Functional */
  --color-rust:       #A0522D;   /* Sienna — hover states, CTA */
  --color-sky:        #87AEBD;   /* Dusty blue — optional cool accent */
}
```

### Typography

Use Google Fonts for free hosting:

- **Display / Headings:** `"Playfair Display"` — Elegant serif with ranch-appropriate gravitas. Used for the ranch name, page titles, section headers.
- **Body / UI:** `"Source Sans 3"` — Clean, highly readable sans-serif. Used for paragraphs, nav, buttons, captions.
- **Optional Accent:** `"Libre Baskerville"` — For pull quotes or the ranch tagline.

```css
h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; }
body, nav, button { font-family: 'Source Sans 3', 'Segoe UI', sans-serif; }
```

### Visual Texture

- Subtle paper/linen texture on the background (CSS noise pattern or a very light repeating image)
- Thin horizontal rules or branded dividers between sections (a simple line with a small ranch icon centered)
- Photos with very slight warm color overlay to maintain palette consistency
- Drop shadows kept minimal and warm-toned

---

## 4. Page-by-Page Specifications

### 4.1 Home Page (`index.html`)

**Purpose:** First impression. Communicate who they are, what they do, and invite exploration.

**Layout (top to bottom):**

1. **Hero Section** — Full-viewport-width landscape photo of the ranch (pastures, cattle in the distance, golden hour light). Semi-transparent overlay at bottom with:
   - Ranch name: "SUMMERS RANCH" in display font
   - Tagline: e.g., "Raising Quality Cattle Since [Year]" or custom
   - Single CTA button: "Meet Our Herd →"

2. **Introduction Strip** — 2–3 sentences about the ranch. Brief, warm, personal. Centered text on cream background. Example: *"Summers Ranch is a family-owned breeding operation in [Location]. We raise [breed] cattle with care, tracking lineage and health to produce the strongest herds for our buyers."*

3. **Three-Card Section** — Three evenly spaced cards with photos and links:
   - Card 1: Photo of cattle → "Our Cattle" → links to cattle.html
   - Card 2: Photo of family/ranch life → "Our Story" → links to about.html
   - Card 3: Photo of landscape → "Gallery" → links to gallery.html

4. **Featured / Current News Strip** (optional) — If they want to announce a sale, a new calf crop, or seasonal update. Simple text block with a date. Can be hidden when there's nothing current.

5. **Contact Bar** — Simple dark background strip with phone, email, location. "Interested in our cattle? Get in touch."

6. **Footer** — Logo, nav links, copyright, social media icons (if applicable).

### 4.2 About Page (`about.html`)

**Purpose:** Tell the family story. Build trust and personal connection.

**Layout:**

1. **Page Header** — Title "Our Story" over a banner photo (family, ranch house, working cattle)

2. **History Section** — 2–4 paragraphs about the family, how long they've been ranching, what drives them. Accompanied by 1–2 photos (side-by-side or alternating text/image blocks).

3. **Philosophy Section** — What they believe about breeding, land stewardship, animal care. Can be presented as a short numbered list or prose.

4. **The Land Section** — Brief description of the ranch property, acreage, location, climate. Photo of the property.

5. **Optional: Meet the Family** — Small portrait photos with names and brief roles. Keep it simple and warm.

### 4.3 Cattle Page (`cattle.html`)

**Purpose:** Showcase the herd. This is the most important page for potential buyers.

**Layout:**

1. **Page Header** — "Our Cattle" with banner photo of the herd

2. **Herd Overview** — Brief paragraph: breed(s) raised, herd size, breeding philosophy, what makes their cattle stand out.

3. **Category Sections** — Depending on how they organize:
   - **Breeding Stock** — Bulls and cows kept for breeding. Grid of animal cards.
   - **Sale Stock** — Animals currently available. Grid of animal cards.
   - **Recent Calves / Yearlings** — Showcase of young stock.

4. **Individual Animal Card Design:**
   ```
   ┌─────────────────────┐
   │  [Photo]            │
   │                     │
   ├─────────────────────┤
   │  Tag #247           │
   │  "Summers Thunder"  │
   │  Born: March 2024   │
   │  Sire: #189         │
   │  Dam:  #112         │
   │  [More Info →]      │
   └─────────────────────┘
   ```
   Grid: 3 columns desktop, 2 columns tablet, 1 column mobile.

5. **Inquiry CTA** — "Interested in purchasing? Contact us" with phone/email.

### 4.4 Gallery Page (`gallery.html`)

**Purpose:** Visual portfolio of ranch life, cattle, landscapes.

**Layout:**

1. **Page Header** — "Gallery" with a mosaic or banner image

2. **Filter Tabs** (optional) — "All | Ranch | Cattle | Seasons | Video"

3. **Photo Grid** — Masonry-style or uniform grid. Lightbox on click for full-size viewing. Use lazy loading for performance.

4. **Video Section** — Embedded YouTube or Vimeo videos. Keep them tasteful — short clips of ranch work, cattle movement, landscapes. YouTube embeds are free and dead simple:
   ```html
   <iframe src="https://www.youtube.com/embed/VIDEO_ID"
           width="560" height="315"
           frameborder="0" allowfullscreen>
   </iframe>
   ```

### 4.5 Contact Page (`contact.html`)

**Purpose:** Make it dead simple to reach them.

**Layout:**

1. **Page Header** — "Get in Touch"

2. **Contact Info Block:**
   - Phone number (large, tap-to-call on mobile)
   - Email address
   - Physical address
   - Business hours (if applicable)

3. **Map Embed** — Google Maps iframe showing ranch location

4. **Simple Contact Form** (optional — requires a form backend):
   - Name, Email, Phone, Message, Submit
   - Can use Formspree.io (free tier, no backend needed) or Netlify Forms

5. **Social Media Links** — If they have Facebook, Instagram, etc.

### 4.6 Webcam Page (`webcam.html`) — Future

**Purpose:** Fun, engagement, transparency. Live view of pastures.

**Options for implementation:**
- **Wyze Cam / Trail Cam → YouTube Live:** Most trail cameras and Wyze cams can push RTSP streams. Using a small computer (Raspberry Pi or old laptop) running OBS, you can restream to YouTube Live. Then embed the YouTube live player on the page.
- **Direct iframe embed:** Some camera services (like EarthCam, webcam.io) provide embeddable players.
- **Static timelapse:** If live streaming is too complex, a daily timelapse video uploaded to YouTube works well and is much simpler.

The webcam page would be simple: a title, the embedded video player, and a brief description ("Watch our herd graze in real time").

---

## 5. Responsive Design Specifications

### Breakpoints
```css
/* Mobile first */
/* Small phones */     @media (max-width: 480px) { ... }
/* Large phones */     @media (min-width: 481px) and (max-width: 768px) { ... }
/* Tablets */          @media (min-width: 769px) and (max-width: 1024px) { ... }
/* Desktop */          @media (min-width: 1025px) { ... }
/* Large desktop */    @media (min-width: 1440px) { ... }
```

### Mobile-Specific Rules
- Nav collapses to hamburger menu
- Phone number is always visible as a floating or header tap-to-call button
- Photo grids switch from 3-col → 2-col → 1-col
- Hero image uses a taller crop or different photo optimized for portrait orientation
- Touch targets are at least 44×44px (Apple HIG standard)
- Font sizes don't go below 16px for body text (prevents iOS zoom)

---

## 6. Technical Implementation

### Stack
- **Pure HTML + CSS + minimal JavaScript** — No framework needed for a brochure site
- **Hosted on GitHub Pages** (free) or Cloudflare Pages (free, with better build pipeline)
- **Images hosted on Cloudflare R2** once they exceed GitHub's 1GB repo limit

### File Structure
```
summers-ranch/
├── index.html
├── about.html
├── cattle.html
├── gallery.html
├── contact.html
├── css/
│   ├── reset.css          (normalize/reset styles)
│   ├── variables.css      (CSS custom properties)
│   └── main.css           (all site styles)
├── js/
│   ├── nav.js             (mobile menu toggle)
│   └── gallery.js         (lightbox functionality)
├── images/
│   ├── hero/              (hero images, optimized)
│   ├── cattle/            (individual animal photos)
│   ├── gallery/           (gallery photos)
│   ├── about/             (about page photos)
│   └── icons/             (favicon, social icons)
├── CNAME                  (custom domain for GitHub Pages)
└── README.md
```

### Image Strategy

**This is critical for a photo-heavy ranch site.**

**Phase 1 (small site, < 50 images):**
- Keep images in the GitHub repo under `/images/`
- Optimize ALL images before committing:
  - Hero images: 1920px wide, WebP format, ~150-250KB each
  - Cattle cards: 800px wide, WebP format, ~50-100KB each
  - Gallery thumbnails: 400px wide, ~30-50KB each
  - Gallery full-size: 1600px wide, ~150-200KB each
- Use `<picture>` element with WebP + JPEG fallback
- Use `loading="lazy"` on all images below the fold

**Phase 2 (growing site, 50+ images):**
- Move images to **Cloudflare R2** (free tier: 10GB storage, zero bandwidth fees)
- Reference images via R2 public URL or custom subdomain (`media.summersranch.com`)
- Keep repo lightweight (just code)
- R2 setup: Create a Cloudflare account → create R2 bucket → enable public access → upload via dashboard or rclone CLI

**Image optimization workflow:**
```bash
# Using cwebp (install via: brew install webp / apt install webp)
# Convert JPEG to WebP at 80% quality
cwebp -q 80 -resize 1920 0 input.jpg -o hero-image.webp
cwebp -q 80 -resize 800 0 input.jpg -o cattle-card.webp

# Or use squoosh.app (browser-based, no install needed)
```

### Video / Media Hosting

- **Short clips and ranch videos:** Upload to YouTube (free, unlimited). Embed via iframe. YouTube handles all transcoding, bandwidth, and mobile optimization.
- **Webcam / live feed:** Stream to YouTube Live via OBS or a restreaming service. Embed the live player.
- **Never host video files directly in the GitHub repo or on the static site.** Video files are too large and GitHub Pages has a 100MB per-file limit.

### Performance Targets
- First Contentful Paint: < 1.5 seconds
- Largest Contentful Paint: < 2.5 seconds (hero image)
- Total page weight: < 2MB on initial load
- Lighthouse score: 90+ on all categories

---

## 7. Hosting & Deployment

### Option A: GitHub Pages (simplest, what you already know)

1. Create repo: `MCherry1/summers-ranch`
2. Push code to `main` branch
3. Settings → Pages → Source: Deploy from branch `main`
4. Add CNAME file with custom domain
5. In Porkbun DNS: Add CNAME record pointing to `mcherry1.github.io`
6. Enable HTTPS in GitHub Pages settings

**Pros:** Free, you already know the workflow.
**Cons:** 1GB repo limit, no build pipeline, bandwidth soft-cap at 100GB/month.

### Option B: Cloudflare Pages (recommended upgrade path)

1. Connect Cloudflare Pages to the GitHub repo
2. Set build command: (none — plain HTML)
3. Set output directory: `/` (root)
4. Transfer domain DNS to Cloudflare (or point nameservers)
5. Automatic HTTPS, CDN, and cache

**Pros:** Better global performance (CDN), no bandwidth limits, seamless R2 integration for images later, free tier is extremely generous.
**Cons:** Slightly more setup than GitHub Pages. Requires moving DNS to Cloudflare.

### Custom Domain Setup (Porkbun)

For either hosting option:
```
Type:  CNAME
Name:  www
Value: mcherry1.github.io  (or your-project.pages.dev for Cloudflare)

Type:  A (for apex domain)
Value: 185.199.108.153  (GitHub Pages IPs, or Cloudflare's if using CF)
```

---

## 8. Cattle Management Software — API Integration Research

You asked whether any of the commercial cattle management tools offer APIs that could feed data into the public website. Here's what I found:

### CattleMax
- **No public API.** Integrations are limited to hardware (EID readers, scales via TagMax app) and breed association data imports. No way to embed or pull herd data into an external website.
- **Mobile access:** Web-based (works in any browser), no native app. They suggest adding a home screen shortcut. Offline: limited — they recommend CSV worksheets for field work.
- **Pricing for 40–100 head:** $216/year (up to 100 animals).

### Herdwatch
- **Enterprise API exists** (XML/API feeds for processors, pharma, supply chain partners), but this is for large enterprise customers, not individual ranchers embedding data on their website.
- **Consumer-level API:** None available.
- **Mobile app:** Native iOS and Android. Works offline, syncs when online. Also has web version at app.herdwatch.com.
- **Pricing:** Free basic tier, Pro subscription ~$79/year.

### Breedr
- **No public developer API.** Supply chain data sharing is built into their platform (between producers, feedlots, packers) but not exposed for custom website embedding.
- **Mobile app:** Native iOS and Android. Offline capable. Web app also available.
- **Pricing:** Currently offering "Free 'til Fall" for new users (8 months free), then subscription.
- **Notable:** Strong genetics and pedigree tracking. Best suited for operations that want supply-chain traceability.

### Summary on API Integration

**None of these tools offer a public API suitable for pulling herd data into a custom website.** The integrations they offer are internal (hardware devices, breed registries, supply chain partners), not external-facing.

**What this means for Summers Ranch:**

The realistic options are:

1. **Use a subscription service for herd management (phone app) + build a completely separate static public website.** The two systems don't talk to each other. When they want to list a sale animal on the website, they manually add a photo and details to the site. This is what most small ranches do.

2. **Build a custom herd tracker later** (Phase 2 of your project) that DOES have both a private management interface and a public-facing "Sale Cattle" page — because you control the database and can expose whatever you want via API.

3. **Hybrid approach:** Use CattleMax or Herdwatch for daily management in the field (they're mature, tested, mobile-optimized products). Build the public site separately. If they eventually want sale cattle to appear on the website automatically, build a simple bridge — they export a CSV from CattleMax, a script converts it to JSON, the site reads it. Not elegant, but functional.

**My recommendation:** Start with Option 1. Use Herdwatch (good free tier, great mobile app, offline works) or CattleMax ($216/year for 100 head, extremely mature product). Build the public website independently. Revisit integration in Phase 2 when you know what they actually need.

---

## 9. Claude Code Implementation Plan

When you're ready to build, give Claude Code these instructions in order:

### Phase 1: Scaffold
```
Create a static website for "Summers Ranch" cattle breeding operation.
Use the file structure from the spec. Pure HTML/CSS/JS, no frameworks.
Set up CSS custom properties per the color palette in the spec.
Import Google Fonts: Playfair Display and Source Sans 3.
Create a responsive nav with mobile hamburger menu.
Create a shared footer. Build all 5 pages with placeholder content.
```

### Phase 2: Home Page
```
Build the home page per the spec:
- Full-viewport hero section with overlay text and CTA
- Introduction strip
- Three-card section linking to About, Cattle, Gallery
- Contact bar
- Use placeholder images (unsplash cattle/ranch photos) for now
```

### Phase 3: Inner Pages
```
Build About, Cattle, Gallery, and Contact pages per the spec.
Use CSS grid for the cattle card layout and gallery grid.
Add a simple lightbox for gallery images (vanilla JS, no library).
Add Formspree integration for the contact form.
Embed a Google Maps iframe on the contact page.
```

### Phase 4: Polish
```
Add lazy loading to all images below the fold.
Add smooth scroll behavior.
Add subtle CSS transitions on hover states.
Test responsive design at all breakpoints.
Optimize for Lighthouse score 90+.
Add meta tags, Open Graph tags, and favicon.
```

### Phase 5: Real Content
```
Replace all placeholder images with actual ranch photos.
Replace placeholder text with real copy about Summers Ranch.
Add individual cattle entries with real tag numbers and photos.
```

---

## 10. Content Checklist — What to Gather from the Family

Before building with real content, you'll need:

- [ ] **Ranch name / logo** — "Summers Ranch" — do they have a logo? If not, a text-based logo works great.
- [ ] **Tagline** — A short phrase that captures who they are.
- [ ] **Ranch story** — 3–5 paragraphs about their history, family, philosophy.
- [ ] **Location** — City/state/county for the contact page and map.
- [ ] **Contact info** — Phone, email, physical address, business hours.
- [ ] **Cattle breed(s)** — What breeds do they raise?
- [ ] **10–20 hero/landscape photos** — Ranch scenery, pastures, fences, sunsets, cattle from a distance. These set the tone.
- [ ] **Individual cattle photos** — For the herd page. Even phone photos work if they're well-lit.
- [ ] **Family photos** — For the about page. Doesn't have to be professional.
- [ ] **Any existing sale catalogs or printed materials** — Good source for cattle descriptions and stats.
- [ ] **Social media accounts** — Facebook, Instagram, etc.
- [ ] **Domain name** — Which domain from Porkbun will be used?
- [ ] **Webcam interest level** — Is this a "nice to have someday" or a priority?
- [ ] **Mascot photos** — Photos of [Son's Name] doing ranch activities: helping with feeding, near the cattle, on the fence, in boots and hat, etc. 3–5 good shots for rotation.
- [ ] **Son's first name** — For the "Junior Ranch Hand" section. (Decide whether to use first name only, a nickname, or a fun title.)
- [ ] **Brief mascot bio** — A sentence or two about what he does on the ranch. Keep it charming and age-appropriate.

---

## 11. Mascot / Junior Ranch Hand Concept

### The Idea

[Son's Name] serves as the ranch's official mascot and "Junior Ranch Hand." He appears on the website in a dedicated section on the home page and in the family lineup on the about page. This gives the site personality, reinforces the family-operation feel, and provides a legitimate basis for ranch employment (supporting a minor's IRA contribution through real work on a family business).

### How It Appears on the Site

**Home page:** A dedicated section between the three-card grid and the contact bar. Features a circular portrait photo, a "Junior Ranch Hand" badge, and a short paragraph about his role. The tone is warm and genuine — not cutesy, not performative. He's part of the team.

**About page:** He appears in the "Meet the Summers" family grid alongside the other family members, with the title "Junior Ranch Hand & Official Mascot."

**Gallery:** Include a few photos of him doing real ranch work — feeding, checking on animals, riding along. These photos should feel natural, not staged.

### Content Guidelines for the Mascot Section

- Use **first name only** (no last name on the public site)
- Keep the tone respectful of his role — he's a working member of the ranch, not a prop
- Photos should show real ranch activities, not posed portraits
- The text should convey that ranching is a family endeavor and the next generation is learning the trade
- Rotate photos seasonally if desired (calving season, summer, fall roundup, etc.)

### Suggested Copy (customize to fit)

> *"Every ranch needs a good hand — ours just happens to be [age] years old. [Name] is the official Junior Ranch Hand of Summers Ranch. Whether he's helping check on the herd, learning the ropes at feeding time, or just keeping everyone's spirits up, he's earning his keep and learning what it means to work the land. The next generation of Summers ranching starts here."*

---

*This spec is designed to be handed directly to Claude Code for implementation. Each section gives enough detail for literal execution while leaving room for the creative decisions that make a site feel alive.*
