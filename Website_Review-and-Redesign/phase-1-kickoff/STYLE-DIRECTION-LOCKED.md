# Style direction — LOCKED 2026-04-19

Marty and Roianne reviewed four style directions across two rounds of previews (v1 with four options → v4 refined to a single direction). The final locked direction is:

**Palette:**
- Background: cream (`#f7f0e3`)
- Paper / card surface: white (`#ffffff`)
- Ink / body text: near-black (`#14100e`)
- Muted text: warm grey-brown (`#5a5046`)
- Accent: burgundy (`#8b1e3a`)
- Accent deep (hover, pressed): `#5c0f24`
- Accent soft (decorative): `#d08a9a`
- Cream deep (dividers): `#e8d9bd`

**Dark mode (Phase 2 UI build, tokens Phase 1):**
- Background: near-black (`#0a0506`)
- Paper: `#14090b`
- Ink: cream (`#f7f0e3`)
- Muted: `#a89d8c`
- Accent: brighter burgundy (`#c8425e`) — lifted for dark contrast
- Accent deep: `#8b1e3a`
- Accent soft: `#e5a4b5`
- Cream deep: `#2f1d21`

**Typography:**
- Display (headlines): Playfair Display
- Body: Work Sans
- Ribbons: Cinzel (ceremonial only — unchanged from original), Lato (Available ribbon — unchanged)

**Hero scrim treatment:** neutral black gradient concentrated in the bottom third only, preserving cattle photo color throughout. No tinted scrims (those discolored the cattle in testing).

**Nature-palette accents:** dropped from consideration. Ribbons already provide ceremonial color pops; the photography already carries Hereford red-brown naturally. Adding more nature-palette chrome would be over-determined.

**Preview URLs (Cloudflare Pages):**
- `/style-preview/v4/` — the locked version
- `/style-preview/v3/`, `/style-preview/v2/`, `/style-preview/v1/` — earlier iterations, preserved for reference

**What this unblocks:**

The coding agent can now populate `src/styles/tokens.css` with these committed values per spec §18 without waiting on a design decision. This was the single largest outstanding dependency in the build order.

**Confirmed by:** Marty and Roianne via Matt, 2026-04-19.
