# Phase 1 Implementation Plan

*Concrete, ordered build steps for the Summers Ranch rebuild. Start here.*

---

## Overview

Phase 1 produces a functional public site with placeholder cattle records, without the admin panel or live photo pipeline yet. This lets you validate:
- Astro + schema-first architecture
- Data model
- Public page design
- Photo display pipeline (using pre-processed placeholder media)

Phase 1 takes maybe 3-5 Claude Code sessions. Don't try to build everything at once.

---

## Step 0 — Clean slate decision

**Confirm with Mark first:** He explicitly stated nothing needs to be preserved from the current prototype — all photos are test photos, all cattle records are placeholders, no legacy data needs migration.

**Recommended approach:**
1. Archive the current repo state as `v1-prototype` branch or a separate archive repo
2. Create new repo `summers-ranch-v2` OR use the same repo with a clean main branch
3. All Phase 1 work happens in the fresh codebase
4. Current prototype stays live on mrsummersranch.com until v2 is ready
5. DNS cutover when v2 is production-ready

---

## Step 1 — Scaffold

### Create
```
summers-ranch-v2/
├── src/
│   ├── components/
│   │   ├── cattle/
│   │   ├── gallery/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── home/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── gallery/
│   │   │   └── index.astro
│   │   └── herd/
│   │       ├── index.astro
│   │       └── [animalId].astro
│   ├── lib/
│   │   ├── cattle/
│   │   ├── media/
│   │   ├── ribbons/
│   │   └── derive/
│   ├── schemas/
│   │   ├── animal.ts
│   │   ├── media.ts
│   │   ├── link.ts
│   │   ├── derived.ts
│   │   └── site.ts
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── public/
│   └── favicon + static assets
├── data/
│   └── seed/
│       ├── animals.json
│       ├── media.json
│       └── links.json
├── package.json
├── astro.config.mjs
├── tsconfig.json
└── README.md
```

### Dependencies
```json
{
  "dependencies": {
    "astro": "^4.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@astrojs/check": "latest"
  }
}
```

### TypeScript config
- Strict mode
- `noImplicitAny`, `strictNullChecks`
- Path aliases: `@/*` → `src/*`, `@schemas/*` → `src/schemas/*`

### Astro config
- Site URL: https://mrsummersranch.com
- Default language: en
- Output: static
- Image service: Astro's built-in (Cloudflare-compatible)

---

## Step 2 — Design tokens and layouts

### Design tokens (`src/styles/tokens.css`)

Transpose the current palette:
```css
:root {
  /* Palette */
  --color-earth: #4a3928;
  --color-saddle: #8b6914;
  --color-gold: #c8941e;
  --color-rust: #8a3921;
  --color-sage: #6b7f5e;
  --color-stone: #7a756f;
  --color-cream: #faf6ef;
  --color-linen: #ede5d3;
  --color-warm-white: #fffdf9;

  /* Typography */
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'Lato', sans-serif;

  /* Scales */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;

  /* Radii, shadows, etc. */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}
```

### Base layout
- `<BaseLayout>` component with:
  - Meta tags (title, description, OG tags)
  - Navigation component
  - Footer component with auto-year
  - Favicon
  - Google Fonts link (Cormorant + Lato)
  - Theme CSS

### Navigation component
Home, About, Herd, Gallery, Contact, What's Next (roadmap optional v1)

---

## Step 3 — Schemas (Zod)

Port the TypeScript interfaces from `RECOMMENDED-ARCHITECTURE.md` into Zod schemas.

### `src/schemas/animal.ts`
```typescript
import { z } from 'zod';

export const SexSchema = z.enum(['bull', 'cow', 'heifer', 'steer', 'calf']).nullable();
export const StatusSchema = z.enum(['breeding', 'sale', 'sold', 'retained', 'culled', 'deceased', 'reference']).nullable();
export const SourceSchema = z.enum(['herd', 'purchased', 'reference']).nullable();

export const TagHistoryEntrySchema = z.object({
  tag: z.string(),
  normalizedTag: z.string(),
  effectiveStart: z.string(),
  effectiveEnd: z.string().nullable(),
  reason: z.enum(['birth-default', 'weaning-retag', 'correction', 'replacement-tag', 'initial', 'unknown']),
  qualifier: z.string().nullable(),
  isDisplayTagAtThatTime: z.boolean(),
});

export const AnimalSchema = z.object({
  animalId: z.string().uuid(),
  displayTag: z.string(),
  normalizedTag: z.string(),
  tagHistory: z.array(TagHistoryEntrySchema),
  name: z.string().nullable(),
  species: z.literal('cattle'),
  sex: SexSchema,
  status: StatusSchema,
  // ... full schema from RECOMMENDED-ARCHITECTURE.md
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Animal = z.infer<typeof AnimalSchema>;
```

### `src/schemas/media.ts`
### `src/schemas/link.ts`
### `src/schemas/derived.ts`
### `src/schemas/site.ts`

All inferred types exported. All data loading validates through Zod.

---

## Step 4 — Seed data

Create minimal placeholder data for development:

### `data/seed/animals.json`
3-4 example animals with complete records:
- One adult cow with photos and full metadata
- One bull with partial data
- One calf sharing dam's tag (isProvisionalTag: true)
- One reference animal (outside sire)

### `data/seed/media.json`
10-15 example media assets linking to the animals

### `data/seed/links.json`
CattleMediaLink entries connecting them

### Loader utility
```typescript
// src/lib/data.ts
import { AnimalSchema } from '@schemas/animal';
import animals from '../../data/seed/animals.json';

export const allAnimals = animals.map(a => AnimalSchema.parse(a));
// Throws at build time if data is invalid
```

This is the pattern for data loading: parse through Zod at build time. Bad data never reaches the pages.

---

## Step 5 — Home page

Build first since it's the simplest and proves the layout works.

### Content
- Hero section with placeholder image (will become seasonal rotation later)
- Ranch intro paragraph (port from current site)
- "The Herd" teaser: show 3 random animals with link to `/herd`
- Family story excerpt with link to `/about`
- Theodore mascot section with "Junior Ranch Hand" label
- Contact CTA

### Components built
- `<Hero>` — seasonal hero with optional caption
- `<AnimalCardPreview>` — compact card for home teasers
- `<StoryExcerpt>` — reusable content block
- `<CTASection>` — generic call-to-action

---

## Step 6 — Herd index page

Build second. This is the most important public page.

### Page: `src/pages/herd/index.astro`

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import AnimalCard from '@/components/cattle/AnimalCard.astro';
import HerdFilters from '@/components/cattle/HerdFilters.astro';
import { allAnimals } from '@/lib/data';
import { computeDerivedState } from '@/lib/derive';

const visibleAnimals = allAnimals.filter(a => a.publicVisible);
const enriched = visibleAnimals.map(a => ({
  animal: a,
  derived: computeDerivedState(a)
}));
---

<BaseLayout title="The Herd — Summers Ranch">
  <h1>The Herd</h1>
  <HerdFilters client:load />
  <div class="herd-grid">
    {enriched.map(e => <AnimalCard {...e} />)}
  </div>
</BaseLayout>
```

### Components
- `<AnimalCard>` — single card with:
  - Display tag
  - Name if present
  - Ribbon zones
  - Soft cycling through canonical views (client:idle island)
  - Click to detail page
- `<HerdFilters>` — interactive filter/sort controls (client:load island)
- `<Ribbon>` — displays primary and secondary ribbons

### Derivation logic (`src/lib/derive/`)
- `computeCanonicalViews(animalId, media, links)` → returns `{ side, head, threeQuarter }`
- `computeRibbons(animal)` → returns `RibbonFlag[]`
- `computeAge(birthDate)` → returns "4 years", "6 months", etc.

---

## Step 7 — Cattle detail page

### Page: `src/pages/herd/[animalId].astro`

```astro
---
export async function getStaticPaths() {
  const { allAnimals } = await import('@/lib/data');
  return allAnimals
    .filter(a => a.publicVisible)
    .map(animal => ({ params: { animalId: animal.animalId }, props: { animal } }));
}

const { animal } = Astro.props;
// ... load media and links, compute derived state
---

<BaseLayout title={`${animal.displayTag} — The Herd`}>
  <AnimalHero animal={animal} hero={canonicalViews.side} />
  <FeaturedShots canonicalViews={canonicalViews} />
  <AnimalBasics animal={animal} />
  <ExpandableSection title="Performance" show={hasPerformanceData}>
    <PerformanceDetails animal={animal} />
  </ExpandableSection>
  <ExpandableSection title="Lineage" show={hasLineage}>
    <Lineage animal={animal} />
  </ExpandableSection>
  {animal.status === 'sale' && <InquireCTA animal={animal} />}
  <GrowthTimeline media={allMediaForAnimal} />
</BaseLayout>
```

### Components
- `<AnimalHero>` — large canonical image
- `<FeaturedShots>` — side/head/three-quarter thumbnails
- `<AnimalBasics>` — tag, name, born, breed, sex, dam, sire
- `<ExpandableSection>` — progressive disclosure wrapper
- `<PerformanceDetails>` — weights, calving ease, disposition
- `<Lineage>` — pedigree display (text-only in v1)
- `<InquireCTA>` — sale-specific call-to-action
- `<GrowthTimeline>` — chronological photo grid with dates

### Tag-based redirect
`src/pages/herd/tag/[tag].astro` — looks up animalId from display tag or tag history, 301 redirects to canonical URL

---

## Step 8 — About, Gallery, Contact pages

### About
Port existing content. Sections: family story, property, hunting. Static.

### Gallery
Index page showing all non-cattle media in documentary style. Lightbox component as interactive island.

### Contact
Formspree form (existing endpoint ID: mzdybyjl). Info section.

---

## Step 9 — Deploy to Cloudflare Pages

### Setup
1. Mark creates Cloudflare account if he doesn't have one (confirm first)
2. Connect GitHub repo to Cloudflare Pages
3. Build command: `npm run build`
4. Build output: `dist/`
5. Environment variables: none needed yet
6. Custom domain: preview first, then mrsummersranch.com when ready

### Preview
Cloudflare automatically creates preview URLs for each PR. Mark can review each phase before merge.

---

## What Phase 1 produces

A public site with:
- Home, About, Gallery, Contact pages rendered from content
- Herd index with placeholder cattle
- Cattle detail pages with full structure
- Soft cycling cards
- Progressive disclosure
- Schema-validated data at build time
- Clean URLs with animalId as canonical

What Phase 1 does NOT include:
- Admin panel
- Live photo pipeline
- R2 integration
- Worker endpoints
- iOS shortcut integration
- Real data

That's Phase 2.

---

## Things to validate in Phase 1

Before moving to Phase 2:
- [ ] Public site renders correctly on mobile and desktop
- [ ] Animal card cycling works smoothly
- [ ] Progressive disclosure feels natural
- [ ] Build time is fast (<30s for small seed data)
- [ ] Schema validation catches malformed data
- [ ] Ribbon system displays correctly
- [ ] All animals navigable via both animalId and old-tag URLs
- [ ] Accessibility baseline: keyboard nav, focus states, alt text
- [ ] No console errors
- [ ] Lighthouse score: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO

---

## Phase 2 preview (don't build yet)

- Cloudflare R2 bucket setup
- Worker endpoint for photo uploads
- Processing pipeline (EXIF extraction, classification, variants)
- Admin panel with herd management
- Media review queue
- Live data integration

---

## Notes for the implementing agent

- Mark is not a web developer. He can direct product but will defer on technical decisions. Explain stack choices as you go.
- Don't ship without testing. Every feature that looks small has edge cases.
- The current prototype has valuable UX details encoded in it. Read `BEHAVIOR-PRESERVATION-CHECKLIST.md` thoroughly.
- The previous agent (me, whoever's reading this) spent a lot of time on copy, tooltips, and industry terminology. Port those carefully.
- Anthropic API key is in repo secrets. Don't worry about auth for classification yet — that's Phase 2.
- The current iOS shortcut works. Document the Phase 2 endpoint change so Mark can update the shortcut when ready.

Good luck. Ask Mark before making architectural decisions he didn't explicitly approve.
