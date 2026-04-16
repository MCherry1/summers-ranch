import { z } from 'zod';

export const CanonicalShotSchema = z.enum(['side', 'head', 'three-quarter']);

export const CattleMediaLinkSchema = z.object({
  linkId: z.string().uuid(),
  animalId: z.string().uuid(),
  mediaId: z.string().uuid(),

  showOnCard: z.boolean(),
  showOnDetail: z.boolean(),
  showInTimeline: z.boolean(),

  canonicalShot: CanonicalShotSchema.nullable(),
  isPrimaryCardCandidate: z.boolean(),
  isTimelineCandidate: z.boolean(),

  manualSortOrder: z.number().nullable(),
  shotTypeOverride: z.string().nullable(),
  forceInclude: z.boolean(),
  forceExclude: z.boolean(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CattleMediaLink = z.infer<typeof CattleMediaLinkSchema>;
export type CanonicalShot = z.infer<typeof CanonicalShotSchema>;
