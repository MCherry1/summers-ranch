import type { CattleMediaLink, MediaAsset } from '@schemas';
import { isPublicEligible } from '@/lib/public-view';

/**
 * Given an animal's links and the full media table, pick the single best
 * public-facing photo for a card. Preference order:
 *   1. link.isPrimaryCardCandidate and link.canonicalShot === 'side'
 *   2. any canonical side
 *   3. any canonical three-quarter
 *   4. any canonical head
 *   5. any public-eligible media for this animal
 *
 * Returns null when nothing public is available.
 */
export function pickPrimaryPhoto(
  links: readonly CattleMediaLink[],
  mediaById: ReadonlyMap<string, MediaAsset>,
): MediaAsset | null {
  const eligible = links
    .filter((l) => !l.forceExclude && l.showOnCard)
    .map((l) => {
      const media = mediaById.get(l.mediaId);
      return media && isPublicEligible(media) ? { link: l, media } : null;
    })
    .filter((x): x is { link: CattleMediaLink; media: MediaAsset } => x !== null);

  if (eligible.length === 0) return null;

  const primarySide = eligible.find(
    (e) => e.link.isPrimaryCardCandidate && e.link.canonicalShot === 'side',
  );
  if (primarySide) return primarySide.media;

  const anySide = eligible.find((e) => e.link.canonicalShot === 'side');
  if (anySide) return anySide.media;

  const anyThreeQuarter = eligible.find((e) => e.link.canonicalShot === 'three-quarter');
  if (anyThreeQuarter) return anyThreeQuarter.media;

  const anyHead = eligible.find((e) => e.link.canonicalShot === 'head');
  if (anyHead) return anyHead.media;

  return eligible[0]?.media ?? null;
}
