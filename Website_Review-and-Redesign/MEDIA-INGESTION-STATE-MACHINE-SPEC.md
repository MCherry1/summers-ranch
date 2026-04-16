# Media Ingestion State Machine Spec

## Purpose

This document defines the lifecycle of media in the Summers Ranch rebuild.

It is designed around three facts:
- the main operator is iPhone-first and non-technical
- cattle photos are the primary operational input to the system
- public presentation should be highly automated, but never rely on uncontrolled guesses

This spec should be used by coding agents implementing uploads, processing, review tools, and public presentation logic.

---

## Core principle

A photo is not immediately a public asset.

It moves through a sequence of states:
1. intake
2. processing
3. classification
4. review or auto-approval
5. public eligibility
6. presentation selection
7. archival / hide / delete

The public site should render from **approved structured media records**, not from arbitrary files in a folder.

---

## Identity model

### Media identity
Each uploaded asset gets a permanent internal `mediaId`.

This must not depend on:
- filename
- tag text
- storage path
- display order

### Animal linkage
Each photo can optionally be linked to an `animalId`.

Public display logic should use `animalId`, not tag text, as the canonical identity.

---

## Intake channels

### Channel A — Share Sheet cattle upload
Expected input:
- one or more photos
- declared cattle tag
- implicit source type = cattle

### Channel B — Share Sheet gallery upload
Expected input:
- one or more photos
- no cattle tag required
- implicit source type = gallery

### Channel C — browser/admin upload
Expected input:
- one or more photos
- optional animal assignment
- optional category override
- used later for richer curation

### Channel D — DSLR / deliberate upload
Expected input:
- one or more images
- likely hero/gallery use
- more deliberate review path

All four channels should converge into the same media state model.

---

## State machine overview

### State 0 — `received`
Meaning:
- upload successfully arrived
- file stored in intake location
- no guarantees yet about validity or classification

Entry conditions:
- upload accepted

Stored fields at this point:
- `mediaId`
- `sourceKind`
- `sourceUploadTimestamp`
- `originalFilename`
- `declaredTag` if supplied
- `uploaderContext`
- storage location of original

Transitions:
- to `validated`
- to `rejected`

### State 1 — `validated`
Meaning:
- file is readable
- file type is supported
- image dimensions and basic integrity pass checks

Validation checks:
- file decodes as image
- supported file type
- minimum resolution met
- not obviously corrupt

Transitions:
- to `normalized`
- to `rejected`

### State 2 — `normalized`
Meaning:
- original preserved
- EXIF stripped from public derivatives
- metadata extracted into private record
- standardized derivative pipeline begins

Actions:
- create private metadata record
- extract capture date if available
- extract optional GPS/device info into private store only
- create working derivatives for classification and preview

Transitions:
- to `classified`

### State 3 — `classified`
Meaning:
- system has attempted AI and rule-based interpretation

Expected outputs:
- probable `animalId` or unresolved declared tag mapping
- probable `shotType`
- confidence scores
- quality score
- crop/focus candidates
- probable media role (`cattle`, `gallery`, `heroCandidate`, `unknown`)

Allowed shot types:
*(Note: the authoritative, current vocabulary is in `RECOMMENDED-ARCHITECTURE.md`. The list below is a subset for illustration.)*
- `side`
- `head`
- `three-quarter`
- `group`
- `close-detail`
- `hero-landscape`
- `gallery-general`
- `unknown`

Transitions:
- to `autoApproved`
- to `needsReview`
- to `rejected`

### State 4A — `autoApproved`
Meaning:
- confidence and rules are strong enough that the system may safely make the asset eligible for public/admin use without manual intervention

Requirements for cattle photos:
- declared tag resolved to animal record or calf intake target
- shot type confidence above threshold
- image quality above threshold
- crop candidate acceptable
- no policy conflicts

Outputs:
- approved asset record
- derivatives generated
- link to animal/media timeline if cattle
- eligibility flags set

Transitions:
- to `publishedEligible`
- to `hidden`
- to `deleted`

### State 4B — `needsReview`
Meaning:
- asset is valid but not safe to trust fully without admin intervention

Typical reasons:
- low confidence shot classification
- ambiguous animal assignment
- poor crop candidate
- duplicate near-identical image
- suspected wrong category

Admin actions allowed:
- assign animal
- override shot type
- mark as gallery only
- hide
- delete
- approve

Transitions:
- to `reviewApproved`
- to `hidden`
- to `deleted`

### State 5 — `reviewApproved`
Meaning:
- a human accepted or corrected the record
- it is now eligible for public/admin presentation

Transitions:
- to `publishedEligible`
- to `hidden`
- to `deleted`

### State 6 — `publishedEligible`
Meaning:
- asset is allowed to participate in public rendering rules
- this does not guarantee it appears immediately on the site

Examples:
- cattle image may be eligible for card rotation
- cattle image may be timeline-only
- gallery image may be public but not featured
- hero candidate may be eligible but not selected this season

Transitions:
- to `selectedForCard`
- to `selectedForTimeline`
- to `selectedForGallery`
- to `selectedForHero`
- to `stale`
- to `hidden`
- to `deleted`

### State 7A — `selectedForCard`
Meaning:
- image is one of the public card images used for cattle herd cards

Rules:
- only one current selected image per animal per canonical card slot:
  - `side`
  - `head`
  - `threeQuarter`
- selected image should generally be the most recent acceptable image for that slot
- manual override may pin a different image

### State 7B — `selectedForTimeline`
Meaning:
- image appears in the detail-page chronological media timeline

Rules:
- most approved cattle photos should be timeline-eligible unless hidden
- ordering is chronological, with a stable tie-break rule

### State 7C — `selectedForGallery`
Meaning:
- image appears in the public ranch gallery or filtered gallery views

### State 7D — `selectedForHero`
Meaning:
- image is chosen for home/seasonal featured hero use

Rules:
- usually manual or scheduled curation with optional recommendation support

### State 8 — `stale`
Meaning:
- an asset may still be public, but the system considers the current canonical representation outdated enough to nudge for newer imagery

This is mainly a **nudge state**, not a removal state.

Staleness should be calculated on the selected canonical card slots per animal, not just per photo.

Suggested age-aware defaults:
- newborn calf: nudge after 30 days
- calf: nudge after 60–90 days
- yearling / growing juvenile: nudge after 120 days
- mature adult: nudge after 365 days
- sale animal with active marketing priority: shorter interval than ordinary breeding stock

Transitions:
- back to `selectedForCard` when newer canonical image selected
- to `hidden`
- to `deleted`

### State 9 — `hidden`
Meaning:
- asset retained privately but excluded from public use

Reasons:
- poor public quality
- duplicate
- awkward angle
- temporary suppression
- privacy concern

Transitions:
- back to `publishedEligible`
- to `deleted`

### State 10 — `deleted`
Meaning:
- asset removed from active use

Policy choice:
- either hard delete file and record
- or soft delete with retention window

Recommendation:
- use soft delete for a retention period, then hard delete if desired

---

## Canonical cattle card selection rules

Each animal should maintain three public card slots:
- `card.side`
- `card.head`
- `card.threeQuarter`

### Default selection algorithm
For each slot:
1. start with all `publishedEligible` cattle assets linked to the animal
2. filter by matching shot type
3. filter out hidden/deleted assets
4. prefer manually pinned image if present
5. otherwise choose the most recent acceptable image above confidence and quality thresholds
6. if no eligible image exists, leave slot empty

### Fallback rules
- if only one slot exists, card can render single still image
- if two exist, rotate between two
- if none exist, use neutral fallback image or suppress rotation entirely

---

## Timeline rules

### Goal
The timeline should let a user see the animal grow over time without becoming overwhelming.

### Inclusion rules
Include:
- approved cattle images linked to the animal
- ordered by capture date, then upload date, then mediaId

Exclude by default:
- hidden assets
- deleted assets
- assets marked internal-only

### Density options
Public detail views may support one of these display modes:
- `all approved`
- `smart sampled`
- `milestone sampled`

Recommendation:
- store all approved images
- support a UI toggle or future derived mode for smarter sampling

---

## Ribbon and badge state model

Ribbons should come from structured derived state, not manual graphics.

### Primary corner ribbon
Reserved for major status:
- `forSale`
- `sold`
- `breeding`
- `show`
- `retained`

### Secondary corner ribbon
Reserved for temporary/highlight states:
- `birthday`
- `featured`
- `auctionSoon`
- `newPhotos`
- `expectedCalf`

If multiple candidates compete for the same slot, use a defined priority table in the data model.

---

## Confidence policy

Treat AI thresholds as policy values, not magic constants.

### Recommended structure
Store configurable thresholds such as:
- `shotTypeAutoApproveThreshold`
- `animalAssignmentAutoApproveThreshold`
- `qualityMinimumThreshold`
- `heroRecommendationThreshold`

### Policy recommendation
- conservative auto-approval for public card slots
- more permissive auto-approval for timeline-only assets
- manual review for ambiguous or low-confidence assignments

---

## Calf-specific intake rule

Because calves may temporarily share a visible tag with the dam, the system must support this without identity collisions.

### Required behavior
- calf gets its own `animalId` immediately
- calf may temporarily inherit visible tag context from dam
- calf display tag may be represented as derived display text such as `209 calf`
- when calf is retagged later, only the visible/current tag changes
- photo history stays attached to `animalId`

This must never require splitting or rebuilding photo history.

---

## Seasonal hero/gallery curation rules

### Hero logic
Hero media should support:
- seasonal schedule
- monthly rotation
- manual pinning
- recommended candidates

### Gallery logic
Gallery assets may be:
- auto-approved general gallery
- manually featured
- seasonally highlighted
- hidden without deletion

---

## Browser/admin upload compatibility

This state machine must support a future where uploads can happen directly on the website.

Important note:
- browser/admin upload is just another intake channel
- it should not require a different downstream processing model

That means Share Sheet and browser uploads should converge into the same state machine.

---

## Failure handling

### Rejected
Use `rejected` for assets that fail basic validity or policy checks.

Keep a machine-readable rejection reason, for example:
- unsupported file
- corrupt image
- too small
- tag unresolved and no review fallback
- processing failure

### Retry behavior
Processing should be job-safe:
- retries should not create duplicate logical records
- duplicate uploads should be detectable
- failures should not break public presentation

---

## Final implementation recommendation

Build the system so that:
- uploads are treated as jobs
- classification is advisory but useful
- public presentation draws only from approved structured records
- cattle card slots are derived, not hand-maintained
- timeline history is always anchored to `animalId`
- hidden/delete/review actions are first-class admin operations

