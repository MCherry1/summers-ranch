# docs/ — LEGACY v1 prototype material

**If you are a Claude agent reading this on the `v2-rebuild` branch: this
entire folder is stale. It documents the v1 prototype architecture that the
rebuild replaces.**

Specifically, every document here assumes:

- **Tag-as-primary-key** cattle records (v2 uses immutable `animalId`)
- **GitHub Actions** as the photo processing pipeline (v2 uses Cloudflare
  Workers, not yet built — Phase 2)
- **Direct GitHub API writes** from the browser admin panel (v2 uses a
  Worker endpoint with session auth — Phase 2)
- **`cattle-data.json`** as the canonical herd file (v2 uses
  `data/seed/animals.json` in Phase 1, R2-backed storage in Phase 2)
- **`cattle.html`** and other static `.html` files at repo root (v2 uses
  Astro pages in `src/pages/`)

The iOS Shortcut described in `IOS-SHORTCUT-GUIDE.md` in particular points
at the old Actions-based pipeline. The Phase 2 rebuild will give it a new
Worker endpoint to talk to; the old endpoint is not going anywhere until
cutover.

## When this folder is still useful

- **Design intent and UX.** The specs here captured a lot of thinking about
  nudges, tooltips, card behavior, calf lifecycle edge cases, and copy tone.
  Port those ideas forward.
- **Industry terminology.** Year-letter codes, BIF disposition, calving
  ease, AHA readiness — all documented correctly here.
- **Behavior checklist.** The authoritative rebuild checklist is
  `../Website_Review-and-Redesign/BEHAVIOR-PRESERVATION-CHECKLIST.md`, but
  these specs fill in the UX reasoning behind many items.

## What to read instead on this branch

The authoritative rebuild documents live in
`../Website_Review-and-Redesign/`. Start with its `README.md`. The current
`CLAUDE.md` at the repo root is the source of truth for the v2 architecture
and lists the reading order.

## When this folder goes away

At cutover. Along with the rest of the v1 prototype artifacts
(`*.html` at root, `js/`, `images/`, `site-config.json`,
`cattle-data.json`, `admin-key.json`, etc.). Git history preserves v1 if
anyone ever needs it.
