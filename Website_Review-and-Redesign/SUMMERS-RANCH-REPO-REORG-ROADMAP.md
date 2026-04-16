# Summers Ranch Repo Reorganization and Roadmap

## Purpose

This roadmap reflects the newer project understanding:

- the site is pre-launch
- the photo pipeline is central
- cattle/media/admin behavior matters as much as the public pages
- future private features are expected, even if not immediate

## Main recommendation

Keep a **single main implementation repo** during the rebuild, but organize it like a product instead of a loose static site.

## Conceptual product layers

1. **Public brand site**
2. **Public herd catalog**
3. **Private/admin workflow**
4. **Media ingestion and curation pipeline**

## Recommended project structure

```text
summers-ranch/
  src/
    components/
      cattle/
      gallery/
      layout/
      admin/
      ui/
    layouts/
    pages/
      index.astro
      about.astro
      herd/
        index.astro
        [animalId].astro
      gallery/
        index.astro
      contact.astro
      admin/
        index.astro
        cattle.astro
        media.astro
    lib/
      cattle/
      media/
      ribbons/
      transforms/
      validation/
    data/
      derived/
      enums/
  public/
    icons/
    static/
  schemas/
    cattle.ts
    media.ts
    site.ts
    ribbons.ts
    seasonal.ts
  docs/
    architecture/
    cattle/
    integrations/
    product/
    workflows/
  scripts/
    processing/
    exports/
```

## Data boundary rule

Never let raw files in folders be the real content model.

Separate:
- raw records
- derived state
- public presentation state

That applies to both cattle and media.

## Herd UX goals

### Herd index
- show all cattle cards
- each card shows the current display tag
- show name if present
- show lightweight status/highlight ribbons
- softly cycle between the three canonical public views:
  - side
  - head-on
  - three-quarter

### Cattle detail
- show full photo history in date order
- allow “watch the animal grow up” timeline behavior
- keep initial details light
- progressively reveal deeper data

## Admin UX goals

The admin should let a non-technical ranch user:
- review cattle data
- review media assignments
- hide/delete/reorder/reassign images
- override AI classifications when needed
- see stale-photo nudges
- prepare cattle for public readiness and registration readiness

## Media goals

The rebuild must support two main lanes:

### Lane A — cattle photo lane
- iPhone Share Sheet intake
- tag-based routing
- canonical three-view selection
- timeline accumulation over time

### Lane B — general/gallery lane
- iPhone or DSLR/drone intake
- seasonal/hero/gallery curation
- less rigid than cattle-photo lane

## Future-compatible, not overbuilt

The rebuild should allow future additions without requiring a structural rewrite:
- buyer accounts
- order history
- merch/shop
- browser uploads
- richer role-based admin
- private customer views

## Roadmap order

1. Freeze prototype and keep it as reference
2. Rebuild foundation in Astro
3. Implement canonical schemas
4. Rebuild public pages
5. Rebuild herd and cattle detail UX
6. Rebuild media/admin tooling
7. Stabilize ingestion and curation
8. Add future private features when needed

## Recommendation

Reorganize now around the long-term product shape.

Do not keep the current repo structure just because it already exists.
