#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SEED = JSON.parse(readFileSync(join(ROOT, 'data/seed/media.json'), 'utf8'));
const ANIMALS = JSON.parse(readFileSync(join(ROOT, 'data/seed/animals.json'), 'utf8'));
const PUBLIC_ROOT = join(ROOT, 'public');

const animalById = new Map(ANIMALS.animals.map((a) => [a.animalId, a]));

const VARIANTS = {
  originalKey: { width: 1200, height: 900, labelSuffix: 'original' },
  publicKey: { width: 1200, height: 800, labelSuffix: 'public' },
  cardKey: { width: 800, height: 600, labelSuffix: 'card' },
  thumbKey: { width: 320, height: 320, labelSuffix: 'thumb' },
};

const PALETTE = {
  cream: '#faf6ef',
  linen: '#ede5d3',
  saddle: '#8b6914',
  earth: '#4a3928',
  gold: '#c8941e',
};

function svgFor({ width, height, displayTag, shotType, capturedAt, variant }) {
  const smallFont = Math.max(10, Math.round(Math.min(width, height) / 28));
  const tagFont = Math.max(24, Math.round(Math.min(width, height) / 4));
  const shotFont = Math.max(12, Math.round(Math.min(width, height) / 14));
  const date = capturedAt ? capturedAt.slice(0, 10) : '';
  const shot = shotType ? shotType.toUpperCase() : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Placeholder image for tag ${displayTag} ${shot}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PALETTE.cream}"/>
      <stop offset="1" stop-color="${PALETTE.linen}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="${PALETTE.gold}" stroke-width="2" stroke-dasharray="6 6" opacity="0.5"/>
  <text x="50%" y="40%" text-anchor="middle" fill="${PALETTE.saddle}" font-family="Cormorant Garamond, Garamond, serif" font-size="${tagFont}" font-weight="600">#${displayTag}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="${PALETTE.earth}" font-family="Lato, Arial, sans-serif" font-size="${shotFont}" letter-spacing="2">${shot}</text>
  <text x="50%" y="72%" text-anchor="middle" fill="${PALETTE.earth}" font-family="Lato, Arial, sans-serif" font-size="${smallFont}" opacity="0.7">${date}</text>
  <text x="50%" y="93%" text-anchor="middle" fill="${PALETTE.earth}" font-family="Lato, Arial, sans-serif" font-size="${smallFont}" opacity="0.4">PLACEHOLDER · ${variant}</text>
</svg>
`;
}

function jpgKeyToSvgPath(key) {
  return key.replace(/\.jpg$/i, '.svg');
}

let written = 0;
let skipped = 0;

for (const media of SEED.media) {
  const animal = media.associatedAnimalId ? animalById.get(media.associatedAnimalId) : null;
  const displayTag = animal?.displayTag ?? '???';
  const shotType = media.shotType ?? 'unknown';
  const capturedAt = media.capturedAt;

  for (const [field, spec] of Object.entries(VARIANTS)) {
    const key = media[field];
    if (!key) {
      skipped += 1;
      continue;
    }
    const svgPath = jpgKeyToSvgPath(key);
    const outPath = join(PUBLIC_ROOT, svgPath);
    mkdirSync(dirname(outPath), { recursive: true });
    const content = svgFor({
      width: spec.width,
      height: spec.height,
      displayTag,
      shotType,
      capturedAt,
      variant: spec.labelSuffix,
    });
    writeFileSync(outPath, content, 'utf8');
    written += 1;
  }
}

console.log(`[placeholders] wrote ${written} SVG files (${skipped} null keys skipped)`);

// Also emit a small hero fallback for home/about
const heroPath = join(PUBLIC_ROOT, 'placeholders/hero-default.svg');
if (!existsSync(heroPath)) {
  mkdirSync(dirname(heroPath), { recursive: true });
  writeFileSync(
    heroPath,
    svgFor({
      width: 1920,
      height: 1080,
      displayTag: 'SUMMERS RANCH',
      shotType: 'hero',
      capturedAt: null,
      variant: 'hero',
    }),
    'utf8',
  );
  console.log('[placeholders] wrote hero-default.svg');
}
