import type { AnimalRecord, CattleMediaLink, MediaAsset } from "~/schemas";
import {
  animals as seedAnimals,
  media as seedMedia,
  links as seedLinks,
  groupByBinder as groupSeedByBinder,
  type BinderSection,
} from "./cattle";
import {
  getAnimalOverride,
  getAllAnimalOverrides,
  getAllCreatedMedia,
  getAllCreatedLinks,
  mergeAnimal,
} from "./overrides";
import { silhouetteFor } from "./display/silhouette";

/**
 * Overlay-aware cattle accessors — async variants of src/lib/cattle
 * that merge KV overrides over the seed baseline. These are the
 * accessors admin-edit surfaces and SSR public pages use.
 *
 * Photo reads (media + links) also merge: seed records + KV-created
 * records from uploads, so newly-uploaded photos appear immediately
 * on public surfaces.
 */

export type { AnimalRecord };

// ── Animal reads ────────────────────────────────────────────────────

export async function getAnimalLive(id: string): Promise<AnimalRecord | null> {
  const seed = seedAnimals.find((a) => a.id === id);
  if (!seed) return null;
  const override = await getAnimalOverride(id);
  return mergeAnimal(seed, override);
}

export async function getAnimalByTagLive(tag: string): Promise<AnimalRecord | null> {
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

// ── Photo reads (merge seed + KV-created) ───────────────────────────

async function getAllMediaLive(): Promise<MediaAsset[]> {
  const created = await getAllCreatedMedia();
  // Seed wins for same-id by taking the last; but in practice seed and
  // created shouldn't overlap (different id spaces).
  const byId = new Map<string, MediaAsset>();
  for (const asset of seedMedia) byId.set(asset.id, asset);
  for (const asset of created) byId.set(asset.id, asset);
  return Array.from(byId.values());
}

async function getAllLinksLive(): Promise<CattleMediaLink[]> {
  const created = await getAllCreatedLinks();
  const byKey = new Map<string, CattleMediaLink>();
  for (const link of seedLinks) {
    byKey.set(`${link.animalId}:${link.mediaAssetId}`, link);
  }
  for (const link of created) {
    byKey.set(`${link.animalId}:${link.mediaAssetId}`, link);
  }
  return Array.from(byKey.values());
}

/**
 * Primary front photo per §3.5. Overlay-aware — respects throne flags
 * on either seed links or KV-created links.
 *
 *   available animal      → cardFrontThrone (side profile)
 *   not-available animal  → cardFrontBeautyThrone
 *   fallback              → the other throne
 *   empty                 → null (caller shows silhouette)
 */
export async function getPrimaryPhotoLive(
  animalId: string
): Promise<MediaAsset | null> {
  const animal = await getAnimalLive(animalId);
  if (!animal) return null;

  const [allMedia, allLinks] = await Promise.all([
    getAllMediaLive(),
    getAllLinksLive(),
  ]);
  const mediaById = new Map(allMedia.map((m) => [m.id, m]));
  const animalLinks = allLinks.filter((l) => l.animalId === animalId);

  const wantThrone =
    animal.currentStatus === "available"
      ? "cardFrontThrone"
      : "cardFrontBeautyThrone";

  const throneLink = animalLinks.find((l) => l[wantThrone]);
  if (throneLink) {
    return mediaById.get(throneLink.mediaAssetId) ?? null;
  }

  const otherField =
    wantThrone === "cardFrontThrone"
      ? "cardFrontBeautyThrone"
      : "cardFrontThrone";
  const otherLink = animalLinks.find((l) => l[otherField]);
  return otherLink ? (mediaById.get(otherLink.mediaAssetId) ?? null) : null;
}

export async function getThumbnailPhotoLive(
  animalId: string
): Promise<MediaAsset | null> {
  const [allMedia, allLinks] = await Promise.all([
    getAllMediaLive(),
    getAllLinksLive(),
  ]);
  const mediaById = new Map(allMedia.map((m) => [m.id, m]));
  const animalLinks = allLinks.filter((l) => l.animalId === animalId);

  const throneLink = animalLinks.find((l) => l.cardFrontThrone);
  if (throneLink) return mediaById.get(throneLink.mediaAssetId) ?? null;

  const anyLink = animalLinks[0];
  return anyLink ? (mediaById.get(anyLink.mediaAssetId) ?? null) : null;
}

export async function getAllPhotosForLive(
  animalId: string,
  order: "newest-first" | "oldest-first" = "newest-first"
): Promise<MediaAsset[]> {
  const [allMedia, allLinks] = await Promise.all([
    getAllMediaLive(),
    getAllLinksLive(),
  ]);
  const mediaById = new Map(allMedia.map((m) => [m.id, m]));
  const animalLinks = allLinks.filter((l) => l.animalId === animalId);
  const assets: MediaAsset[] = [];
  for (const link of animalLinks) {
    const asset = mediaById.get(link.mediaAssetId);
    if (asset) assets.push(asset);
  }
  assets.sort((a, b) => {
    const cmp =
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    return order === "newest-first" ? cmp : -cmp;
  });
  return assets;
}

/**
 * Re-exports for legacy consumers that pass these through as props
 * into synchronous components. Most callers should use the *Live
 * variants instead.
 */
export { getAllMediaLive, getAllLinksLive };
export { silhouetteFor };
