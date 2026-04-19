import { z } from "zod";
import { idString, isoDateTime } from "./common";

/**
 * MediaAsset and CattleMediaLink — per CARD-REDESIGN-SPEC §22.1.
 *
 * MediaAsset is the photo; CattleMediaLink is the join to AnimalRecord
 * that carries throne state, admin overrides, and attribution. Scores
 * are 0-100 with subscores 0-1. Timeline / gallery / editorial scores
 * are null in Phase 1 (rubrics deferred per §24).
 */

export const ShotType = z.enum([
  "side-profile",
  "head",
  "three-quarter",
  "action",
  "scenic",
  "with-dam",
  "detail",
  "landscape",
  "other",
]);
export type ShotType = z.infer<typeof ShotType>;

export const Orientation = z.enum(["portrait", "landscape", "square"]);
export type Orientation = z.infer<typeof Orientation>;

export const PrescriptionSubscores = z.object({
  angle: z.number().min(0).max(1),
  legs: z.number().min(0).max(1),
  fullBody: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  head: z.number().min(0).max(1),
  cleanliness: z.number().min(0).max(1),
  background: z.number().min(0).max(1),
  lighting: z.number().min(0).max(1),
});
export type PrescriptionSubscores = z.infer<typeof PrescriptionSubscores>;

export const AestheticSubscores = z.object({
  technical: z.number().min(0).max(1),
  composition: z.number().min(0).max(1),
  lightingCharacter: z.number().min(0).max(1),
  colorTonal: z.number().min(0).max(1),
});
export type AestheticSubscores = z.infer<typeof AestheticSubscores>;

export const MediaAsset = z.object({
  id: idString,
  uri: z.string().min(1),                  // R2 key or external URL
  orientation: Orientation,
  aspectRatio: z.number().positive(),
  capturedAt: isoDateTime,                 // from EXIF
  uploadedAt: isoDateTime,
  uploadedByUserId: idString,
  batchId: z.uuid(),
  detectedShotType: ShotType,
  livePhotoPair: idString.nullable(),      // MOV component ID

  originalFilename: z.string(),

  cardFrontEligible: z.boolean(),
  timelineEligible: z.boolean(),
  galleryHerdCandidate: z.boolean(),
  galleryRanchCandidate: z.boolean(),
  editorialCandidate: z.boolean(),

  prescriptionScore: z.number().min(0).max(100).nullable(),
  prescriptionSubscores: PrescriptionSubscores.nullable(),
  aestheticScore: z.number().min(0).max(100).nullable(),
  aestheticSubscores: AestheticSubscores.nullable(),
  timelineScore: z.number().nullable(),    // null Phase 1
  galleryScore: z.number().nullable(),     // null Phase 1
  editorialScore: z.number().nullable(),   // null Phase 1
});
export type MediaAsset = z.infer<typeof MediaAsset>;

export const CattleMediaLink = z.object({
  animalId: idString,
  mediaAssetId: idString,

  // side-profile throne (evaluation shot)
  cardFrontThrone: z.boolean(),
  cardFrontThroneSince: isoDateTime.nullable(),
  cardFrontThroneLostAt: isoDateTime.nullable(),

  // beauty/action throne (not-available animals)
  cardFrontBeautyThrone: z.boolean(),
  cardFrontBeautyThroneSince: isoDateTime.nullable(),
  cardFrontBeautyThroneLostAt: isoDateTime.nullable(),

  // admin overrides
  forceInclude: z.boolean(),
  forceIncludeExpiresAt: isoDateTime.nullable(),  // bounded by life-stage
  forceExclude: z.boolean(),

  linkedAt: isoDateTime,
  linkedByUserId: idString,
});
export type CattleMediaLink = z.infer<typeof CattleMediaLink>;
