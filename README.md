# Summers Ranch

Source for [mrsummersranch.com](https://mrsummersranch.com) — a registered
Hereford operation run by Marty and Roianne Summers in Sutter Creek,
California, since 1998.

## Stack

Astro 4 with strict TypeScript, Zod schemas, no UI framework. Hosted on
Cloudflare Pages; Workers handle the photo pipeline (iOS Shortcut → R2),
inquiry inbox, and admin endpoints. No runtime dependencies beyond
Google Fonts.

## Developing

```bash
npm install
npm run dev        # local dev at http://localhost:4321
npm run build      # static build into dist/
npm run check      # astro + TypeScript checks
```

## Documentation

- `CLAUDE.md` — agent orientation (start here if you're an AI agent)
- `CONTRIBUTING.md` — how humans modify this repo
- `Website_Review-and-Redesign/phase-1-kickoff/CARD-REDESIGN-SPEC.md` —
  authoritative product and implementation spec
- `Website_Review-and-Redesign/phase-1-kickoff/POLISH-AND-AESTHETICS.md`
  — visual craft guide (authoritative for aesthetic detail)
- `Website_Review-and-Redesign/phase-1-kickoff/STYLE-DIRECTION-LOCKED.md`
  — locked palette and typography tokens

## License

Code is under `LICENSE.md` (all-rights-reserved with a perpetual
operation license for Marty and Roianne). Documentation and design
content are under `COPYRIGHT.md` (CC BY-NC-SA).
