# Archive note — consolidation 2026-04-19

On 2026-04-19, the spec was consolidated. Prior to this date, the single source of truth was split across two files:

- `CARD-REDESIGN-SPEC.md` — the original spec from 2026-04-17 (1331 lines)
- `CARD-REDESIGN-SPEC-AMENDMENTS.md` — 42 amendments (A1-A42) written across two design sessions (3374 lines)

The amendments file explicitly superseded the main spec where they conflicted. Cross-referencing was getting unwieldy for the coding agent.

## What happened

1. `CARD-REDESIGN-SPEC.md` (v1) was renamed to `CARD-REDESIGN-SPEC-v1-ARCHIVE.md`
2. `CARD-REDESIGN-SPEC-AMENDMENTS.md` was renamed to `CARD-REDESIGN-SPEC-AMENDMENTS-ARCHIVE.md`
3. A new consolidated `CARD-REDESIGN-SPEC.md` was written from scratch, folding all 42 amendments into a single document (1750 lines) focused on the final state

## Canonical reference order

- **`CARD-REDESIGN-SPEC.md`** is now the single source of truth. Start here.
- **`CARD-REDESIGN-SPEC-AMENDMENTS-ARCHIVE.md`** preserves the reasoning behind each amendment — useful when a decision in the main spec needs context. Amendment → section map is in §26 of the main spec.
- **`CARD-REDESIGN-SPEC-v1-ARCHIVE.md`** is historical. The v1 spec is largely superseded and should not be treated as current.

## Why we kept the archives

The amendments file contains ~3000 lines of reasoning prose that would have bloated the consolidated spec. Git history alone isn't enough — future questions like "why did we do X?" benefit from having the deliberation preserved as readable prose.

The v1 archive is kept because some decisions in the main spec are direct continuations of v1 phrasing that's worth tracing.

## What lives where now

| Document | Audience | Content |
|---|---|---|
| `CARD-REDESIGN-SPEC.md` | coding agent, Matt, future readers | Final state of Phase 1 product and implementation |
| `CARD-REDESIGN-SPEC-AMENDMENTS-ARCHIVE.md` | anyone debugging a design decision | Chronological amendment record with reasoning |
| `CARD-REDESIGN-SPEC-v1-ARCHIVE.md` | historical only | Original spec before amendments |
| `HANDOFF-2026-04-18.md` | session-to-session memory | Design session continuity notes |
| `PHASE-1-KICKOFF-BRIEF.md` | historical | Original kickoff, partially superseded |
| `QUESTIONS-FOR-MARTY-AND-ROIANNE.md` | historical | Questions addressed during the design sessions |
