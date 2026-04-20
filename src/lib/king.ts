import type { CattleMediaLink, MediaAsset } from "~/schemas";
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
 * King-of-the-hill recomputation — spec §14.8 and §14.9.
 *
 * Invoked after every upload, classification update, or admin
 * Prefer/Hide toggle for an animal. Reads all candidate photos,
 * ranks them by a single unified blend, and sets the appropriate
 * king flag on exactly one link per slot.
 *
 * Unified blend per §14.8:
 *   score = 0.9 × prescription + 0.1 × aesthetic
 * Applied everywhere. No status-dependent variation. A king can only
 * be dethroned by a higher-scoring side-profile photo under this
 * single formula.
 *
 * Technical-quality floor per §14.8 and §14.9:
 *   photos with aestheticSubscores.technical < 0.4 are excluded
 *   entirely from both crown pools. Gate, not a weight — a blurry
 *   photo cannot sit on a crown regardless of prescription score.
 *
 * Phase 1 beauty fallback (§14.9): most-recent photo among eligible
 * beauty shot types (action / scenic / three-quarter / head / with-dam
 * / other) by aesthetic score. Side profiles are schema-eligible per
 * §14.9 but Phase 1 does not set them as beauty king — Phase 2 will
 * introduce the 15-20% side-profile penalty.
 *
 * Admin overrides (§14.12):
 *   forceExclude: true  → permanently excluded from both crowns
 *   forceInclude: true  → wins its crown (if plausible shot type and
 *                         passes the technical floor), time-bounded
 *                         by life-stage staleness threshold
 */

const BEAUTY_TYPES = new Set([
  "action",
  "scenic",
  "three-quarter",
  "head",
  "with-dam",
  "other",
]);

/** Technical-quality floor for crown eligibility per §14.8 / §14.9. */
export const TECHNICAL_FLOOR = 0.4;

/**
 * Is this photo usable for any crown? Gated by the technical-quality
 * floor plus the admin forceExclude flag. A photo below the floor is
 * still viewable in the per-animal gallery but cannot sit on a crown.
 *
 * Unclassified photos (aestheticSubscores null) are admitted — they
 * haven't been scored yet. Once the classifier runs, the floor applies.
 */
export function passesTechnicalFloor(asset: MediaAsset): boolean {
  const technical = asset.aestheticSubscores?.technical;
  if (technical === null || technical === undefined) return true;
  return technical >= TECHNICAL_FLOOR;
}

/** Unified side-profile blend per §14.8. */
export function blendedScore(asset: MediaAsset): number {
  const prescription = asset.prescriptionScore ?? 0;
  const aesthetic = asset.aestheticScore ?? 0;
  return 0.9 * prescription + 0.1 * aesthetic;
}

export async function recomputeKings(animalId: string): Promise<void> {
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

  const sideProfileLink = pickSideProfileKing(animalLinks, mediaById);
  const beautyLink = pickBeautyKing(animalLinks, mediaById);

  const now = new Date().toISOString();

  // Apply flags: crown the winners, dethrone everyone else.
  for (const link of animalLinks) {
    const shouldBeSide = link === sideProfileLink;
    const shouldBeBeauty = link === beautyLink;
    const patch: Partial<CattleMediaLink> = {};

    if (link.cardFrontKing !== shouldBeSide) {
      patch.cardFrontKing = shouldBeSide;
      patch.cardFrontKingSince = shouldBeSide ? now : link.cardFrontKingSince;
      patch.cardFrontKingLostAt = shouldBeSide ? null : now;
    }
    if (link.cardFrontBeautyKing !== shouldBeBeauty) {
      patch.cardFrontBeautyKing = shouldBeBeauty;
      patch.cardFrontBeautyKingSince = shouldBeBeauty
        ? now
        : link.cardFrontBeautyKingSince;
      patch.cardFrontBeautyKingLostAt = shouldBeBeauty ? null : now;
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

function pickSideProfileKing(
  links: CattleMediaLink[],
  mediaById: Map<string, MediaAsset>
): CattleMediaLink | null {
  // forceInclude wins outright when eligible (still must pass the floor)
  for (const link of links) {
    if (link.forceExclude) continue;
    if (!link.forceInclude) continue;
    const asset = mediaById.get(link.mediaAssetId);
    if (!asset || asset.detectedShotType !== "side-profile") continue;
    if (!asset.cardFrontEligible) continue;
    if (!passesTechnicalFloor(asset)) continue;
    return link;
  }

  const candidates = links
    .filter((l) => !l.forceExclude)
    .map((l) => ({ link: l, asset: mediaById.get(l.mediaAssetId) }))
    .filter(
      (c): c is { link: CattleMediaLink; asset: MediaAsset } =>
        c.asset !== undefined &&
        c.asset.detectedShotType === "side-profile" &&
        c.asset.cardFrontEligible &&
        passesTechnicalFloor(c.asset)
    );

  if (candidates.length === 0) return null;

  const scored = candidates
    .map(({ link, asset }) => ({
      link,
      score: blendedScore(asset),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.link ?? null;
}

function pickBeautyKing(
  links: CattleMediaLink[],
  mediaById: Map<string, MediaAsset>
): CattleMediaLink | null {
  // forceInclude wins outright for beauty-eligible types (with floor check)
  for (const link of links) {
    if (link.forceExclude) continue;
    if (!link.forceInclude) continue;
    const asset = mediaById.get(link.mediaAssetId);
    if (!asset || !BEAUTY_TYPES.has(asset.detectedShotType)) continue;
    if (!asset.cardFrontEligible) continue;
    if (!passesTechnicalFloor(asset)) continue;
    return link;
  }

  const candidates = links
    .filter((l) => !l.forceExclude)
    .map((l) => ({ link: l, asset: mediaById.get(l.mediaAssetId) }))
    .filter(
      (c): c is { link: CattleMediaLink; asset: MediaAsset } =>
        c.asset !== undefined &&
        BEAUTY_TYPES.has(c.asset.detectedShotType) &&
        c.asset.cardFrontEligible &&
        passesTechnicalFloor(c.asset)
    );

  if (candidates.length === 0) return null;

  // Phase 1 fallback (§14.9): most-recent, tiebreak by aesthetic score.
  // Phase 2 will introduce a proper rubric with the side-profile penalty.
  const scored = candidates.sort((a, b) => {
    const timeCmp =
      new Date(b.asset.capturedAt).getTime() -
      new Date(a.asset.capturedAt).getTime();
    if (timeCmp !== 0) return timeCmp;
    return (b.asset.aestheticScore ?? 0) - (a.asset.aestheticScore ?? 0);
  });

  return scored[0]?.link ?? null;
}
