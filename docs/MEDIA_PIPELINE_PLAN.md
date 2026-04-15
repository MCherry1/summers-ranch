# Mrs. Summers Ranch Media Pipeline Recommendation

This document lays out a practical media workflow for the ranch site, optimized for:
- very simple iPhone upload behavior
- reliable automation through GitHub + GitHub Actions
- high-quality, mobile-friendly presentation on the website
- future migration away from GitHub Pages media storage when needed

---

## Executive Recommendation

Use this model:

**iPhone share sheet -> upload original photo asset -> GitHub repo ingest area -> GitHub Actions processing -> publish web-ready derivatives -> site renders optimized stills and optional motion**

The simplest and most reliable approach is:

- keep the phone-side workflow as light as possible
- do all normalization, cropping, file generation, and naming in GitHub Actions
- use **JPEG/WebP/AVIF** for browser-facing images
- use **short muted MP4 loops** for "living" movement on selected cattle cards
- do **not** rely on HEIC as the final website format
- do **not** make Apple Live Photos the primary website media format

---

## The Main Decision: Upload Raw iPhone Photos or Convert on Phone First?

### Recommendation

**Default recommendation: upload the raw photo from iPhone and convert later in GitHub Actions.**

This is the best default for your situation because:
- your grandpa's workflow stays simpler
- there are fewer failure points in Shortcuts
- your automation stays centralized and easier to improve over time
- crops and output formats can be changed later without changing the phone workflow
- you preserve the highest-quality original for future reuse

### When raw upload is best

Use raw upload if:
- the phone workflow needs to be as foolproof as possible
- uploads usually happen over decent Wi-Fi or acceptable cellular
- your GitHub Actions pipeline already handles conversion and cropping well
- you want to keep the highest-quality source asset

### When on-phone conversion may be worth it

Convert on phone first only if one or more of these are true:
- uploads are frequently done in weak cellular conditions
- image files are so large that upload time is frustrating
- you want to reduce GitHub repo growth as much as possible
- your current Shortcut can reliably resize/convert without confusing the user

### Practical conclusion

For your ranch workflow:

**Start with raw upload.**  
Add optional lightweight on-phone resize only if real-world usage shows upload friction.

---

## Recommended Ingest Strategy

### Best near-term ingest model

Upload one of these to GitHub from the iPhone:

#### Option A — Best simplicity
Upload the original iPhone photo asset as-is.

Pros:
- simplest for the user
- highest original quality preserved
- all processing centralized in Actions

Cons:
- larger uploads
- HEIC originals are not browser-ready, so conversion is required later

#### Option B — Best compromise
On phone, resize to a sane maximum dimension but keep quality high, then upload.

Suggested target:
- long edge: **2400–3200 px**
- quality: high
- format: JPEG if Shortcut conversion is easy and reliable

Pros:
- smaller upload size
- easier repo growth
- still plenty of quality for web crops and galleries

Cons:
- more logic on phone
- more chances for Shortcut edge cases

### My recommendation between A and B

Use:

**Option A first**  
Then switch to **Option B** only if upload speed or repo size becomes annoying.

---

## Why Not Serve HEIC on the Website?

HEIC is fine as an ingest/original format, but it is a poor browser delivery format.

### Recommended rule

- **Store HEIC if you want**
- **Never depend on HEIC for browser display**

### Why

Browser compatibility for HEIC is limited compared with standard web formats. Even if GitHub can store it, your visitors' browsers may not render it well or at all.

### Better final delivery formats

Generate these browser-facing assets:
- **AVIF** for best compression where supported
- **WebP** for broad modern compatibility
- **JPEG** fallback for universal compatibility

---

## Recommended File Types by Stage

### Stage 1 — Ingest/original
Allowed:
- HEIC
- JPEG
- PNG if needed, though not ideal for photos

Recommended:
- preserve original as uploaded

### Stage 2 — Working/processing
Use whichever format your image pipeline likes best:
- original HEIC decoded internally
- or normalized master JPEG

### Stage 3 — Final website assets
Generate:
- `animal-slug/hero.avif`
- `animal-slug/hero.webp`
- `animal-slug/hero.jpg`
- `animal-slug/thumb.webp`
- `animal-slug/thumb.jpg`

Optional:
- `animal-slug/detail-1.webp`
- `animal-slug/detail-2.webp`
- `animal-slug/motion.mp4`

---

## Recommended Folder Structure

A good structure inside GitHub could look like this:

```text
/data/
  cattle/
    animal-records.json

/media/
  originals/
    2026/
      04/
        tag-or-animal-name/
          IMG_1234.HEIC

  processed/
    cattle/
      maple/
        hero.avif
        hero.webp
        hero.jpg
        thumb.webp
        thumb.jpg
        detail-1.webp
        detail-2.webp
        motion.mp4
        metadata.json
