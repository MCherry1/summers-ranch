# Seed data

Canonical JSON for the Phase 1 site. Everything Astro reads at build
time comes from this folder. Empty arrays are valid — the site will
render empty-state surfaces gracefully.

## Files

- `animals.json` — `AnimalRecord[]` per spec §22.1
- `media.json` — `MediaAsset[]` per spec §22.1
- `links.json` — `CattleMediaLink[]` per spec §22.1 (join records
  carrying king-of-the-hill flags, admin overrides, attribution)
- `site-config.json` — single `SiteConfig` object per spec §17.8

## No fake data policy

Per `CLAUDE.md`: never generate tag numbers, lineage, or animal
details. Marty and Roianne provide those. This folder is empty until
real records exist. When they do, schema validation runs at build
time (`src/lib/cattle.ts`) and a malformed entry fails the build.

## Adding an animal

The minimum viable record is:

```json
{
  "id": "<uuid-or-slug>",
  "tag": "840",
  "name": null,
  "sex": "cow",
  "breed": "Hereford",
  "dateOfBirth": "2017-03-14",
  "registrationNumber": null,
  "distinction": null,
  "distinctionYear": null,
  "currentStatus": "breeding",
  "sireId": null,
  "damId": null,
  "isReference": false,
  "performanceData": null,
  "privateNotes": "",
  "createdAt": "2026-04-19T00:00:00Z",
  "updatedAt": "2026-04-19T00:00:00Z"
}
```

Once the admin inline-edit + passkey pipeline lands (weeks 3-5), new
animals will be created from the admin surface and written here
automatically.
