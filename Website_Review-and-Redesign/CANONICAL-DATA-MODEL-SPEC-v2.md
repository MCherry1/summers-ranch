# Summers Ranch Canonical Data Model Spec — v2

> **IMPORTANT NOTE:** `RECOMMENDED-ARCHITECTURE.md` contains the current authoritative schema. This document contains the earlier detailed design. Where they differ (e.g., shot type vocabulary, AHA readiness states), `RECOMMENDED-ARCHITECTURE.md` wins. This document remains valuable for the design reasoning and extended schemas (CattleMediaLink, RibbonFlag, SeasonalMediaSelection) that it defines.

## Design decisions incorporated

### 1) Identity model
- Every animal gets an internal immutable `animalId` used by the website and database.
- `displayTag` is the current visible ranch tag.
- `tagHistory[]` stores previous tags, effective dates, and reasons.
- Tags are **usually stable** but not globally immutable.
- Tags are **not guaranteed unique across all time** because calves may temporarily share the dam's tag before weaning.

### 2) Calf identity model
- A calf created through calf intake gets its own immutable `animalId` immediately.
- It may initially have:
  - `displayTag = damTag`
  - `isProvisionalTag = true`
  - `tagQualifier` such as `calf`, `heifer calf`, `bull calf`, or a short suffix used internally
- When weaned and assigned a new tag, only `displayTag` changes.
- Photo history, metadata, and relationships stay attached to `animalId`.
- The system must never key photo history only by tag.

### 3) Public herd card labeling
- Public cards should always show the tag.
- If a name exists, show it too.
- Recommended display:
  - primary line: `Tag 209`
  - secondary emphasized line: `Ethel`
- If no name exists, show tag only.
- Herd index should support sorting by tag.

### 4) Public herd card image behavior
Each herd card targets three canonical current images:
- side view
- head-on view
- three-quarter view

These should be:
- the most recent acceptable image for each view
- selected automatically from classified assets
- gently rotated on the card
- overridable by admin

### 5) Detail page media behavior
Each cattle detail page shows:
- all public-approved images for that animal
- chronological ordering by capture date
- a growth/timeline mode
- progressive disclosure for deeper cattle details

### 6) Metadata handling
- Public images should have privacy-sensitive EXIF stripped.
- Useful extracted metadata may be retained in private records linked to the media asset.
- At minimum, preserve capture date for public chronology.
- Any location/device metadata retained for future analysis must remain private.

---

## Core entities

## A. Animal

Canonical identity for one real animal.

```ts
interface Animal {
  animalId: string;                // internal immutable ID, UUID/ULID
  displayTag: string;              // current visible tag
  normalizedTag: string;           // sortable/searchable normalized tag
  hasName: boolean;
  name?: string | null;

  species: 'cattle';
  sex?: 'bull' | 'cow' | 'heifer' | 'steer' | 'calf' | null;
  status?: 'breeding' | 'sale' | 'sold' | 'retained' | 'prospect' | 'archived' | null;
  roleFlags: {
    breeder?: boolean;
    forSale?: boolean;
    sold?: boolean;
    featured?: boolean;
    pregnant?: boolean;
    donor?: boolean;
    herdSire?: boolean;
    showString?: boolean;
  };

  lifecycle: {
    birthDate?: string | null;     // ISO date if known
    deathDate?: string | null;
    ageClass?: 'newborn' | 'calf' | 'weanling' | 'yearling' | 'adult' | 'senior' | null;
    isCalfAtSide?: boolean;
  };

  lineage: {
    sireAnimalId?: string | null;
    damAnimalId?: string | null;
    sireDisplay?: string | null;   // fallback display if not in system
    damDisplay?: string | null;
  };

  registry: {
    registrationNumber?: string | null;
    tattoo?: string | null;
    breed?: string | null;
    breedDetail?: string | null;
    ahaReadiness?: 'not-started' | 'partial' | 'ready' | 'submitted' | 'registered' | null;
  };

  publicProfile: {
    visible: boolean;
    sortTagOverride?: string | null;
    headlineStatus?: string | null;
    shortNotes?: string | null;
  };

  createdAt: string;
  updatedAt: string;
}
```

## B. Tag history

```ts
interface AnimalTagHistory {
  tagEventId: string;
  animalId: string;
  tag: string;
  normalizedTag: string;
  effectiveStart?: string | null;
  effectiveEnd?: string | null;
  reason: 'birth-default' | 'weaning-retag' | 'correction' | 'replacement-tag' | 'unknown';
  qualifier?: string | null;       // e.g. calf, twin A, red tag, temporary
  isDisplayTagAtThatTime: boolean;
}
```

Use this for:
- calves temporarily sharing the dam's tag
- later retagging at weaning
- preserving old filenames/search terms

## C. MediaAsset

Represents one uploaded image plus processing state.

```ts
interface MediaAsset {
  mediaId: string;
  sourceKind: 'share-sheet-cattle' | 'share-sheet-gallery' | 'dslr-hero' | 'browser-upload' | 'imported';

  originalFilename: string;
  sourceKey: string;               // object key / inbox path / storage reference
  sourceBatchId?: string | null;

  associatedAnimalId?: string | null;   // canonical link if known
  submittedTag?: string | null;         // tag entered at upload time
  submittedMode?: 'cattle' | 'gallery' | 'hero' | 'other' | null;

  timestamps: {
    uploadedAt: string;
    capturedAt?: string | null;
    processedAt?: string | null;
  };

  classification: {
    subjectType?: 'single-animal' | 'group' | 'landscape' | 'hero' | 'detail' | 'unknown';
    shotType?: 'side' | 'head' | 'three-quarter' | 'rear' | 'close-detail' | 'group' | 'landscape' | 'unknown';
    confidence?: number | null;    // 0..1
    qualityScore?: number | null;  // 0..1
    autoAccepted: boolean;
    needsReview: boolean;
  };

  privacy: {
    publicEligible: boolean;
    hidden: boolean;
    deleted: boolean;
    metadataPrivateRef?: string | null;
  };

  derivatives: {
    originalPreserved: boolean;
    publicOriginalKey?: string | null;
    cardKey?: string | null;
    detailKey?: string | null;
    thumbKey?: string | null;
    heroKey?: string | null;
  };

  createdAt: string;
  updatedAt: string;
}
```

## D. CattleMediaLink

This is where presentation logic lives.

```ts
interface CattleMediaLink {
  linkId: string;
  animalId: string;
  mediaId: string;

  visibility: {
    showOnCard: boolean;
    showOnDetail: boolean;
    showInTimeline: boolean;
  };

  roles: {
    canonicalShot?: 'side' | 'head' | 'three-quarter' | null;
    isPrimaryCardCandidate: boolean;
    isTimelineCandidate: boolean;
  };

  ordering: {
    manualSortOrder?: number | null;
    timelineOrder?: number | null;
  };

  override: {
    shotTypeOverride?: 'side' | 'head' | 'three-quarter' | 'rear' | 'detail' | null;
    forceInclude: boolean;
    forceExclude: boolean;
  };

  createdAt: string;
  updatedAt: string;
}
```

## E. DerivedCattleState

Computed, not manually edited.

```ts
interface DerivedCattleState {
  animalId: string;

  canonicalViews: {
    sideMediaId?: string | null;
    headMediaId?: string | null;
    threeQuarterMediaId?: string | null;
    lastRefreshedAt?: string | null;
    completeness: 0 | 1 | 2 | 3;
  };

  timeline: {
    firstPhotoDate?: string | null;
    latestPhotoDate?: string | null;
    publicPhotoCount: number;
  };

  nudges: {
    missingSide: boolean;
    missingHead: boolean;
    missingThreeQuarter: boolean;
    staleCardImagery: boolean;
    lowConfidenceMediaPending: boolean;
  };

  ribbons: RibbonFlag[];
}
```

## F. RibbonFlag

Use structured flags, not hard-coded graphics.

```ts
interface RibbonFlag {
  ribbonId: string;
  animalId: string;
  zone: 'primary-status' | 'secondary-highlight';
  type:
    | 'for-sale'
    | 'sold'
    | 'breeder'
    | 'birthday'
    | 'featured'
    | 'auction'
    | 'new-calf'
    | 'retained';
  label: string;
  priority: number;
  activeFrom?: string | null;
  activeUntil?: string | null;
  autoGenerated: boolean;
}
```

## G. SeasonalMediaSelection

```ts
interface SeasonalMediaSelection {
  selectionId: string;
  slot: 'home-hero' | 'home-secondary' | 'gallery-featured' | 'season-banner';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'monthly';
  startDate?: string | null;
  endDate?: string | null;
  mediaIds: string[];
  rotationMode: 'static' | 'soft-cycle' | 'random-pool';
  active: boolean;
}
```

---

## Decision rules based on your answers

### Identity and tags
- **Primary key is `animalId`, not tag.**
- Tag changes must not break history.
- Calves can temporarily share a dam tag because they are separate animals with different `animalId` values.
- Photo ingestion must attach to `animalId` whenever determinable, and otherwise attach provisionally via submitted tag + review state.

### Public card labeling
Recommended rendering order:
1. Tag always visible
2. Name visible if present
3. Minimal headline status/badge

Example:
- `Tag 209`
- `Ethel`
- ribbon: `Breeder`

### Tag sorting
Store and render with a sortable normalized field. This matters for mixed tags like `109A`, `209`, `TY124`.

---

## Ribbon system recommendation

Because you want different corners for different meanings:

### Primary status zone
Use one corner only for major commercial/lifecycle state:
- for sale
- sold
- retained
- breeder

Only one should dominate at a time.

### Secondary highlight zone
Use another corner for lighter or time-limited states:
- birthday
- auction
- featured
- new calf

This prevents clutter.

---

## Timeline density

This means: how many photos and date markers should the detail page show before it feels crowded.

Recommended default:
- show all public timeline photos in chronological order
- on mobile, lazy load and cluster by month/year
- visually emphasize milestone intervals rather than dense text labels

Practical rule:
- calves: dense timeline is acceptable
- adults: compress repeated near-duplicate intervals more aggressively

---

## Staleness thresholds

Your intuition is correct: it should vary by age.

Recommended starting thresholds:
- newborn calf: nudge after 30 days
- calf: nudge after 60 days
- weanling/yearling: nudge after 90 days
- adult: nudge after 180–365 days depending on status
- for-sale animal: use shorter thresholds than retained adult breeders

This should be configurable, not hard-coded.

---

## AI auto-accept thresholds

Do not bury these in magic numbers. Keep them configurable.

Recommended starting policy:
- if confidence is high and quality is acceptable, auto-accept into candidate pool
- if confidence is moderate, keep but mark for review
- if confidence is low, do not publish automatically

Practical starting bands:
- >= 0.90: auto-accept
- 0.70–0.89: review-queued but usable privately
- < 0.70: review required before public use

These are starting values only and should be tuned with real uploads.

---

## Option B vs Option C explained plainly

### Option B — storage + processing + mostly static site
This means:
- photos go to object storage (for example R2)
- a Worker/job processes them
- structured records are written out
- Astro renders the public site from those records
- only admin/media actions are dynamic where needed

Use this when you want:
- simpler, cheaper architecture
- fast public pages
- low maintenance
- strong fit for media-heavy catalog sites

### Option C — full application backend from day one
This means:
- uploads
- auth
- database
- admin
- user accounts
- private areas
- dynamic routes
- maybe commerce/order history
all built as a more complete application stack from the beginning.

Use this when you know you immediately need:
- lots of authenticated user behavior
- buyer accounts now
- order history now
- transactional shop now
- heavy private workflows now

### Recommendation
For Summers Ranch, **Option B is the better starting point**.

Reason:
- your public site is still primarily content/media/catalog driven
- your hardest real problem is media ingestion and curation
- you do not yet need a full custom app for buyers
- Option B leaves room to grow into Option C later

So the correct-from-the-beginning choice is not necessarily the biggest system. It is the smallest system that cleanly matches the real product.
