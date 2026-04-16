# AHA Registration Implementation Spec — v2

## Purpose

This version updates the AHA implementation guidance so it aligns with the newer Summers Ranch architecture.

The major change is:

**AHA registration readiness should be derived from the structured cattle record model, using immutable internal IDs, not from tags, filenames, or ad hoc page fields.**

## Core identity rule

### Primary key
Use `animalId` as the real internal identity.

### Display identity
Use:
- `displayTag`
- optional `name`
- `tagHistory[]`

This matters because:
- tags are usually stable, but not absolutely immutable
- calves may temporarily share the dam’s tag
- retagging can happen later
- public display and registration workflow must not lose photo or data history when the display tag changes

## What the site should store

The site should keep an internal registration-prep structure attached to each animal record.

Suggested sections:

### 1. Identity and lineage
- animalId
- current displayTag
- tagHistory
- name if present
- sex
- birth date
- sire record/link
- dam record/link
- breed composition / Hereford status
- registration status

### 2. Ranch-side registration readiness
- readiness state
- missing required fields list
- warnings list
- notes for owner
- last checked date

### 3. AHA-facing candidate fields
Store the fields needed to prepare for AHA registration and related workflows, including:
- calf identity details
- sire details
- dam details
- service/breeding details where applicable
- birth and calving details
- horn/polled/scurred coding where relevant
- twin/birth-group details where relevant
- inventoried herd/TPR-related fields where relevant

### 4. Submission tracking
- whether data is complete enough for manual MyHerd submission
- whether all required supporting data is present
- whether registration was submitted
- submitted date
- returned registration number
- follow-up issues

## Important implementation rule

The site should not assume that public-facing cattle cards are the source of truth.

Instead:
- cattle cards read from the cattle model
- registration readiness is derived from the cattle model
- media and card fields are presentation layers only

## Calf shared-tag behavior

If a calf temporarily shares the dam’s visible tag, that must not merge the two animals.

Implementation rule:
- the calf gets its own `animalId` immediately
- the calf may temporarily inherit a shared displayTag pattern
- later retagging updates `displayTag` and `tagHistory`, not identity
- photo history stays with `animalId`

## Recommended readiness states

*Note: These are the authoritative values. The simpler 5-state list in RECOMMENDED-ARCHITECTURE.md should be replaced with these 8 values in the schema.*

- `not_applicable` — animal is not intended for registration (e.g., commercial calf, reference animal)
- `not_started` — animal is eligible but no registration work has begun
- `in_progress` — some registration fields are filled, but not all
- `ready_for_owner_review` — system thinks fields are complete enough; owner should confirm
- `ready_for_submission` — owner has confirmed and the record is ready to submit to AHA
- `submitted` — submitted to AHA, awaiting response
- `registered` — registration number returned from AHA
- `blocked` — cannot proceed due to missing prerequisites (e.g., dam not registered)

## Admin behavior

The admin surface should:
- show what is missing for AHA readiness
- keep ranch-side convenience fields separate from official fields
- let the owner fill fields gradually
- avoid overwhelming the user with full registration complexity all at once

Use progressive disclosure:
- simple cattle data first
- registration section second
- deeper pedigree/TPR details only when needed

## Relationship to other docs

This implementation spec should be read alongside:
- the canonical data model spec
- the media ingestion state machine
- the private-layer architecture notes
- the AHA workflow doc

## Recommendation

Keep the original AHA workflow logic, but implement it against the newer internal model:
- immutable internal IDs
- displayTag + tagHistory
- calf shared-tag support
- derived readiness from structured cattle records
