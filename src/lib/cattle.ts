import { z } from "zod";
import {
  AnimalRecord,
  CattleMediaLink,
  MediaAsset,
  type Sex,
} from "~/schemas";
import animalsJson from "../../data/seed/animals.json";
import mediaJson from "../../data/seed/media.json";
import linksJson from "../../data/seed/links.json";

/**
 * Cattle data loader. Parses and validates the seed JSON at import
 * time so any malformed record fails the build, not the request.
 * Provides typed accessors used by the herd and animal-detail pages.
 *
 * Phase 1 storage is flat JSON in data/seed/ per §22.2. Phase 2
 * migrates to D1/Postgres; this module is the abstraction seam.
 */

const Animals = z.array(AnimalRecord);
const Media = z.array(MediaAsset);
const Links = z.array(CattleMediaLink);

export const animals: AnimalRecord[] = Animals.parse(animalsJson);
export const media: MediaAsset[] = Media.parse(mediaJson);
export const links: CattleMediaLink[] = Links.parse(linksJson);

// ── Indexes ─────────────────────────────────────────────────────────
const animalById = new Map(animals.map((a) => [a.id, a]));
const animalByTag = new Map(animals.map((a) => [a.tag, a]));
const mediaById = new Map(media.map((m) => [m.id, m]));

// links grouped by animal for constant-time throne lookup
const linksByAnimal = new Map<string, CattleMediaLink[]>();
for (const link of links) {
  const bucket = linksByAnimal.get(link.animalId) ?? [];
  bucket.push(link);
  linksByAnimal.set(link.animalId, bucket);
}

// ── Accessors ───────────────────────────────────────────────────────

export function getAnimal(id: string): AnimalRecord | null {
  return animalById.get(id) ?? null;
}

export function getAnimalByTag(tag: string): AnimalRecord | null {
  return animalByTag.get(tag) ?? null;
}

/**
 * Primary front photo per §3.5:
 *   available animal    → cardFrontThrone (side profile)
 *   not-available animal → cardFrontBeautyThrone (beauty/action)
 *   fallback / reference / zero-photo → null (caller shows silhouette)
 */
export function getPrimaryPhoto(animalId: string): MediaAsset | null {
  const animal = animalById.get(animalId);
  if (!animal) return null;
  const animalLinks = linksByAnimal.get(animalId) ?? [];

  const wantThrone =
    animal.currentStatus === "available"
      ? "cardFrontThrone"
      : "cardFrontBeautyThrone";

  const throneLink = animalLinks.find((l) => l[wantThrone]);
  if (throneLink) {
    return mediaById.get(throneLink.mediaAssetId) ?? null;
  }

  // Fallback: other-throne if the primary throne is empty
  const otherField =
    wantThrone === "cardFrontThrone"
      ? "cardFrontBeautyThrone"
      : "cardFrontThrone";
  const otherLink = animalLinks.find((l) => l[otherField]);
  return otherLink ? (mediaById.get(otherLink.mediaAssetId) ?? null) : null;
}

/**
 * Back thumbnail per §4.5 — always side-profile throne regardless of
 * status (the back is the evaluation surface).
 */
export function getThumbnailPhoto(animalId: string): MediaAsset | null {
  const animalLinks = linksByAnimal.get(animalId) ?? [];
  const throneLink = animalLinks.find((l) => l.cardFrontThrone);
  if (throneLink) return mediaById.get(throneLink.mediaAssetId) ?? null;
  const anyLink = animalLinks[0];
  return anyLink ? (mediaById.get(anyLink.mediaAssetId) ?? null) : null;
}

/**
 * All photos for a given animal, sorted by capture date. Used by the
 * per-animal gallery (§5).
 */
export function getAllPhotosFor(
  animalId: string,
  order: "newest-first" | "oldest-first" = "newest-first"
): MediaAsset[] {
  const animalLinks = linksByAnimal.get(animalId) ?? [];
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
 * Binder order per §7.1 — section groupings within the herd list.
 * Within each section, sort is applied externally.
 */
const BINDER_ORDER: Array<{ key: Sex | "reference"; label: string }> = [
  { key: "bull", label: "Bulls" },
  { key: "cow", label: "Cows" },
  { key: "heifer", label: "Heifers" },
  { key: "calf", label: "Calves" },
  { key: "reference", label: "Reference animals" },
];

export interface BinderSection {
  key: Sex | "reference";
  label: string;
  animals: AnimalRecord[];
}

export function groupByBinder(input: AnimalRecord[]): BinderSection[] {
  const sections: BinderSection[] = BINDER_ORDER.map((b) => ({
    ...b,
    animals: [],
  }));
  for (const animal of input) {
    if (animal.isReference) {
      sections[4]!.animals.push(animal);
      continue;
    }
    const section = sections.find((s) => s.key === animal.sex);
    if (section) section.animals.push(animal);
  }
  return sections.filter((s) => s.animals.length > 0);
}

export function availableCount(): number {
  return animals.filter((a) => a.currentStatus === "available").length;
}

export function getSire(animal: AnimalRecord): AnimalRecord | null {
  if (!animal.sireId) return null;
  return animalById.get(animal.sireId) ?? null;
}

export function getDam(animal: AnimalRecord): AnimalRecord | null {
  if (!animal.damId) return null;
  return animalById.get(animal.damId) ?? null;
}

/**
 * In-herd calves for a cow — per §4.1 "Calves from this cow." Only
 * returns animals whose damId matches and who are still in the herd
 * (not reference). Sorted by DOB descending so newest appears first.
 */
export function getCalvesOf(animal: AnimalRecord): AnimalRecord[] {
  if (animal.sex !== "cow") return [];
  const calves = animals.filter(
    (a) => a.damId === animal.id && !a.isReference
  );
  calves.sort((a, b) => {
    const aDate = a.dateOfBirth ?? "";
    const bDate = b.dateOfBirth ?? "";
    return bDate.localeCompare(aDate);
  });
  return calves;
}
