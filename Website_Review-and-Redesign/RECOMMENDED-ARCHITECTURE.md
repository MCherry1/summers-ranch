# Summers Ranch — Recommended Architecture

*Authoritative document. Consolidates and supersedes the scattered redesign specs.*

---

## The one-line summary

Build a media-first, schema-driven, static-first site with Astro + TypeScript. Object storage (Cloudflare R2) for media. Workers for processing. Structured data for cattle identity. Design now so that future buyer accounts and commerce can be added later without a rewrite.

---

## Stack decision

### Primary stack
- **Astro** — static site generator, content-first, optional interactive islands
- **TypeScript** with strict mode
- **Cloudflare Pages** — hosting, build/deploy automation, free preview branches
- **Cloudflare R2** — S3-compatible object storage for all media
- **Cloudflare Workers** — photo processing pipeline and upload endpoints
- **Zod** (or similar) — runtime schema validation for all data models

### Why this stack
Astro is designed for fast, content-focused sites and by default ships zero JavaScript unless explicitly opted into. The public herd catalog is exactly this shape — rendered once from data, occasionally interactive. Cloudflare R2 is object storage with strong consistency, better than git-as-inbox. Workers replace the GitHub Actions pipeline with something that can be triggered by uploads directly rather than by commits.

### Why not a full app framework (Next.js, SvelteKit, etc.)
The public site is primarily content. A full SSR/app framework adds operational complexity the product doesn't need yet. Astro can add React/Svelte islands where interactivity matters. Future dynamic features (buyer portal, shop) can be added as Astro API routes or as a separate app layer sharing the schema — without a rewrite of the public site.

### Why not D1 (Cloudflare's SQL) yet
The data model is small (dozens of animals, hundreds of media assets). JSON files in the repo committed by admin actions work fine for this scale. Move to D1 when the private layer needs it (buyer accounts, orders).

---

## The canonical data model

This is the core architectural decision. Read carefully.

### Animals

```typescript
interface Animal {
  // Identity
  animalId: string              // UUID/ULID. IMMUTABLE. Permanent internal identity.
  displayTag: string            // Current visible ear tag. Can change over time.
  normalizedTag: string         // Uppercase, sortable representation of displayTag.
  tagHistory: TagHistoryEntry[] // All previous tags with dates and reasons.
  
  // Descriptive
  name: string | null
  species: 'cattle'
  sex: 'bull' | 'cow' | 'heifer' | 'steer' | 'calf' | null
  status: 'breeding' | 'sale' | 'sold' | 'retained' | 'culled' | 'deceased' | 'reference' | null
  
  // Relationships (by animalId, not tag)
  sireAnimalId: string | null
  damAnimalId: string | null
  sireDisplayFallback: string | null  // For outside genetics not in system
  damDisplayFallback: string | null
  
  // Calf-specific
  calfStatus: 'nursing' | 'weaned' | null
  isProvisionalTag: boolean  // true when sharing dam's tag
  
  // Lifecycle
  birthDate: string | null   // ISO date
  deathDate: string | null
  dateEntered: string | null  // When joined the herd
  source: 'herd' | 'purchased' | 'reference' | null
  sourceRanch: string | null
  acquisitionMethod: 'private-treaty' | 'auction' | 'consignment' | 'production' | 'online' | 'other' | null
  showSourcePublicly: boolean
  
  // Performance
  birthWeight: number | null
  weaningWeight: number | null
  yearlingWeight: number | null
  calvingEase: 1 | 2 | 3 | 4 | 5 | null
  disposition: 1 | 2 | 3 | 4 | 5 | 6 | null
  
  // Registration
  registrationNumber: string | null
  tattoo: string | null
  breed: string | null
  breedDetail: string | null
  ahaReadiness: 'not-applicable' | 'not-started' | 'in-progress' | 'ready-for-owner-review' | 'ready-for-submission' | 'submitted' | 'registered' | 'blocked' | null
  
  // Breeding
  pregnancyStatus: 'open' | 'bred' | 'confirmed' | null
  pregnancySetDate: string | null  // When status last changed to bred/confirmed
  expectedCalving: string | null   // Loose format: "Spring 2026", "2026-03-15"
  
  // Sale (always private)
  soldTo: string | null
  saleMethod: string | null
  saleDate: string | null
  saleNotes: string | null
  
  // Removal (always private)
  removalDate: string | null
  removalReason: string | null
  
  // Management
  branded: boolean
  notes: string | null
  
  // Public visibility
  publicVisible: boolean
  
  createdAt: string
  updatedAt: string
}

interface TagHistoryEntry {
  tag: string
  normalizedTag: string
  effectiveStart: string
  effectiveEnd: string | null
  reason: 'birth-default' | 'weaning-retag' | 'correction' | 'replacement-tag' | 'initial' | 'unknown'
  qualifier: string | null  // e.g., "calf of #209", "twin A"
  isDisplayTagAtThatTime: boolean
}
```

### Media assets

```typescript
interface MediaAsset {
  mediaId: string              // UUID. Immutable.
  sourceKind: 'share-sheet-cattle' | 'share-sheet-gallery' | 'dslr-hero' | 'browser-upload'
  
  // Storage
  originalKey: string          // R2 object key for original
  publicKey: string | null     // R2 object key for public-safe version
  cardKey: string | null       // R2 object key for card thumbnail
  thumbKey: string | null
  
  // Association
  associatedAnimalId: string | null
  submittedTag: string | null  // What the user typed
  submittedMode: 'cattle' | 'gallery' | null
  
  // Timing
  uploadedAt: string
  capturedAt: string | null    // From EXIF DateTimeOriginal
  processedAt: string | null
  
  // Classification
  subjectType: 'single-animal' | 'group' | 'landscape' | 'hero' | 'detail' | 'unknown' | null
  shotType: 'side' | 'head' | 'three-quarter' | 'rear' | 'in-pasture' | 'with-handler' | 'group' | 'close-detail' | 'landscape' | 'hero-landscape' | 'gallery-general' | 'unknown' | null   // authoritative vocabulary — overrides older docs that have subsets
  boundingBox: [number, number, number, number] | null  // left%, top%, right%, bottom%
  focalPoint: [number, number] | null  // x%, y%
  quality: 'excellent' | 'good' | 'fair' | 'poor' | null
  confidence: number | null    // 0..1
  autoAccepted: boolean
  needsReview: boolean
  
  // Privacy
  publicEligible: boolean
  hidden: boolean
  deleted: boolean  // soft delete
  
  // Processing state
  state: 'received' | 'processing' | 'classified' | 'published' | 'failed' | 'review-queue'
  processingErrors: string[]
  
  // Private metadata (preserved from EXIF before stripping)
  privateMetadata: {
    originalFilename: string
    exifDate: string | null
    gpsLocation: [number, number] | null  // Never exposed publicly
    device: string | null
    dimensions: { width: number, height: number }
    fileHash: string
    fingerprint: string | null
  }
  
  createdAt: string
  updatedAt: string
}
```

### Cattle-Media links

Separating animals from media lets us have M:N relationships, reassign photos without losing history, and compute derived views without mutating source data.

```typescript
interface CattleMediaLink {
  linkId: string
  animalId: string
  mediaId: string
  
  showOnCard: boolean
  showOnDetail: boolean
  showInTimeline: boolean
  
  canonicalShot: 'side' | 'head' | 'three-quarter' | null
  isPrimaryCardCandidate: boolean
  isTimelineCandidate: boolean
  
  manualSortOrder: number | null
  shotTypeOverride: string | null
  forceInclude: boolean
  forceExclude: boolean
  
  createdAt: string
  updatedAt: string
}
```

### Derived state

Computed at build time (or on change). Never manually edited.

```typescript
interface DerivedCattleState {
  animalId: string
  
  canonicalViews: {
    sideMediaId: string | null
    headMediaId: string | null
    threeQuarterMediaId: string | null
    completeness: 0 | 1 | 2 | 3
    lastRefreshedAt: string
  }
  
  timeline: {
    firstPhotoDate: string | null
    latestPhotoDate: string | null
    publicPhotoCount: number
  }
  
  nudges: NudgeFlag[]
  ribbons: RibbonFlag[]
}

interface RibbonFlag {
  zone: 'primary-status' | 'secondary-highlight'
  type: 'for-sale' | 'sold' | 'breeder' | 'retained' | 'birthday' | 'featured' | 'new-calf' | 'auction'
  label: string
  priority: number
  autoGenerated: boolean
}

interface NudgeFlag {
  type: 'missing-side' | 'missing-head' | 'missing-three-quarter' | 'stale-card-imagery' | 'low-confidence-pending' | 'unbranded' | 'missing-basics' | 'sale-no-photo' | 'pregnancy-overdue' | 'multiple-calves-same-dam'
  priority: 'high' | 'medium' | 'low'
  label: string
  animalId: string
}
```

---

## Why this schema solves our problems

**Calves share dam tags cleanly:** The calf gets its own `animalId` immediately. `displayTag` mirrors the dam's tag with `isProvisionalTag: true`. Photos attach to `animalId`. When the calf is weaned, only `displayTag` changes, plus an entry in `tagHistory`. No photo renames. No orphan detection. No `formerly` field.

**Retagging is trivial:** Change `displayTag`, push a new `tagHistory` entry, done. Photos don't move. Derived state refreshes.

**Tag reuse is survivable:** Dam #209 sold, new animal gets tag #209. They have different `animalId`s. Calves of old #209 still reference the correct dam via `damAnimalId`, not tag lookup.

**Photo history never breaks:** Photos link to animals by `animalId`. Tag changes, name changes, status changes all leave photos attached.

**Admin overrides are first-class:** `CattleMediaLink` has explicit override fields. AI suggests; admin decides; both are recorded.

---

## The media pipeline (new architecture)

### Input paths
1. **iPhone Share Sheet (cattle)** — tag + optional calf number, uploads to Worker endpoint
2. **iPhone Share Sheet (gallery)** — no tag input, uploads to Worker endpoint
3. **Browser upload (admin)** — Marty picks an animal, uploads from laptop (future)
4. **DSLR/drone upload (admin)** — for hero/landscape content (future)

### Processing state machine

```
received → validating → processing → classified → (auto-accepted ? published : review-queue)
                                                                            ↓
                                                                        (admin reviews)
                                                                            ↓
                                                                        published or hidden
```

### What processing does
1. Extract EXIF (date, GPS, dimensions, device) → store in `privateMetadata`
2. Compute SHA hash + fingerprint for duplicate detection
3. Check against existing assets in appropriate namespace
4. If duplicate: mark and skip
5. Strip EXIF/GPS from a copy → `publicKey` version
6. Resize variants: card (400px), detail (1200px), thumb (150px)
7. If cattle: classify with Anthropic API (shot type, focal point, bounding box, quality)
8. Auto-compute canonical view candidates
9. Update `DerivedCattleState` for affected animals
10. Trigger site rebuild

### Why Workers over GitHub Actions
- Triggered by upload, not by git push (no race conditions)
- Direct write to R2 without going through git
- Parallel processing of multiple uploads
- Retryable state machine instead of linear script
- No 10-minute Actions warmup cycle

---

## Identity and routing

### Animal URLs
```
/herd                         — catalog index
/herd/[animalId]              — detail page (canonical)
/herd/tag/[displayTag]        — redirect to canonical URL
```

Tag-based URLs exist only as redirects to animalId-based canonical URLs. If the tag changes, old links still work via `tagHistory` lookup.

### Media URLs
Media served from R2 through a Cloudflare Worker that can enforce visibility rules. Public media has no auth. Admin-only media requires a session.

---

## Public page behavior

### Home
Hero image (rotating seasonal selection from `SeasonalMediaSelection`). Ranch brand story. Theodore mascot section. Calendar banner for active seasonal events. Minimal.

### About
Family story. Photos. Hunting section. The warm trust-building content.

### Herd catalog (`/herd`)
Grid of cattle cards. Each card:
- Shows current `displayTag` as primary identifier
- Shows `name` if present
- Ribbons in two zones (primary status + secondary highlight)
- Softly cycles through side → head → three-quarter views every 6 seconds
- Respects `prefers-reduced-motion`
- Pauses on hover/tap/focus
- Clicks through to `/herd/[animalId]`

Filter/sort controls: show all, for-sale, breeders, calves. Sort by tag, age, status.

### Cattle detail (`/herd/[animalId]`)
- All public-eligible photos for this animal in chronological order
- Timeline UI showing growth over time
- Progressive disclosure: basic info visible, registration/performance/lineage in expandable sections
- If for sale: prominent "Inquire About This Animal" CTA
- Date of each photo visible (from `capturedAt`, not upload date)

### Gallery
Documentary-oriented. Ranch life, hunting, family. Separate from cattle catalog. Seasonal curation.

### Contact
Formspree form. Clear contact info. No surprise requirements.

---

## Admin panel behavior

### Access
Password-protected. Session stored in secure HTTP-only cookie. Session expires after inactivity.

### Cattle tab
- Sortable herd list
- Add new animal → creates with generated `animalId`
- Edit animal → full form with tooltips on every field
- Remove from herd → soft delete, moves to archived state
- Restore from archive

### Media tab (new — didn't exist before)
- All recent uploads
- Needs-review queue for low-confidence classifications
- Per-media-asset controls: hide, delete, reassign to another animal, override shot type, force include/exclude from card
- Reorder timeline photos
- Manually select canonical views

### Calendar tab
- Events list (add, edit, delete, copy-to-next-year)
- Seasons (read-only, behavior-derived)
- Birthdays

### Nudges section (top of every tab)
- High priority: sale issues, unbranded cattle, overdue pregnancies
- Medium priority: missing basics
- Low priority: stale photos, missing canonical views
- Dismiss all → 24-hour localStorage timer → returns

---

## Privacy policy

### Always private (admin only)
- Sale details: who bought, for how much, notes
- Removal details: date, reason
- GPS coordinates from photos
- Device info from photos
- Pregnancy tracking internals (`pregnancySetDate`)
- Registration workflow state (until registered)

### Private by default, user-controllable
- Acquisition source ranch (checkbox to publish)
- Acquisition method (checkbox to publish)

### Always public
- Tag number, name, birth date
- Breed, sex, status (if populated)
- Photos with public eligibility
- Lineage (sire/dam tag/name references)
- Calving ease, disposition, weights (if populated)
- Registration number (if populated)

---

## What to build in order

See `PHASE-1-IMPLEMENTATION.md` for the detailed first-phase spec.

High level:
1. Astro scaffold + design tokens + layouts
2. TypeScript schemas for all data models (Zod validation)
3. Public pages rendering from seed data
4. Media pipeline Worker and R2 integration
5. Admin panel (cattle management first, media tools second)
6. iOS Shortcut integration with new Worker endpoint
7. Launch

---

## What NOT to build yet (future stages)

Do not build:
- Buyer accounts / auth
- Shop / commerce
- Order history
- D1 / SQL database
- Email notifications
- Newsletter signup
- Social media integration
- Advanced analytics

These are possible futures. The data model leaves room for them. They're not v1.

---

## Behavior preservation

Every feature listed in `BEHAVIOR-PRESERVATION-CHECKLIST.md` must work in the rebuild. Don't skip items — they exist because real iteration showed they were needed.

---

## Open questions for Mark

Things the new agent should confirm with Mark:

1. **Cloudflare account** — Does Mark already have one? The redesign needs Pages, R2, and Workers.
2. **Domain handling** — mrsummersranch.com currently via GitHub Pages. Cutover plan when v2 is ready?
3. **Password for admin** — Same password as current admin, or new one on launch?
4. **Photo migration** — Mark said no legacy to preserve. Confirm: toss all current photos, start fresh with new uploads after launch.
5. **Launch timing** — Target date for Marty's "reveal"?
