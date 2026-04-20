import type { AnimalRecord, CattleMediaLink, MediaAsset } from "~/schemas";
import {
  getAllCreatedLinks,
  getAllCreatedMedia,
  writeLinkRecord,
} from "~/lib/overrides";
import {
  links as seedLinks,
  media as seedMedia,
} from "~/lib/cattle";
import { getAnimalLive } from "~/lib/cattle-live";

/**
 * Throne recomputation — spec §14.8 and §14.9.
 *
 * Invoked after every upload, classification update, or admin
 * Prefer/Hide toggle for an animal. Reads all candidate photos,
 * ranks them by the blended score formula, and sets the appropriate
 * throne flag on exactly one link per slot.
 *
 * Phase 1 beauty fallback (§14.9): most-recent photo among eligible
 * beauty shot types (action / scenic / three-quarter / head / with-dam
 * / other) by aesthetic score. Side profiles are schema-eligible per
 * the 2026-04 refinement but Phase 1 rubric does not set the beauty
 * throne to side profiles — Phase 2 will introduce the 15-20% penalty.
 *
 * Admin overrides (§14.12):
 *   forceExclude: true  → permanently excluded from both throne slots
 *   forceInclude: true  → wins its slot (if it has a plausible shot
 *                         type for that slot), time-bounded by life-
 *                         stage staleness threshold
 */

const BEAUTY_TYPES = new Set([
  "action",
  "scenic",
  "three-quarter",
  "head",
  "with-dam",
  "other",
]);

export async function recomputeThrones(animalId: string): Promise<void> {
  const animal = await getAnimalLive(animalId);
  if (!animal) return;

  const [createdMedia, createdLinks] = await Promise.all([
    getAllCreatedMedia(),
    getAllCreatedLinks(),
  ]);

  // Merge seed + created for both media and links. Same-id: created wins.
  const mediaById = new Map<string, MediaAsset>();
  for (const asset of seedMedia) mediaById.set(asset.id, asset);
  for (const asset of createdMedia) mediaById.set(asset.id, asset);

  const linkByKey = new Map<string, CattleMediaLink>();
  for (const link of seedLinks) {
    linkByKey.set(linkKey(link), link);
  }
  for (const link of createdLinks) {
    linkByKey.set(linkKey(link), link);
  }

  const animalLinks = Array.from(linkByKey.values()).filter(
    (l) => l.animalId === animalId
  );

  // Compute the new side-profile throne winner
  const sideProfileLink = pickSideProfileThrone(animalLinks, mediaById, animal);
  // Compute the new beauty throne winner
  const beautyLink = pickBeautyThrone(animalLinks, mediaById);

  const now = new Date().toISOString();

  // Apply flags: set throne on winners, clear on everyone else.
  for (const link of animalLinks) {
    const shouldBeSide = link === sideProfileLink;
    const shouldBeBeauty = link === beautyLink;
    const patch: Partial<CattleMediaLink> = {};

    if (link.cardFrontThrone !== shouldBeSide) {
      patch.cardFrontThrone = shouldBeSide;
      patch.cardFrontThroneSince = shouldBeSide ? now : link.cardFrontThroneSince;
      patch.cardFrontThroneLostAt = shouldBeSide ? null : now;
    }
    if (link.cardFrontBeautyThrone !== shouldBeBeauty) {
      patch.cardFrontBeautyThrone = shouldBeBeauty;
      patch.cardFrontBeautyThroneSince = shouldBeBeauty
        ? now
        : link.cardFrontBeautyThroneSince;
      patch.cardFrontBeautyThroneLostAt = shouldBeBeauty ? null : now;
    }

    if (Object.keys(patch).length > 0) {
      await writeLinkRecord({
        animalId: link.animalId,
        mediaAssetId: link.mediaAssetId,
        ...patch,
      });
    }
  }
}

function linkKey(link: CattleMediaLink): string {
  return `${link.animalId}:${link.mediaAssetId}`;
}

function pickSideProfileThrone(
  links: CattleMediaLink[],
  mediaById: Map<string, MediaAsset>,
  animal: AnimalRecord
): CattleMediaLink | null {
  // forceInclude wins outright when eligible
  for (const link of links) {
    if (link.forceExclude) continue;
    if (!link.forceInclude) continue;
    const asset = mediaById.get(link.mediaAssetId);
    if (!asset || asset.detectedShotType !== "side-profile") continue;
    if (!asset.cardFrontEligible) continue;
    return link;
  }

  const candidates = links
    .filter((l) => !l.forceExclude)
    .map((l) => ({ link: l, asset: mediaById.get(l.mediaAssetId) }))
    .filter(
      (c): c is { link: CattleMediaLink; asset: MediaAsset } =>
        c.asset !== undefined &&
        c.asset.detectedShotType === "side-profile" &&
        c.asset.cardFrontEligible
    );

  if (candidates.length === 0) return null;

  const { prescriptionWeight, aestheticWeight } = blendWeights(animal);

  const scored = candidates
    .map(({ link, asset }) => ({
      link,
      score:
        prescriptionWeight * (asset.prescriptionScore ?? 0) +
        aestheticWeight * (asset.aestheticScore ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.link ?? null;
}

function pickBeautyThrone(
  links: CattleMediaLink[],
  mediaById: Map<string, MediaAsset>
): CattleMediaLink | null {
  // forceInclude wins outright for beauty-eligible types
  for (const link of links) {
    if (link.forceExclude) continue;
    if (!link.forceInclude) continue;
    const asset = mediaById.get(link.mediaAssetId);
    if (!asset || !BEAUTY_TYPES.has(asset.detectedShotType)) continue;
    if (!asset.cardFrontEligible) continue;
    return link;
  }

  const candidates = links
    .filter((l) => !l.forceExclude)
    .map((l) => ({ link: l, asset: mediaById.get(l.mediaAssetId) }))
    .filter(
      (c): c is { link: CattleMediaLink; asset: MediaAsset } =>
        c.asset !== undefined &&
        BEAUTY_TYPES.has(c.asset.detectedShotType) &&
        c.asset.cardFrontEligible
    );

  if (candidates.length === 0) return null;

  // Phase 1 fallback: most-recent, tiebreak by aesthetic score.
  const scored = candidates.sort((a, b) => {
    const timeCmp =
      new Date(b.asset.capturedAt).getTime() -
      new Date(a.asset.capturedAt).getTime();
    if (timeCmp !== 0) return timeCmp;
    return (b.asset.aestheticScore ?? 0) - (a.asset.aestheticScore ?? 0);
  });

  return scored[0]?.link ?? null;
}

function blendWeights(animal: AnimalRecord): {
  prescriptionWeight: number;
  aestheticWeight: number;
} {
  // Spec §14.8:
  //   Available     → 0.9 * prescription + 0.1 * aesthetic
  //   Not-available → 0.7 * prescription + 0.3 * aesthetic
  // The "transition to x.x" variants trigger when multiple candidates
  // score closely — a Phase 2 refinement; Phase 1 uses the base blend.
  if (animal.currentStatus === "available") {
    return { prescriptionWeight: 0.9, aestheticWeight: 0.1 };
  }
  return { prescriptionWeight: 0.7, aestheticWeight: 0.3 };
}
