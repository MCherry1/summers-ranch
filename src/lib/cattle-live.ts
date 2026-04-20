import type { AnimalRecord } from "~/schemas";
import {
  animals as seedAnimals,
  media,
  links,
  getPrimaryPhoto,
  getThumbnailPhoto,
  getAllPhotosFor,
  groupByBinder as groupSeedByBinder,
  type BinderSection,
} from "./cattle";
import {
  getAnimalOverride,
  getAllAnimalOverrides,
  mergeAnimal,
} from "./overrides";

/**
 * Overlay-aware cattle accessors — async variants of src/lib/cattle
 * that merge KV overrides over the seed baseline. These are the
 * accessors admin-edit surfaces and SSR public pages use.
 *
 * The synchronous exports in cattle.ts are still valid for reads
 * that don't need the latest admin edits (e.g. OG composite generation
 * at build time).
 */

export type { AnimalRecord };
export { media, links, getPrimaryPhoto, getThumbnailPhoto, getAllPhotosFor };

export async function getAnimalLive(id: string): Promise<AnimalRecord | null> {
  const seed = seedAnimals.find((a) => a.id === id);
  if (!seed) return null;
  const override = await getAnimalOverride(id);
  return mergeAnimal(seed, override);
}

export async function getAnimalByTagLive(tag: string): Promise<AnimalRecord | null> {
  // Overrides may change a tag, so search merged animals, not just the seed.
  const all = await getAllAnimalsLive();
  return all.find((a) => a.tag === tag) ?? null;
}

export async function getAllAnimalsLive(): Promise<AnimalRecord[]> {
  const overrides = await getAllAnimalOverrides();
  return seedAnimals.map((seed) => mergeAnimal(seed, overrides.get(seed.id) ?? null));
}

export async function availableCountLive(): Promise<number> {
  const all = await getAllAnimalsLive();
  return all.filter((a) => a.currentStatus === "available").length;
}

export async function groupByBinderLive(): Promise<BinderSection[]> {
  const all = await getAllAnimalsLive();
  return groupSeedByBinder(all);
}

export async function getSireLive(
  animal: AnimalRecord
): Promise<AnimalRecord | null> {
  if (!animal.sireId) return null;
  return getAnimalLive(animal.sireId);
}

export async function getDamLive(
  animal: AnimalRecord
): Promise<AnimalRecord | null> {
  if (!animal.damId) return null;
  return getAnimalLive(animal.damId);
}

export async function getCalvesOfLive(
  animal: AnimalRecord
): Promise<AnimalRecord[]> {
  if (animal.sex !== "cow") return [];
  const all = await getAllAnimalsLive();
  const calves = all.filter(
    (a) => a.damId === animal.id && !a.isReference
  );
  calves.sort((a, b) => {
    const aDate = a.dateOfBirth ?? "";
    const bDate = b.dateOfBirth ?? "";
    return bDate.localeCompare(aDate);
  });
  return calves;
}
