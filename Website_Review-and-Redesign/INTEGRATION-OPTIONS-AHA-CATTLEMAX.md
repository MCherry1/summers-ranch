# Integration Options: Summers Ranch, AHA/MyHerd, and CattleMax

## Purpose

This note explains what appears to be possible today with the official American Hereford Association (AHA) systems, what appears to be *not* publicly supported, and what that means for the Summers Ranch website.

The practical goal is to avoid wasting time building a bespoke system that duplicates commercial herd software, while still creating a site that is genuinely useful to the ranch owner and can potentially connect to official workflows later.

---

## Plain-English conclusion

Based on the public information currently available:

1. **AHA/MyHerd clearly supports electronic workflows.**
2. **Those workflows appear to be centered around MyHerd itself and imported/exported association-compatible files from recognized herd software, especially CattleMax and GEM.**
3. **I did not find a publicly documented AHA API or MyHerd developer platform for arbitrary third-party software.**
4. **I also did not find a public CattleMax developer API that would let the Summers Ranch website directly push or pull records from CattleMax.**
5. **This strongly suggests that the safest assumption is that AHA accepts structured electronic data through known workflows and known formats, not through an open “upload anything from any custom website” model.**

So, yes: the current public evidence supports the idea that these systems are mostly **file-interface systems**, not openly interoperable API ecosystems.

---

## What AHA publicly says

AHA publicly states that calves can be registered electronically through:

- **MyHerd**
- **Imported files from herd management programs such as CattleMax or GEM**

AHA also has a dedicated page for **Herd Management Software** where it specifically lists **GEM** and **CattleMax** and says these software packages can be used by members to:

- upload initial herd data files,
- submit TPR inventory,
- submit registrations to AHA,
- submit weaning and yearling data,
- upload calf crop and herd EPD updates.

That is an important signal. It does **not** prove there is a public API. It suggests that AHA recognizes certain software pathways and has established data-exchange workflows for them.

### Meaning of that for us

The likely model is:

- AHA knows how to **generate or accept certain specific files**.
- CattleMax and GEM know how to **consume and produce those specific files**.
- Users move data through those pathways because the association already trusts the structure and business logic of those systems.

That is very different from an open developer platform.

---

## What CattleMax publicly says

CattleMax documents an AHA interface that works through exported/imported files. Public help pages describe a workflow like this:

1. The user downloads an AHA herd extract or inventory file from MyHerd.
2. That file is imported into CattleMax.
3. The user manages inventory or registration-related information inside CattleMax.
4. CattleMax generates an association-format export file.
5. In at least some workflows, the user then emails that file to AHA for processing.
6. AHA later produces updated output files that can be re-imported.

This is not how modern public API systems usually work.

This looks much more like a **trusted file interchange process** built around known formats and established administrative handling.

---

## The key unanswered question

The main technical/legal question is:

> Does AHA accept association-format files from *any* outside system that reproduces the format correctly, or only from systems/workflows they explicitly recognize and support?

Based on public evidence alone, the answer is **unclear**.

What we can say safely:

- AHA clearly supports **recognized herd-management software workflows**.
- AHA clearly supports **imported files** from named herd software.
- AHA does **not** appear to publicly advertise a general-purpose “developer upload spec” for independent custom sites.

That means we should **not assume** that a custom Summers Ranch exporter can be uploaded directly into AHA/MyHerd unless AHA explicitly confirms it.

---

## Why AHA might restrict this

Even if the file format itself is technically simple, the association may still limit accepted workflows for good reasons:

- pedigree and identity data must be accurate,
- registration rules include required combinations of fields,
- certain entries may require supporting ownership or service information,
- TPR and performance records have timing and completeness rules,
- malformed files create support burden,
- unofficial uploads could produce bad data in the registry.

So even if we can technically reproduce a file format, that does **not** mean the association wants to process files from arbitrary custom systems.

This is a business-rule and trust issue, not just a software issue.

---

## What this means for the Summers Ranch website

The Summers Ranch site should be designed in phases.

### Phase 1 — Best immediate use

Use the site as a **friendly ranch-side preparation tool**.

The site should:

- store cattle card data,
- store the AHA registration fields,
- store TPR/performance-supporting fields,
- show readiness status,
- show missing required fields,
- generate a human-readable registration packet or summary,
- help the ranch owner gather everything before official submission.

This is useful even if no automation ever happens.

### Phase 2 — Controlled export support

If practical, add **downloadable export files** from the Summers Ranch site, but only as internal convenience tools at first.

Examples:

- CSV export for ranch records,
- AHA-prep export for manual review,
- side-by-side report matching MyHerd/CattleMax fields,
- printable registration worksheet,
- “ready to enter in MyHerd” summary card.

At this phase, the export should be treated as a **helper artifact**, not as something we promise can be uploaded directly into AHA.

### Phase 3 — Confirmed integration only

Only after direct confirmation from AHA or CattleMax should the site attempt:

- true association-format file generation for official submission,
- direct import/export compatibility claims,
- automated handoff into a recognized provider workflow,
- any branded “submit to AHA” feature.

Until then, avoid building a feature that implies official compatibility.

---

## Recommended design stance

The right mental model is:

- **MyHerd/AHA is the official registry system**.
- **CattleMax/GEM are recognized herd-management systems with established exchange workflows**.
- **Summers Ranch should be the low-friction data-entry and readiness layer**.

That means the custom site is not trying to replace the official registry or replace all commercial herd software.

Instead, it should do three jobs well:

1. make record entry easy,
2. keep the family in control of their own data,
3. reduce friction before official submission.

That is the highest-value niche for a custom family-built site.

---

## Technical recommendation for the coding agent

Build the data model so that it can support future interoperability, but do **not** hardcode assumptions about official upload support.

### Recommended implementation posture

- Add internal field groups that mirror AHA registration and TPR concepts.
- Add a rules engine that marks records as:
  - `basic_profile_complete`
  - `registration_candidate`
  - `registration_ready_for_manual_entry`
  - `tpr_data_partial`
  - `tpr_data_ready`
  - `official_submission_unverified`
- Add export modules that are clearly labeled as:
  - internal ranch exports,
  - review summaries,
  - draft mapping files.
- Keep any future association-format exporter behind a feature flag until an official workflow is confirmed.

### Important wording rule

Do **not** label anything in the UI as:

- “Submit to AHA”
- “AHA-compatible upload”
- “Official MyHerd export”

unless AHA has explicitly confirmed that the format is accepted.

Safer labels:

- “AHA registration prep”
- “MyHerd entry checklist”
- “Registration summary export”
- “Association field map”
- “Draft herd-management export”

---

## The question to ask AHA directly

Before building any official file-generation path, ask AHA:

1. Do you provide a public or partner developer specification for third-party software?
2. Do you accept electronic registration or TPR files from custom software vendors that are not already established providers?
3. Is there a certification, approval, or licensing process for third-party herd-management integrations?
4. Are CattleMax and GEM accepted because they follow a published file spec, or because they are specifically recognized partners/workflows?
5. Is there a sandbox or test process for validating import files from outside systems?

This is the single most important uncertainty to resolve.

---

## The question to ask CattleMax directly

If the family eventually adopts CattleMax, ask:

1. Do you expose any developer API or import automation for third-party websites?
2. Can outside systems generate import files for CattleMax based on a documented schema?
3. Is your AHA interface based solely on import/export files, or do you have private partner integrations?
4. Do you offer a partner/developer program for custom portals used by ranches?

---

## Recommendation for Summers Ranch right now

The recommended path is:

### Build now

- the custom cattle cards,
- the progressive AHA field sections,
- the readiness engine,
- the printable/downloadable summaries,
- the future-friendly internal schema.

### Do not build yet

- direct AHA submission,
- any claim of official file compatibility,
- any automated upload into MyHerd or CattleMax.

### Investigate next

- whether AHA allows outside vendors/custom systems,
- whether CattleMax has partner import options,
- whether a sanctioned export spec exists.

---

## Final practical takeaway

Your instinct is correct.

The current public evidence suggests that these systems are **not really “talking” in a modern open-API sense**. They appear to be using **recognized, structured file exchange workflows** and trusted operational processes.

That means a custom site **can still be very valuable**, but its first job should be to:

- collect the right data,
- guide the user gently,
- prevent missing information,
- and prepare records for official systems.

If AHA later confirms that custom vendors can submit properly formatted electronic files, then the site can evolve into a more direct bridge.

Until then, treat it as a **smart staging layer**, not an official integration endpoint.
