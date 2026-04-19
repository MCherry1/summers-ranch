# Polish and Aesthetics — visual craft guide

This document supplements `CARD-REDESIGN-SPEC.md` with specific guidance on visual polish, aesthetic intent, and CSS craft. The main spec tells you *what to build*. This document tells you *how it should feel*.

**Read this before writing any UI code.** Spec adherence alone produces a functional site. Spec adherence plus this document produces a site that feels considered.

---

## 1. Aesthetic direction

**One sentence:** refined editorial — a small registered Hereford operation presented with the dignity of a regional livestock publication, not a SaaS app.

**Reference points:** Kinfolk magazine for spacing and typographic restraint. Aesop for the confidence of minimal chrome on a warm palette. Apple Photos for the treatment of photography as primary content. Hereford World magazine for industry credibility. *Not* Airbnb, not Stripe, not generic Tailwind-ish marketing sites.

**What this site is not:** cute, gifty, quirky, playful, emoji-heavy, startup-cheerful, pastel-soft. Marty is a serious rancher. Roianne takes the operation seriously. The site must feel as serious as they are, while staying warm.

**Anti-patterns to avoid:**
- Purple gradients (the unmistakable "AI-designed" tell)
- Space Grotesk (the "designer who read one Dribbble post" tell)
- Soft-rounded everything — generous radii on every element
- Uniform drop shadows on every card at the same elevation
- "Hero with centered title, CTA, three-feature row, three-column grid" layouts
- Bootstrap-y uniform spacing
- Centered everything on desktop
- Gradient backgrounds on buttons, headers, or cards
- Generic stock imagery aesthetics
- Icon-heavy UI (small iconography is fine where genuinely useful; emoji and flat-illustration sets are not)

---

## 2. Typographic craft

### 2.1 Playfair Display — display rules

Playfair is a transitional-to-modern serif with high contrast between thick and thin strokes. It has real personality and rewards restraint.

**Use it for:**
- Page titles, section titles, hero display text
- Animal names (they are the hero of this site — let Playfair honor them)
- Pull quotes and editorial callouts
- Italic emphasis on specific words within titles (see §2.4)

**Do not use it for:**
- UI chrome (buttons, form labels, nav items) — those get Work Sans
- Long-form body copy — reading a paragraph of Playfair is fatiguing
- Small sizes (under ~18px) — high-contrast strokes break down at small sizes

**Weights to use:**
- `400` for display at large sizes — the default, most elegant
- `500` for extra authority at hero scale
- `400 italic` for emphasis (do not use italic at bold weight)
- Avoid `700`+ (Playfair gets heavy fast)

### 2.2 Work Sans — body rules

Work Sans is a humanist geometric sans. Clean, neutral, friendly without being cutesy.

**Use it for:**
- All body copy
- All UI labels (buttons, form fields, navigation, kickers)
- All data display (stats, tags, dates, numbers)
- Tooltips

**Weights to use:**
- `400` — default body
- `500` — emphasis within body, small labels, field values
- `600` — buttons, nav items, kickers, data labels
- Rarely `700` — only where genuine bold emphasis is warranted

**Do not use `300`** (too thin, reduces legibility for older readers) **or `900`** (too heavy, aggressive).

### 2.3 Size hierarchy

Phase 1 uses the scale in §18 of the main spec. Key rules about using that scale well:

- **Display sizes cascade more aggressively than body sizes.** A hero can be 4rem while the body is 1rem — a 4:1 ratio. A section title at 2.4rem sits above body at 1rem — 2.4:1. This dramatic ratio is what makes editorial typography feel editorial.
- **Within body copy, keep the hierarchy shallow.** Body 1rem, small 0.85rem, kicker 0.72rem. Don't use more than three body-adjacent sizes on a page. Flatness is elegant.
- **Line height varies by size.** Display gets `line-height: 1.1` (tight). Body gets `1.6-1.75` (relaxed). Never use `1.5` for body — it reads as tech-doc default.

### 2.4 Italic emphasis on titles

The italic-emphasis-on-key-words pattern is a signature move. Examples from the spec:

- "Every cow has a name. *Every name has a story.*"
- "A family tradition, *honestly kept.*"
- "Looking for your *next sire?*"

**Rules for using it:**
- Italicize the phrase that carries the emotional or thematic weight, not the subject noun
- Italic goes on the second of two phrases when a title is compound — the first phrase sets up, the second delivers
- Italic color is `--color-accent` (burgundy) — italic is both typographic emphasis and chromatic emphasis in one move
- Don't italicize more than one phrase per title
- Don't italicize titles that are already short (one-phrase titles get no italic treatment)

### 2.5 Tracking (letter-spacing)

Letter-spacing is a craft detail that separates considered design from default design.

- **Kickers** (uppercase small labels above titles): `letter-spacing: 0.25em` — generous tracking for tiny uppercase text is *mandatory*. Without it, `MEET THE HERD` reads as cramped.
- **Uppercase buttons**: `letter-spacing: 0.15em` — enough to breathe, not so much it looks decorative
- **Display titles**: `letter-spacing: -0.01em` — slightly tight for visual compactness
- **Body copy**: `0` — neutral
- **Italic display text**: `letter-spacing: 0.01em` — slightly loose to complement the italic's organic flow

---

## 3. Color craft

### 3.1 Color hierarchy

The burgundy accent is a scarce resource. If it appears everywhere, it stops being an accent.

**Where burgundy belongs:**
- Kickers (small uppercase labels)
- Italic emphasis in display titles
- Primary CTA backgrounds
- Secondary CTA text + border
- Link text (with subtle underline, see §3.4)
- Active states in navigation
- Animal names on card backs
- Ribbons — none (ribbons are ceremonial gold, not brand burgundy)

**Where burgundy does NOT belong:**
- Body text (use `--color-ink`)
- Card backgrounds (use `--color-paper`)
- Most icons (use `--color-muted` for decorative, `--color-ink` for actionable)
- Horizontal rules (use `--color-cream-deep`)
- Form field borders in default state (use `--color-cream-deep`)
- Status indicators not related to availability

### 3.2 Muted color deployment

`--color-muted` (`#5a5046` light / `#a89d8c` dark) is underused by default.

**Use muted for:**
- Secondary body text (descriptions, metadata, captions)
- Date and timestamp text
- Field labels (not values)
- Disabled state text
- Tertiary navigation items
- Placeholder text in form fields

This is how you create visual hierarchy *without* changing font size. A page where some text is ink and some is muted reads as layered. A page where everything is ink reads as flat.

### 3.3 Dividers

Horizontal rules and section dividers use `--color-cream-deep` (`#e8d9bd` light). Not `--color-muted`, not a black hairline, not a gradient.

`border-top: 1px solid var(--color-cream-deep)` is the default divider. Always 1px — never thicker.

### 3.4 Link styling

Links in body text:
- Color: `--color-accent` (burgundy)
- Underline: `text-underline-offset: 0.25em; text-decoration-thickness: 1px` — never the default browser underline
- Hover: underline thickness increases to 2px, color deepens to `--color-accent-deep`

External links get a `↗` icon after the link text. Internal links get no icon.

---

## 4. Spatial composition

### 4.1 Generous negative space

Every surface should feel unhurried. The dominant mistake to avoid: cramming content.

**Section padding minimums:**
- Mobile: `--space-10` (2.5rem) top and bottom of every section
- Tablet: `--space-12` (3rem)
- Desktop: `--space-16` (4rem) — more is often better

**Content max-widths:**
- Body prose: 42rem max (about 65 characters per line)
- Data tables / stat grids: 50rem max
- Hero copy: 36rem max (even narrower — hero copy reads tight)

### 4.2 Alignment

**Left-align body copy, headlines, and most content on desktop.** Centered text is only for:
- Hero display titles in home page hero sections
- Short callouts that span the full width
- The home page's section-inner content blocks (these are center-aligned per the spec)

On mobile, centered is often fine — the viewport is narrow enough that alignment choice matters less.

### 4.3 Asymmetric composition where possible

Grid-breaking elements add craft. Example ideas for this project:
- Hero image extends full-bleed (edge-to-edge) while hero text is inset from the left
- Stats grid on card back has left-aligned labels and right-aligned values, not centered
- Teaser row on home uses photos with offset heights for a slightly staggered look
- Section dividers are ~3rem long and left-aligned, not full-width centered rules

These are small moves. A page full of them feels designed; a page with none of them feels defaulted.

---

## 5. Photography treatment

### 5.1 Aspect ratios

Cards use `aspect-ratio: 3/4` (portrait) as the primary photo slot. Home page teasers use the same.

Hero uses dynamic vertical sizing: `height: 68vh; min-height: 420px; max-height: 600px`. This lets the hero fill the viewport attractively on most devices without becoming absurdly tall on ultrawide displays.

### 5.2 Image corners

Cards: `border-radius: 3px`. Not 0 (too sharp), not 8px (too rounded, reads as cards-in-an-app). 3px is the "printed photo with a slight chamfer" feeling.

Photos inside cards: no additional radius — the card's radius clips the photo's corners.

Hero: no radius. Full-bleed photography always has square corners.

### 5.3 Scrims and overlays

The main spec specifies the hero scrim. Apply the same philosophy to all photo overlays:

- **Bottom-third-only gradient** for hero and teaser cards — preserves the photo's color in the upper 60-70%
- **No overlays on card-front photos** except the ribbons (which are themselves photo-top elements, not scrims)
- **Live Photo motion never has a vignette or color tint overlay** — the motion is the effect; adding visual noise dilutes it

### 5.4 Photo loading

Photos should never pop in. Use:
- `loading="lazy"` for all below-the-fold images
- `background-color: var(--color-cream-deep)` on image containers so the space feels intentional while loading, not blank-white
- A gentle fade-in (`transition: opacity 400ms ease`) for photos above the fold

---

## 6. Interaction polish

### 6.1 Transitions

**Default transition:** `transition: all 0.25s ease` on interactive elements. Not snappier (feels nervous), not slower (feels sluggish).

**Hover on CTAs:** background and border both transition simultaneously. Never have one transition and the other snap.

**Dark mode toggle, any mode change:** `transition: background 0.3s ease, color 0.3s ease` on `body` — the whole page color-shifts together, not element-by-element.

**Swipe transitions between cards:** `cubic-bezier(0.32, 0.72, 0, 1)` easing — this is the iOS system curve. Feels native.

### 6.2 Shadows — elevation hierarchy

Shadows should convey elevation, not just "shadow on things":

- **Ambient (static cards in a list)**: `box-shadow: 0 2px 6px rgba(0,0,0,0.06)` — present, barely there
- **Resting (card front, hero image)**: `box-shadow: 0 6px 20px rgba(0,0,0,0.12)` — clearly lifted off the page
- **Hover / focus (interactive, about to be tapped)**: `box-shadow: 0 10px 28px rgba(0,0,0,0.18)` — reaching toward you
- **Modal / dropdown (floating over content)**: `box-shadow: 0 20px 50px rgba(0,0,0,0.25)` — dramatic

Use the same shadow color (`rgba(0,0,0, alpha)`) across the hierarchy. Don't introduce colored shadows.

**Dark mode:** the same shadow RGB values still work (shadows are about luminance, not color) but drop their alphas by 30-40% because dark backgrounds make shadows harder to see.

### 6.3 Focus states

All interactive elements get a visible focus ring:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: inherit;
}
```

Burgundy outline at 3px offset reads clearly on cream. Never use the default browser focus ring (blue on everything). Never remove focus rings without replacing them.

### 6.4 Motion restraint

Revisit the spec's motion rules: no cycling on herd cards, Live Photo only on front of a specific card when arrived, no motion in compact view. Adherence to these is polish.

**Also:**
- No scroll-triggered parallax
- No fade-in-on-scroll animations for every element — once per page load at hero, staggered by ~100ms for a handful of key elements, then done
- No hover animations on cards in a list (they feel restless when you're scanning)
- No icon rotations or pulses unless they mark a genuinely meaningful state (loading, active recording)

---

## 7. Component details

### 7.1 CTAs

- **Primary CTA**: filled burgundy, cream text, 1px burgundy border, radius 1px (intentionally square — sharp is the aesthetic)
- **Secondary CTA**: transparent background, burgundy text, 1px burgundy border, radius 1px
- **Padding**: `0.85rem 1.8rem` — wider than tall, gives the CTA a deliberate rectangle feel
- **Letter-spacing**: `0.15em` on the uppercase text
- **Font**: Work Sans 600 (semibold), 0.78rem — not large, not screamy
- Hover: primary darkens to `--color-accent-deep`, secondary fills burgundy with cream text

### 7.2 Form fields

- Background: `--color-paper` (white on cream, near-black on dark)
- Border: 1px solid `--color-cream-deep` — subtle, not harsh
- Border on focus: 1px solid `--color-accent` — no box-shadow, just the color change
- Padding: `0.65rem 0.85rem` — compact but legible
- Typography: Work Sans 400, `--font-size-base`
- Label above field (never placeholder-as-label): Work Sans 500, `--font-size-xs`, uppercase, `--letter-spacing-wide`, color `--color-muted`
- Error state: border color `--color-accent` (repurposed — it's not a true error red, but this site doesn't need one), error text below the field in `--color-accent`, `--font-size-xs`

### 7.3 Tables

Data tables on the card back and admin surfaces:
- No vertical borders
- Horizontal borders between rows only, 1px solid `--color-cream-deep`
- Padding `0.8rem 0` — tall rows feel considered
- Label column in `--color-muted`, `--font-weight-semibold`, uppercase, small
- Value column in `--color-ink`, `--font-weight-normal`, base size, left-aligned
- No zebra striping

### 7.4 Ribbons

Per main spec §19. Details that matter:
- Ribbon text uses px units (not rem) — if a user has iOS text scaling on, rem would break the fixed-size graphic
- Ribbon shadows are `filter: drop-shadow()` — not `box-shadow`, because drop-shadow follows the clip-path shape (swallowtail)
- Gold ribbons stay gold regardless of light/dark mode. Do not theme them.

### 7.5 Navigation

- Nav items: Work Sans 500, `--font-size-sm`, ink color default
- Active state: burgundy color + underline (1px `--color-accent`, offset 0.3em)
- Hover state: color darkens to accent (no underline on hover alone)
- Gap between items: `--space-6` (1.5rem)
- No background, no pill shape, no chrome around the nav

---

## 8. Responsive behavior

### 8.1 Breakpoints

- Mobile: default
- Tablet: `@media (min-width: 640px)`
- Desktop: `@media (min-width: 960px)`
- Large: `@media (min-width: 1280px)` — use sparingly

### 8.2 Touch targets

All interactive elements must have a minimum hit area of 44×44px on touch devices. This is non-negotiable for older users.

### 8.3 Mobile-specific polish

- Hero text always left-aligned from screen edge, not centered, on mobile — centered mobile hero looks like every other site
- Section padding reduces to `--space-10` (2.5rem) on mobile
- Cards are full-width on mobile (one per row)
- Ribbons stay at same px dimensions across breakpoints (they're graphic components)
- Touch targets for nav items get `padding: 0.5rem 0` minimum even if visually tight

---

## 9. Accessibility as design quality

Good accessibility *is* good design, not a tax on it.

- **Color contrast**: all text must meet WCAG AA (4.5:1 for normal, 3:1 for large). The locked palette has been verified — ink-on-cream is 15:1, burgundy-on-cream is 7.2:1. Test any new color pairings.
- **Text resize**: site must work at 200% text zoom without horizontal scrolling. Test with browser zoom.
- **`prefers-reduced-motion`**: disables Live Photo motion, autoplay in carousels, animation on anything non-essential. Not optional.
- **Keyboard navigation**: every interactive element reachable via Tab, visible focus ring at all times
- **Alt text**: every cattle photo has descriptive alt text. For card fronts: "Side profile of [Name], [age]" or "Sweetheart in the pasture, May 2025" style. Not "cattle.jpg" or empty alts.

---

## 10. When in doubt

**Default to restraint.** When a decision is ambiguous, the smaller, simpler, more muted choice is usually right for this site. Burgundy used sparingly beats burgundy used broadly. Generous space beats packed information. Left-aligned beats centered. 1px borders beat 2px borders. Square corners beat rounded corners.

**Ask: would this look out of place in a Kinfolk magazine spread?** If yes, simplify.

**Ask: is this the first thing Marty would notice, or the last?** UI chrome should be last. Photography and animal names should be first.

---

## 11. Using the frontend-design skill

When building frontend components, consult `/mnt/skills/public/frontend-design/SKILL.md` for general principles on distinctive, non-generic UI. Combine that skill's guidance with this document's project-specific direction.

In particular: that skill emphasizes committing to an aesthetic direction. Ours is stated in §1 above — refined editorial. Hold the line.

---

**This document is authoritative for visual polish. If a spec section and this document appear to disagree on aesthetic detail, this document wins (the spec focuses on what; this focuses on how).**
