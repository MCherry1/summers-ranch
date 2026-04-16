# Future Private Layer Architecture

## Purpose

This document explains how Summers Ranch should be built now so that future private features can be added later **without a full rebuild**.

It exists to address a valid concern:
- buyer portal
- order history
- merch/shop
- browser uploads
- richer admin controls

are not speculative in principle. They are likely eventual additions, even if the timing is uncertain.

The goal is to make room for them now without forcing the project into a heavy full-app architecture before the ranch workflow is ready for it.

---

## Core recommendation

Build **Option B now**, but build it in a way that **naturally expands into Option C** later.

That means:
- use stable internal IDs and schemas now
- separate public presentation from raw operational data now
- separate media storage from site source code now
- design auth/admin boundaries now
- leave room for database-backed features later

If that is done correctly, later private features become an extension, not a rebuild.

---

## Why this avoids a painful future rewrite

A future rewrite becomes necessary when the early version hardcodes assumptions like:
- tag is the only identity
- files in folders are the source of truth
- public pages and admin data are the same thing
- media state only exists in filenames
- no schema boundaries exist
- no separation between public and private fields

If you avoid those mistakes now, the later move to richer private features is much smaller.

---

## The expansion path

### Stage 1 — now
Static-first public site with structured data and media pipeline.

### Stage 2 — near future
Richer admin layer:
- media review
- photo hide/delete/reassign
- visibility control
- seasonal curation
- direct browser uploads

### Stage 3 — later
Authenticated private functions:
- admin roles
- buyer accounts
- saved cattle / favorites
- order history
- merch/shop
- private sale catalogs

### Stage 4 — only if truly needed
More dynamic operational workflows:
- customer dashboards
- invoices/orders
- authenticated documents
- deeper ranch workflow automation

Each stage should build on the same schemas and identities.

---

## What must be true now to support later growth

### 1. Internal immutable IDs
Required now:
- `animalId`
- `mediaId`
- stable derived entity IDs where needed

Without these, later account/history features get fragile.

### 2. Public/private field separation
Every schema should distinguish:
- private/internal fields
- derived/admin fields
- public-facing fields

This matters later for:
- customer portals
- audit history
- admin permissions
- privacy boundaries

### 3. Media separate from repo source
Media should live in object storage and be referenced by records.

This makes later browser uploads and admin media tools much easier.

### 4. Data model not tied to one intake channel
Share Sheet is primary now.
Browser upload may matter later.
DSLR upload matters too.

All should converge into the same underlying model.

### 5. Auth boundary planned, not necessarily fully built
You do not need full auth now for all features, but the architecture should make it easy to add protected routes and protected actions later.

---

## Suggested capability split

### Public layer
Accessible to everyone.
Examples:
- home
- about
- herd index
- cattle detail
- gallery
- contact

### Trusted ranch/admin layer
Accessible only to authorized ranch users.
Examples:
- cattle edit
- media review
- hide/delete/reorder
- seasonal selections
- upload tools
- readiness nudges

### Buyer/private layer
Accessible to authenticated customers later.
Examples:
- saved favorites
- private sale info
- order history
- merch account data

These are separate product surfaces and should stay separate.

---

## Browser uploads later

Direct website uploads are a reasonable future requirement.

Important point:
- they should be implemented as an **additional intake channel**, not a separate media system

That means later browser uploads should feed the same media state machine as the Share Sheet flow.

Good result:
- one processing model
- one review model
- one media record structure
- two or more user-facing upload interfaces

---

## Buyer portal and order history later

These become easier if the current system already follows these rules:
- stable identities
- typed schemas
- public/private separation
- proper timestamps and auditable records
- storage of customer-safe public references, not raw internal filenames

### Important note
None of this requires you to build the customer system right now.
It only requires that you do not block it.

---

## Merch/shop later

A lightweight shop can be added later in several ways:
- external hosted shop link
- embedded commerce widget
- custom merch/product layer

This is another reason not to overbuild the first version.
The ranch/media workflow is harder and more central than merch.

Plan for merch, but do not let it drive the architecture prematurely.

---

## Recommended implementation stance

### Build now
- Astro public site
- structured schemas
- object-storage media
- ingestion pipeline
- admin review tools
- route structure that leaves room for protected areas

### Delay until needed
- buyer auth
- order history
- commerce
- customer dashboards
- richer dynamic backend workflows

### Design now so later features are easy
- stable IDs
- audit fields
- role-aware route planning
- generic intake model
- public/private data boundaries

---

## The actual reason Option B is still correct now

Option C is not wrong in theory.
The reason not to start there is that it front-loads complexity into parts of the product that are not yet the bottleneck.

The bottleneck today is:
- getting photos in cleanly
- classifying them
- organizing them
- linking them to cattle
- presenting them well

If that workflow is not excellent, a richer app stack does not help much.

So the right move is:
- build the core media + cattle architecture correctly now
- leave a clean expansion path
- add the heavier private layer when the ranch actually needs it

That is how you avoid both overbuilding now and rebuilding later.

---

## Final recommendation

Build the current version so that later private features are an **extension layer**, not a replacement layer.

If you do these things now:
- stable internal IDs
- schema-first data model
- media in object storage
- processing/state machine for uploads
- separation between public/admin/private surfaces

then future buyer portals, order history, merch, and direct website uploads can be added without tearing the whole project apart.

