# ASTRO Migration Decision

## Decision

Rebuild Summers Ranch now on **Astro with light TypeScript**.

This project is still pre-launch. That matters. The right time to correct architecture is before the public site, the cattle records, and the media pipeline become expensive to refactor.

## Why this is the right choice now

Summers Ranch is no longer just a static brochure site. It is becoming four related systems:

1. a public-facing ranch brand site
2. a public herd catalog
3. a private/admin workflow surface
4. a media ingestion and curation pipeline

The current HTML/JS prototype proved the product shape, but it is not the right long-term structure for a schema-heavy, photo-heavy, continuously updated system.

## Why Astro fits this project

Astro is a strong fit because the site is primarily **content-first and media-first**, not app-first.

Astro should be used for:
- the public pages
- herd cards and cattle detail pages
- gallery pages
- admin surfaces
- selective interactive components

Astro should **not** be treated as the whole backend. The media ingestion pipeline, storage, and processing can evolve behind it.

## Recommended stack

- **Astro**
- **TypeScript** with strict mode
- **schema-first data modeling**
- **object storage for media**
- **state-machine processing for uploads**
- **static-first public rendering**
- **interactive islands only where needed**

## What should remain static-first

- homepage
- about/story pages
- herd index
- cattle detail pages
- gallery pages
- contact pages
- seasonal hero/media presentation

## What can be interactive islands

- herd card cycling
- gallery lightbox
- admin review tools
- media reassignment/reordering
- login-gated tools later

## Why not keep growing raw HTML

Continuing in raw HTML increases the chance of:
- field drift between cattle records
- repeated UI logic across pages
- brittle admin/media behavior
- difficulty reusing layouts and components
- a messy migration later when private features arrive

## Why not jump straight to a full app stack everywhere

A full app stack is not automatically “more correct.” If done too early, it adds a lot of product and security surface before the core media and cattle workflow is stable.

The right path is:
- correct foundations now
- private features later as an extension

## The key foundation rules

Build now so that later private features do **not** require a rebuild:

- use immutable internal IDs (`animalId`, media IDs)
- treat tag as display identity, not the primary key
- keep media storage separate from source code
- use structured schemas for cattle/media/site state
- make upload processing explicit and stateful
- keep public/admin/private boundaries clear

## Recommendation

Rebuild now with Astro and light TypeScript.

Do **not** preserve the current file structure just because it exists.

Use the prototype as:
- a visual/content reference
- a workflow proof-of-concept
- a source of useful copy/spec ideas

But rebuild the implementation on a cleaner foundation.
