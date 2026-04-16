# Summers Ranch Hereford Registration Workflow

Audience: ranch owner, family helper, and non-ranch web builder.

Purpose: explain, in plain language, what information needs to be gathered so a Summers Ranch animal can be registered with the American Hereford Association (AHA), tracked for Whole Herd TPR, and presented cleanly on the ranch website.

---

## 1. What this is trying to solve

Right now the site already does a good job of tracking cattle at a practical ranch level: tag number, name, birth date, sex, sire, dam, registration number, weights, disposition, pregnancy status, notes, and photos. That is enough to build public cattle cards and basic ranch records.

What is missing is the deeper layer needed for AHA registration readiness:

- exact AHA form fields
- breeding/service details
- ownership and breeder logic
- herd inventory / TPR compliance details
- pedigree and EPD-oriented data capture
- clear "you are ready to register this animal" logic

The goal is not to force all that on the user at once. The goal is to let Marty start with a simple card and open up deeper sections only when he needs them.

---

## 2. The plain-English process

There are really **three related processes**, not one:

### A. Basic ranch record
This is the normal animal card.

Examples:
- tag number
- sex
- birth date
- sire and dam
- notes
- photos

This is what the ranch needs first just to keep track of animals.

### B. AHA registration record
This is the additional information needed to register a purebred or otherwise eligible Hereford calf with the American Hereford Association.

Examples:
- dam registration or herd ID
- sire registration or herd ID
- service type
- embryo recovery date if ET
- tattoo details
- calving date
- birth weight
- udder score and calving ease score
- horned/polled/scurred code
- twin code
- birth management group
- calf herd ID
- inventory herd ID
- exact ownership / breeder details
- sire-owner signature or AI certificate if applicable

### C. Whole Herd TPR / performance record
This is the additional data needed if the ranch wants animals to have AHA-reported EPDs.

Examples:
- current dam inventory
- reproductive status for each dam
- disposal status for cows no longer active
- complete birth, weaning, and yearling reporting
- scrotal measurement for eligible bull calves
- optional carcass / ultrasound / genomic data later

A calf can exist on the site without all three. But for an animal to be truly "AHA-ready," the site should be able to tell the owner whether it has:

- enough for a ranch card
- enough for basic registration
- enough for TPR / EPD reporting

---

## 3. What the current site already has

The current admin workflow already captures a substantial base record:

- tag
- name
- born
- registration
- sire
- dam
- breed
- breed detail
- sex
- status
- source / source ranch
- breeding stock flag
- birth weight
- weaning weight
- yearling weight
- calving ease
- disposition
- pregnancy status
- expected calving
- calves count
- notes
- photos and photo metadata

That is a strong starting point. The registration system should be built as an expansion of the current card, not a separate parallel form.

---

## 4. The minimum data layers Marty should see

To keep the site usable for a one-man ranch operation, split data entry into layers.

### Layer 1 — Basic Card
Show by default.

Fields:
- Tag number
- Name
- Sex
- Born
- Status
- Breed
- Breed detail
- Sire
- Dam
- Notes
- Photos

Use case:
- create animal
- identify animal
- show on public cattle page

### Layer 2 — Sale / Breeding Details
Collapsed by default.

Fields:
- Registration number
- Birth weight
- Weaning weight
- Yearling weight
- Calving ease
- Disposition
- Pregnancy status
- Expected calving
- Breeding stock checkbox
- Source / source ranch

Use case:
- private treaty sales
- breeding decisions
- better public cattle card detail

### Layer 3 — AHA Registration Details
Hidden unless a checkbox or accordion is opened.

Suggested trigger:
- checkbox: `Track for AHA registration`

Fields:
- AHA member number
- breeder name
- page / batch grouping
- calving season
- dam herd ID or dam registration number
- sire herd ID or sire registration number
- type of service
- ET recovery date
- register calf yes/no
- calf herd ID number
- tattoo right ear
- tattoo left ear
- sex
- calving date month/day/year
- birth weight
- udder score
- calving ease score
- horned/polled/scurred code
- twin code
- birth management group
- inventoried herd ID
- calf name
- dam owner signature recorded?
- sire owner signature required?
- sire owner signature present?
- AI certificate required?
- AI certificate present?
- transfer on entry needed?

Use case:
- final prep before entering the calf in MyHerd or submitting paperwork

### Layer 4 — Whole Herd TPR / EPD Reporting
Hidden unless a checkbox or accordion is opened.

Suggested trigger:
- checkbox: `Track for TPR / EPD`

Fields:
- dam is on current herd inventory
- inventory season
- inventory year
- reproductive status of dam
- disposal code / disposal date if removed
- adjusted weaning weight
- actual weaning date
- yearling weight date
- scrotal circumference for bull calf
- ultrasound / carcass data present
- genomic test submitted
- GE-EPD status
- current EPD snapshot values
- current index snapshot values
- last sync date from AHA

Use case:
- performance breeder workflow
- EPD / marketing use
- records quality control

---

## 5. AHA registration field checklist

This section is the practical field list to build into the site.

## 5A. Batch / worksheet header fields
These are usually the same for many calves at once.

- AHA member number
- breeder name
- telephone
- calving season
- year
- page number
- total pages

Recommendation:
Store these under a ranch-level settings object, not inside each animal, except for the calving season / year snapshot used when that animal was prepared.

## 5B. Breeding information fields
Per calf.

- transfer on entry checkbox
- dam herd ID or dam registration number
- sire herd ID or sire registration number
- type of service
  - AI
  - natural service
  - ET
- ET recovery date
- register calf yes/no
- sire owner signature required
- sire owner signature on file
- sire owner AHA member number
- date signed by sire owner
- AI certificate required
- AI certificate on file

## 5C. Calf identification and birth fields
Per calf.

- calf herd ID number
- tattoo right ear
- tattoo left ear
- sex
- calving date month
- calving date day
- calving date year
- birth weight
- udder score
- calving ease score
- horned / polled / scurred code
- twin code
- birth group
- inventoried herd ID
- calf name

## 5D. Ownership / breeder logic fields
Per calf or derived by rules.

- breeder account / breeder member number
- breeder name
- original owner at birth
- dam owner at time of birth
- owner at conception or ET recovery date logic note
- embryo calf donor / recipient logic
- transfer on entry buyer info if applicable

## 5E. Transfer on entry fields
Only when calf is being registered and transferred at the same time.

- calf number on front / row reference
- date of sale
- buyer AHA member number
- buyer name
- buyer address
- city
- state
- zip
- send certificate to buyer / seller / procured breeder

---

## 6. Code tables the site should bake in

These should be dropdowns, not free text.

### Type of service
- `A` = Artificial Insemination
- `N` = Natural Service
- `E` = Embryo Transfer

### Horn / scur status
- `H` = Horned
- `P` = Polled
- `S` = Scurred

### Twin code
- `1` = Single
- `2` = Twin to bull
- `3` = Twin to heifer
- `4` = Other

### Calving ease score
- `1` = No difficulty, no assistance
- `2` = Minor difficulty, some assistance
- `3` = Major difficulty, calf pulled / used aids
- `4` = Caesarian section
- `5` = Abnormal presentation
- `6` = Calf born dead or died shortly after birth
- `7` = Aborted
- `8` = Open
- `9` = Dam died, calving difficulty
- `10` = Donor dam, no calf reported
- `11` = Recipient dam, ET calf not reported

### Birth management group
Use integer group numbers. The concept is: calves managed differently at birth should be in different groups.

Examples:
- `1` = spring pasture group
- `2` = late spring replacement heifers
- `3` = ET calves

### Reproductive status for inventory / TPR
Suggested codes:
- exposed
- bred
- preg-confirmed
- open
- non-exposed
- donor
- recipient
- sold
- culled
- deceased

These are site-side convenience values. If Marty wants exact AHA disposal and reproductive code mirroring later, add an AHA code mapping table behind the scenes.

---

## 7. What is actually required versus merely useful

This distinction matters. Otherwise the site becomes annoying.

### Needed for a basic public card
- tag
- sex
- status
- at least one photo or a fallback image

### Needed for a decent ranch record
- born
- breed
- sire and/or dam if known
- notes

### Needed for likely AHA registration readiness
- owner has active AHA membership
- exact birth date
- at least one tattoo
- dam identifier
- sire identifier
- service type
- birth weight
- calving ease score or enough calving data to finish the form
- horn/scur code
- name if they want one
- any required signature / AI paperwork if outside ownership or AI applies
- dam is in herd inventory if using Whole Herd TPR workflow

### Needed for EPD / TPR usefulness
- dam on current inventory
- calving outcome / reproductive status captured
- birth weight
- weaning weight + date
- yearling weight + date when applicable
- scrotal circumference for bull calves when applicable

### Nice to have for marketing, but not core registration
- disposition
- narrative notes
- better photos
- current EPD snapshot values on the card
- genomic test status badge

---

## 8. Recommended readiness statuses for the website

The site should compute status, not make the user guess.

### Status 1 — Basic Card Ready
Meaning:
- enough info to show the animal on the site

### Status 2 — Breeding / Sale Ready
Meaning:
- enough practical ranch detail to advertise or manage the animal confidently

### Status 3 — AHA Registration In Progress
Meaning:
- the owner intends to register this animal, but some required fields are still missing

### Status 4 — AHA Ready to Submit
Meaning:
- all required AHA registration fields are present
- any required signature / certificate logic is satisfied

### Status 5 — TPR Incomplete
Meaning:
- the animal may be registered, but the dam inventory / performance data chain is incomplete

### Status 6 — TPR / EPD Reporting Ready
Meaning:
- herd inventory and calf performance reporting requirements are satisfied enough to proceed cleanly

---

## 9. Suggested record structure for one animal

This is not the exact final JSON. It is the practical concept.

```json
{
  "tag": "215",
  "name": "",
  "sex": "cow",
  "born": "2026-03-15",
  "breed": "Hereford",
  "breed_detail": "",
  "status": "breeding",
  "sire": "112",
  "dam": "84",
  "registration": "",
  "photos": ["images/cattle/tag-215-1.jpg"],

  "aha_tracking": true,
  "tpr_tracking": true,

  "aha_registration": {
    "member_number": "",
    "breeder_name": "",
    "calving_season": "Spring",
    "calving_year": 2026,
    "dam_id_type": "registration",
    "dam_id_value": "",
    "sire_id_type": "registration",
    "sire_id_value": "",
    "service_type": "N",
    "et_recovery_date": "",
    "register_calf": true,
    "calf_herd_id": "215",
    "tattoo_right_ear": "215",
    "tattoo_left_ear": "",
    "birth_weight_lbs": 78,
    "udder_score": "",
    "calving_ease_score": 1,
    "horn_status": "P",
    "twin_code": 1,
    "birth_group": 1,
    "inventory_herd_id": "84",
    "calf_name": "",
    "dam_owner_signature_present": false,
    "sire_owner_signature_required": false,
    "sire_owner_signature_present": false,
    "ai_certificate_required": false,
    "ai_certificate_present": false,
    "transfer_on_entry": false,
    "notes_internal": ""
  },

  "tpr": {
    "inventory_year": 2026,
    "inventory_season": "Spring",
    "dam_on_inventory": true,
    "dam_reproductive_status": "bred",
    "weaning_date": "",
    "weaning_weight_lbs": null,
    "yearling_date": "",
    "yearling_weight_lbs": null,
    "scrotal_circumference_cm": null,
    "ultrasound_submitted": false,
    "genomics_submitted": false,
    "epd_sync_date": "",
    "epds": {},
    "indexes": {}
  }
}
```

---

## 10. How EPDs fit into the site

EPDs are not something Marty hand-calculates.
They are AHA outputs.

So the site should treat EPDs as **returned values**, not required manual inputs for registration.

### Best practice
Use two separate concepts:

#### A. Inputs needed for AHA / TPR
Examples:
- pedigree
- birth weight
- weaning weight
- yearling weight
- calving data
- scrotal measurement

#### B. Outputs returned by AHA
Examples:
- CE
- BW
- WW
- YW
- MM
- M&G
- MCE
- MCW
- UDDR
- TEAT
- SC
- SCF
- DMI
- CW
- REA
- MARB
- FAT
- BMI$
- BII$
- CHB$

The website should store these in a dedicated read-only area unless Marty wants to manually type a snapshot.

---

## 11. Proposed operating routine for the ranch

This is the simple routine I would recommend.

### At birth
Enter:
- tag
- sex
- birth date
- sire
- dam
- birth weight
- photo
- calving ease score
- udder score if recorded
- horn / polled / scurred status if known
- twin status if relevant

### At first quiet moment after birth
Open the AHA section and finish:
- service type
- tattoo
- herd ID fields
- birth group
- breeder / owner notes
- signature / AI certificate requirements

### At weaning
Enter:
- weaning date
- weaning weight
- management group review

### At yearling / bull development stage
Enter if applicable:
- yearling weight
- scrotal circumference
- genomics submission info

### Before listing for sale as registered stock
Confirm:
- registration number issued
- pedigree fields complete
- EPD snapshot updated if desired
- photos are current

---

## 12. Important ranch/common-sense rules to build into the site

- Do not force AHA data for obvious crossbred animals unless the ranch explicitly wants to track them for internal comparison only.
- Keep public fields and internal fields separate.
- Never expose member numbers, signatures, or AI paperwork publicly.
- Keep crossbred and accidental-breed calves honest in breed detail. Do not make the site imply they are registered Herefords if they are not.
- Use validation warnings, not hard blocks, until the user actually declares the calf should be registered.
- Store all dates in ISO format behind the scenes even if the UI shows friendlier text.

---

## 13. What the site should ultimately tell Marty

For each animal, the site should be able to say something as plain as:

- "This calf is only a basic ranch record right now."
- "This calf has enough data to list on the website but not enough to register."
- "This calf is missing tattoo and service type for AHA registration."
- "This calf is ready for AHA registration submission."
- "This calf is registered, but TPR / EPD reporting is incomplete because weaning data is missing."

That kind of language will do more for adoption than a perfect technical schema.

---

## 14. Source notes

This workflow is based on:
- the public AHA Form 1 registration worksheet
- AHA registration guidance
- AHA Whole Herd TPR guidance
- current AHA Hereford trait / index definitions
- the existing Summers Ranch public repo structure and admin form

