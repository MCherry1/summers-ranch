import rawAnimals from '../../data/seed/animals.json';
import rawMedia from '../../data/seed/media.json';
import rawLinks from '../../data/seed/links.json';
import {
  AnimalSchema,
  MediaAssetSchema,
  CattleMediaLinkSchema,
  type Animal,
  type MediaAsset,
  type CattleMediaLink,
} from '@schemas';

function parseOrThrow<T>(label: string, schema: { parse: (input: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[data] seed validation failed for ${label}:\n${message}`);
  }
}

export const allAnimals: readonly Animal[] = Object.freeze(
  parseOrThrow('animals', AnimalSchema.array(), rawAnimals.animals),
);

export const allMedia: readonly MediaAsset[] = Object.freeze(
  parseOrThrow('media', MediaAssetSchema.array(), rawMedia.media),
);

export const allLinks: readonly CattleMediaLink[] = Object.freeze(
  parseOrThrow('links', CattleMediaLinkSchema.array(), rawLinks.links),
);

const animalById = new Map<string, Animal>(allAnimals.map((a) => [a.animalId, a]));
const mediaById = new Map<string, MediaAsset>(allMedia.map((m) => [m.mediaId, m]));

export function getAnimal(animalId: string): Animal | undefined {
  return animalById.get(animalId);
}

export function getMedia(mediaId: string): MediaAsset | undefined {
  return mediaById.get(mediaId);
}

export function linksForAnimal(animalId: string): CattleMediaLink[] {
  return allLinks.filter((l) => l.animalId === animalId);
}

export function mediaForAnimal(animalId: string): MediaAsset[] {
  return linksForAnimal(animalId)
    .map((l) => mediaById.get(l.mediaId))
    .filter((m): m is MediaAsset => m !== undefined);
}

const tagIndex = buildTagIndex();

function buildTagIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const animal of allAnimals) {
    idx.set(animal.normalizedTag.toUpperCase(), animal.animalId);
    for (const entry of animal.tagHistory) {
      if (!idx.has(entry.normalizedTag.toUpperCase())) {
        idx.set(entry.normalizedTag.toUpperCase(), animal.animalId);
      }
    }
  }
  return idx;
}

export function animalIdForTag(tag: string): string | undefined {
  return tagIndex.get(tag.toUpperCase());
}

export function seedSummary(): { animals: number; media: number; links: number } {
  return { animals: allAnimals.length, media: allMedia.length, links: allLinks.length };
}
