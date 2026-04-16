# Summers Ranch — Second-Opinion Review Memo

## Purpose

This memo consolidates the owner/editorial decisions made after the initial planning set. It is intended for a second coding agent to review the proposed architecture and implementation direction, challenge any weak assumptions, and either confirm or improve the plan.

This memo should be read **after** the master implementation brief and the canonical data/model/media specs. It is not a replacement for those documents. It is the clearest statement of what has now been decided, what remains delegated to implementation best practices, and what the reviewing agent is specifically being asked to evaluate.

---

## What this project is

Summers Ranch is **not** just a brochure website.

It is a:
- public-facing ranch brand and lead-generation site,
- public cattle research/catalog experience,
- private/admin ranch workflow system,
- media-first cattle photo pipeline,
- future-capable platform for buyer accounts, order history, merch, browser uploads, and other private/admin features.

The public site should feel polished, warm, rural, family-run, and visually intentional. It should sit in the aesthetic space between:
- ranch sites,
- winery/vineyard sites,
- farm/homestead sites,
- small brewery/taproom-style product sites.

The site should be highly usable on both mobile and desktop, with each feeling intentionally designed for that device class.

---

## Core strategic goals

### Goal 1 — Public-facing trust and conversion
The site should function as a serious public-facing ranch brand:
- attractive,
- trustworthy,
- visually strong,
- easy to contact,
- capable of converting interest into inquiries.

### Goal 2 — Serious self-service cattle research
The site should also let serious buyers do much more research than typical ranch websites allow. The intent is to reduce unnecessary back-and-forth by surfacing information that is normally only available after inquiry.

The primary public conversion goal is therefore **both**:
- inquiry/contact,
- and serious buyer self-service research.

The second is the differentiator.

### Goal 3 — Avoid staleness
A stale site is worse than a bad site. The system must be designed to stay current with minimal technical burden.

### Goal 4 — Keep ranch use dead simple
The primary non-technical ranch user will upload photos primarily from an iPhone. That workflow is central and must remain extremely simple.

---

## Confirmed architecture direction

### Accepted recommendation
Proceed with the equivalent of **Option B now**, but build it so that a future **Option C** can be layered on without a destructive rebuild.

That means building now with:
- Astro,
- light TypeScript,
- static-first public architecture,
- schema-first data model,
- media-first design,
- clear public/admin/private boundaries,
- future readiness for a richer private layer.

### Important clarification
The owner questioned why not build full Option C immediately.

The conclusion is:
- the project should **not** be “half-built,”
- but the current implementation should focus on the real hard problem first: media ingestion, cattle presentation, structured data, admin media control, and static/public performance,
- while leaving a clean path to later add accounts, richer admin roles, browser uploads, order history, buyer portals, and lightweight commerce.

The review agent should specifically evaluate whether this staging is correct, or whether a more fully dynamic implementation is justified **without** destabilizing the current media-first product priorities.

---

## Public cattle information policy

### Initial herd cards
Initial public herd cards should show only basic cattle details.

These are intentionally lightweight and should not be visually overwhelming.

They should prominently include:
- tag number,
- name if present,
- key status/state,
- ribbons/badges,
- rotating accepted-view photography.

### On click / drill-down
Deeper information should reveal on click or expansion.

This deeper information can include:
- pedigree,
- performance details,
- pregnancy/breeding details that are relevant to buyers,
- official registration information only when official and available,
- official EPD information only when official and available.

### Private only
Registration progress itself is private/internal workflow information and should not be publicly shown unless it has become official/publicly relevant.

More nuanced behind-the-scenes condition or internal workflow details remain private.

---

## Public card motion philosophy

The card motion philosophy is **both decorative and informative**.

Accepted implementation principles:
- use subtle auto-cycling,
- pause on hover / tap / focus,
- respect reduced-motion settings,
- never hide key information behind motion alone.

Motion is anchored to real cattle presentation needs, not decoration for its own sake.

The primary accepted/industry views are the basis of this system.

---

## Herd page sorting and filtering policy

The herd page is primarily **ranch-centric**, but should still support useful buyer browsing.

The interface should use:
- simple clickable filters,
- simple clickable sort controls,
- not an overly complex filter-builder UI.

The owner expects controls such as:
- show all,
- show one category,
- show another category,
- sort by status,
- sort by age,
- sort by tag.

The agent should design a clean implementation of this without overcomplicating the interface.

---

## Gallery / herd / hero editorial policy

### Cattle images
Cattle images should remain part of the cattle system and should not be automatically reused elsewhere just because they exist.

### Gallery images
Gallery images are a separate pipeline and should be treated as their own editorial stream.

### Hero images
Hero imagery should come from the general ranch / documentary side, not from the cattle-specific catalog imagery.

### DSLR / drone images
These may use a more deliberate upload path. They do not need to go through the exact same cattle-photo automation path, though it is acceptable if the system can honor a shared pipeline where practical.

### Gallery tone
The gallery should lean more **documentary** than sales-oriented.
The sales-oriented experience is primarily the herd/catalog side.

---

## AI authority policy

### Accepted model
The system may trust AI aggressively for low-risk media processing and presentation tasks, but not for identity-critical or sales-critical field changes.

### Correct uses of AI
AI may be used for:
- shot classification,
- crop/focus suggestions,
- selecting recent side/head/three-quarter views,
- low-confidence review flags,
- media organization and routing,
- stale-photo nudges.

### Incorrect uses of AI without human confirmation
AI should **not** silently overwrite:
- identity-critical fields,
- sales-critical fields,
- manually entered cattle details,
- external links that matter for correctness,
- official data fields that require confirmation.

Where AI writes important structured fields from documents/PDFs/etc., it should ask for confirmation.

### Thresholds
The owner accepts that auto-accept thresholds should initially be defined by implementation best-practice judgment and then tuned later if the pipeline shows problems.

---

## Failure behavior policy

The owner is explicitly delegating fallback design to implementation best practices.

The reviewing/building agent should define expected fallback behavior for cases such as:
- upload succeeds but classification fails,
- classification succeeds but canonical side/head/three-quarter set is incomplete,
- wrong tag entered,
- duplicate uploads,
- retagging later occurs,
- photo date is missing or incorrect,
- metadata extraction fails,
- processing partially fails,
- site build should not break due to partial ingest failure.

The agent should treat this as a design requirement, not as an afterthought.

---

## Ribbon / badge policy

### Main status ribbon
Main status ribbons should come from structured field/state.

Examples could include:
- for sale,
- sold,
- breeder,
- etc.

### Secondary ribbon
Secondary ribbons can come from:
- derived rules,
- lightweight manual editorial flags,
- celebratory or temporary states such as birthday or auction-related flags.

The owner accepts the prior recommendation that:
- main status ribbon = structured field/state,
- secondary ribbon = derived or lightweight manual/editorial signal.

---

## Privacy posture

The owner is delegating privacy/security best-practice implementation details to the agent.

However, the following editorial decisions are clear:
- public users should not gain private/internal ranch metadata,
- if buyer accounts exist later, they do not reveal more than appropriate public/buying-process information,
- exact public metadata exposure should follow best practices,
- private metadata can be stored behind the scenes if useful for future AI or operational purposes,
- public media should not expose unnecessary private metadata.

The agent should choose sane defaults consistent with current best practices.

---

## CMS versus generated product

The owner does **not** want a traditional hand-authored CMS mentality.

This project is much closer to a **generated product** where:
- records,
- media,
- pipelines,
- derived states,
- and publication rules

flow into public/admin views.

Some editorial touch-up is expected after the fact, but the intention is to trust well-designed pipelines and keep the system from becoming stale.

---

## Backup and reversibility

The owner is delegating backup/rollback/audit design to best-practice implementation.

The agent should define:
- rollback behavior,
- soft delete versus hard delete,
- audit trail where appropriate,
- reversibility of mistaken tag/media actions,
- backup expectations,
- and other safety behaviors appropriate for non-technical operators.

---

## Canonical identity decision

### Permanent identity
Cattle identity must use an internal immutable website-level identifier.

The visible tag is **not** the permanent identity.

### Tag behavior
Tags are generally stable but not truly immutable.

Reasons include:
- retagging,
- calf-to-weaning transitions,
- mother/calf temporary shared tag behavior.

### Calf behavior
Calves may initially share the mother’s tag visibly.
That does **not** mean they share identity.
They must still receive their own internal record/identity.

When they later receive their own tag, the entire photo history and data history must follow the internal identity, not be lost or recreated.

### Public display
The public herd card should always show:
- tag,
- and name if present.

Tag is primary. Name is secondary when available.

Cards should also remain sortable by tag.

---

## Photo pipeline policy

The iPhone Share Sheet workflow is a **core product feature**, not a side convenience.

### Core ranch workflow
The non-technical ranch user will primarily:
- select photos on iPhone,
- send through Share Sheet,
- choose cattle or gallery/general path,
- provide tag where relevant,
- and rely on automation.

### Current pipeline
The current inbox → GitHub Actions → classify/process/sort flow is directionally correct and conceptually aligned with the desired system.

### Long-term note
The owner understands that direct repo writes may not be ideal forever, but the reviewing/building agent should decide the practical architecture while preserving the simple iPhone workflow.

### Cattle photo requirements
Each public cattle card should show the most recent valid:
- side view,
- head-on view,
- three-quarter view.

Those three views softly cycle on the public card.

### Detail-page photo behavior
Clicking into the detailed cattle view should reveal the full historical photo stream for that animal, ordered by date, so users can observe growth over time.

Only date needs to be public-facing from the stripped metadata.
Private metadata can still be preserved in backend scaffolding if implementation and privacy rules permit.

### Parallel gallery pipeline
There should also be a separate general/gallery upload path that uses different share-sheet options and routing behavior.
The gallery should auto-curate separately from the cattle card system.

---

## Manual data entry policy

All important structured cattle details are expected to be manually entered or manually confirmed.

The owner does **not** want the system making loose assumptions about:
- identity,
- tag values,
- official cattle fields,
- links,
- sales-critical details.

AI can assist with extraction and suggestions, but important fields should be confirmed.

---

## What remains delegated to the reviewing/building agent

The owner is deliberately relying on the reviewing/building agent for best-practice recommendations in these areas:
- privacy posture details,
- backup/rollback/audit strategy,
- failure fallback strategy,
- confidence thresholds,
- upload/storage architecture details,
- exact implementation mechanics of static-first versus private-layer readiness,
- graceful migration path from the current prototype,
- and any additional platform/security best practices.

The reviewing agent should not interpret this as uncertainty about product direction. The direction is clear. These items are delegated because they are implementation best-practice questions.

---

## What the reviewing agent should challenge

The second-opinion agent should explicitly review and either confirm or revise:
1. Whether the Option B-now / Option C-later staging is correct.
2. Whether Astro + TypeScript + schema-first + media-first is still the best fit.
3. Whether the current/simple GitHub inbox approach should survive to launch or be replaced earlier.
4. Whether the planned media behavior is feasible and robust at the desired automation level.
5. Whether the filtering/sorting/card-motion plan is sound for both mobile and desktop.
6. Whether the private-layer future has been correctly accounted for without distorting v1.
7. Whether anything important is missing from the current specification set.

---

## What the reviewing agent should not reopen unnecessarily

The second-opinion agent should **not** waste effort reopening these settled editorial decisions unless there is a very strong reason:
- the public site should support serious self-service cattle research,
- the initial cards should stay light and expandable,
- official EPD/registration data is shown only when official and available,
- motion should be subtle and informative, not gimmicky,
- the gallery is documentary-oriented,
- the iPhone Share Sheet workflow is central,
- AI should assist strongly on low-risk media tasks but not silently rewrite important cattle/business facts,
- tag is not the permanent identity.

---

## Bottom-line instruction to the reviewing agent

Take the existing docs, the live prototype, the public repo, and this memo together.

Your job is not to start from scratch.
Your job is to:
- review the architecture,
- identify gaps or bad assumptions,
- confirm or improve the build order,
- and produce a more final implementation recommendation.

Assume the owner is highly capable at directing product/design intent, but not a professional web developer. Favor robust, maintainable, automation-friendly architecture that does not become stale and does not require ongoing technical babysitting.
