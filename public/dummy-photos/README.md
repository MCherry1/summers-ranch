# Dummy photos — placeholder assets

**This folder is temporary.** Everything here gets replaced once the
photo pipeline is running and Marty and Roianne start uploading real
shots via the iOS Shortcut.

## Why this exists

Phase 1 built the site structure before photography was available. To
keep the foundation shippable and reviewable, a handful of placeholder
assets live here. They're deliberately obvious so no one confuses them
with real ranch content.

## How to replace the hero

Drop a landscape JPG at `public/dummy-photos/hero.jpg`. The home page
Hero auto-detects the file and swaps from the SVG placeholder to the
real photo, engaging the bottom-third scrim per spec §18.4.

Recommended specs:
- At least 1920 × 1080 (the hero can stretch to 1440px wide on large
  desktops, so higher is better)
- JPG is fine; AVIF/WebP would be better but the HEIC→WebP server
  pipeline is Phase 2
- Landscape orientation only
- Photo content that honors the cow-is-the-hero principle — a
  landscape shot that anchors place, or a working scene with cattle

## Current placeholder inventory

- `hero-placeholder.svg` — warm Sierra-foothills horizon, no figures.
  Authored by the agent on 2026-04-19 because the sandbox couldn't
  reach Unsplash for a real placeholder. CC0 / public domain.
