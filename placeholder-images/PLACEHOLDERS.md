# Placeholder images

**Not real animals. Not real photographs. Use during development only.**

These SVG placeholders exist so you (Matt) and the coding agent can build and demo the site without using any of Marty and Roianne's real cattle photos until the full upload pipeline is in place.

## Why SVG, not stock photos

The agent sandbox couldn't reach Unsplash or other stock photo sources (network allowlist). Rather than ship nothing, these are **stylized vector silhouettes** in Hereford colors (red-brown body, white face, white socks — the breed's distinctive markings). They're clearly diagrammatic, not photographic — nobody will mistake them for real cattle. The `TAG 0000` convention reinforces this.

Side benefit: SVG is tiny (~2 KB each vs. ~500 KB for equivalent JPG), infinitely scalable, and renders crisp on any screen.

## What's here

| File | Intended use | Aspect |
|---|---|---|
| `hero-ranch-dusk.svg` | Home page hero background | 2400×1500 landscape |
| `cow-side-profile-0000a.svg` | Side profile card front (available animal) | 1200×1600 portrait (3:4) |
| `bull-0000b.svg` | Alternative card front showing a bull | 1200×1600 portrait (3:4) |
| `calf-with-dam-0000c.svg` | Card front for a calf, or `with-dam` classified shot | 1200×1600 portrait (3:4) |
| `beauty-three-quarter-0000d.svg` | Beauty/action card front (not-available animal per A42/§3.5) | 1200×1600 portrait (3:4) |

All cattle placeholders use the tag number `0000` in their filenames as a convention. No real animal uses tag 0000, so anything marked `0000` in the data is visibly fake to anyone who knows the herd.

## How to use them during development

**As static assets:** copy the files you need into `public/images/cattle/` (or wherever the new rebuild puts public images) and reference them in seed data.

**As seed data entries:** create AnimalRecord entries with tag `0000`, `0000a`, `0000b`, `0000c`, `0000d` for distinct placeholder animals. Reference the corresponding SVG in the MediaAsset.uri field.

Example seed animal (for Claude Code reference):

```json
{
  "id": "placeholder-cow-0000a",
  "tag": "0000A",
  "name": "Placeholder Cow",
  "sex": "cow",
  "breed": "Hereford",
  "dateOfBirth": "2020-05-15",
  "registrationNumber": null,
  "currentStatus": "available",
  "sireId": null,
  "damId": null,
  "isReference": false,
  "privateNotes": "PLACEHOLDER — remove before launch"
}
```

## Discarding these before launch

Before the site goes live with real photos:

1. Delete all records with tag starting `0000`
2. Delete this entire directory
3. Confirm grep for `PLACEHOLDER` returns nothing in `data/`, `public/`, or `src/`

The `privateNotes` convention lets you find all placeholder records with a simple query.

## About image quality

These are illustrations, not photographs. They deliberately read as diagrammatic. The actual site with real cattle photos will look dramatically different — higher detail, real texture, actual motion. These placeholders exist to validate that the layout, spacing, typography, and interactions work without requiring real imagery. Don't judge visual polish off these — judge it off the tokens, the type hierarchy, the spacing, and the ribbons.

## Why I didn't include a hero image of Marty and Roianne

Matt asked specifically that no "fake versions of real photos" be staged that might later get confused with real ones. These placeholders respect that — no ranch exterior, no specific animal, no staged family photo. Generic silhouettes that obviously aren't the Summers Ranch.
