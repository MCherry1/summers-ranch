# Summers Ranch Rebuild — Agent Handoff Package

*Start here if you're the agent picking up this project.*

---

## Read in this order

1. **PROJECT-SYNOPSIS-AND-HISTORY.md** — how we got here, who the users are, what matters. Read first.
2. **RECOMMENDED-ARCHITECTURE.md** — what to build. The authoritative technical direction.
3. **BEHAVIOR-PRESERVATION-CHECKLIST.md** — every feature that must work in the rebuild.
4. **PHASE-1-IMPLEMENTATION.md** — concrete steps for the first build phase.

That's the core reading. ~45 minutes total.

---

## Other documents in this folder

These were produced during the second-opinion review by an earlier agent. They contain useful design thinking but have been consolidated into the four documents above. Read them if you want depth, but they're appendices now:

- **MASTER-IMPLEMENTATION-BRIEF.md** — earlier version of RECOMMENDED-ARCHITECTURE
- **SECOND-OPINION-REVIEW-MEMO.md** — owner decisions summary
- **CANONICAL-DATA-MODEL-SPEC-v2.md** — schema details (now in RECOMMENDED-ARCHITECTURE)
- **MEDIA-INGESTION-STATE-MACHINE-SPEC.md** — processing pipeline details
- **PHOTO-PIPELINE-ARCHITECTURE.md** — pipeline design thinking
- **FUTURE-PRIVATE-LAYER-ARCHITECTURE.md** — how to add buyer accounts later
- **ASTRO-MIGRATION-DECISION.md** — why Astro
- **SUMMERS-RANCH-REPO-REORG-ROADMAP.md** — project structure
- **AGENT-HANDOFF-CHECKLIST.md** — earlier handoff attempt
- **CURRENT-DOCUMENT-INDEX.md** — inventory
- **AHA-REGISTRATION-WORKFLOW.md** — registration domain knowledge (deep dive)
- **AHA-REGISTRATION-IMPLEMENTATION-SPEC-v2.md** — registration integration spec
- **INTEGRATION-OPTIONS-AHA-CATTLEMAX.md** — external integration options

The `../docs/` folder contains the old prototype's specs. These are the specs that defined the current live prototype. They are valuable for understanding what UX we achieved, but they use the old tag-as-key data model that the rebuild replaces. Treat them as reference material, not instructions.

---

## Current state

The current prototype (at mrsummersranch.com) is functional but has architectural issues that prompted the rebuild. The owner (Mark) has confirmed:

- **Nothing needs to be preserved.** All photos are test photos, all data is placeholder.
- **Fresh slate approved.** Delete legacy data, start over.
- **Same repo or new repo** — your call. Mark is open to either.
- **Current site stays live** until the rebuild is production-ready.

---

## Who you're working with

Mark — physicist, son-in-law of the ranch owner. He's building this as a surprise gift. He's capable at directing product and UX intent but not a professional web developer. He'll defer on implementation choices but have strong opinions about user experience.

Marty — the actual ranch operator who will use the admin panel and iPhone shortcuts. Not technical. Uses his iPhone. Cares deeply about the cattle. Hasn't seen the site yet.

---

## What the previous agent recommends

I (the agent that built the current prototype and helped design the rebuild) want to flag a few things:

**On scope:** The product is larger than it looks. Don't underestimate the admin panel and media pipeline. The public site is the easy part.

**On Mark's preferences:** He prefers concise clear responses with concrete actions. No emoji in UI copy. Warm professional tone. No corporate-speak. He reads carefully and will push back on sloppy thinking.

**On Marty's workflow:** The iPhone shortcut is non-negotiable UX. Marty uses only number keyboards. Any input that requires text typing will cause real-world problems.

**On incremental development:** Ship Phase 1 before building Phase 2. Get the public site right before building admin. Get admin right before building the media pipeline. Iterate with Mark at every phase.

**On asking questions:** Ask Mark before making architectural decisions he hasn't explicitly approved. He's delegating implementation details but not product direction.

Good luck. Build something beautiful for Marty.
