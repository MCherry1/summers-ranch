import { z } from 'zod';

export const SourceKindSchema = z.enum([
  'share-sheet-cattle',
  'share-sheet-gallery',
  'dslr-hero',
  'browser-upload',
]);

export const SubjectTypeSchema = z.enum([
  'single-animal',
  'group',
  'landscape',
  'hero',
  'detail',
  'unknown',
]);

export const ShotTypeSchema = z.enum([
  'side',
  'head',
  'three-quarter',
  'rear',
  'in-pasture',
  'with-handler',
  'group',
  'close-detail',
  'landscape',
  'hero-landscape',
  'gallery-general',
  'unknown',
]);

export const QualitySchema = z.enum(['excellent', 'good', 'fair', 'poor']);

export const MediaStateSchema = z.enum([
  'received',
  'processing',
  'classified',
  'published',
  'failed',
  'review-queue',
]);

export const PrivateMetadataSchema = z.object({
  originalFilename: z.string(),
  exifDate: z.string().nullable(),
  gpsLocation: z.tuple([z.number(), z.number()]).nullable(),
  device: z.string().nullable(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  fileHash: z.string(),
  fingerprint: z.string().nullable(),
});

export const BoundingBoxSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

export const FocalPointSchema = z.tuple([z.number(), z.number()]);

export const MediaAssetSchema = z.object({
  mediaId: z.string().uuid(),
  sourceKind: SourceKindSchema,

  originalKey: z.string(),
  publicKey: z.string().nullable(),
  cardKey: z.string().nullable(),
  thumbKey: z.string().nullable(),

  associatedAnimalId: z.string().uuid().nullable(),
  submittedTag: z.string().nullable(),
  submittedMode: z.enum(['cattle', 'gallery']).nullable(),

  uploadedAt: z.string(),
  capturedAt: z.string().nullable(),
  processedAt: z.string().nullable(),

  subjectType: SubjectTypeSchema.nullable(),
  shotType: ShotTypeSchema.nullable(),
  boundingBox: BoundingBoxSchema.nullable(),
  focalPoint: FocalPointSchema.nullable(),
  quality: QualitySchema.nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  autoAccepted: z.boolean(),
  needsReview: z.boolean(),

  publicEligible: z.boolean(),
  hidden: z.boolean(),
  deleted: z.boolean(),

  state: MediaStateSchema,
  processingErrors: z.array(z.string()),

  privateMetadata: PrivateMetadataSchema,

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type SourceKind = z.infer<typeof SourceKindSchema>;
export type ShotType = z.infer<typeof ShotTypeSchema>;
export type SubjectType = z.infer<typeof SubjectTypeSchema>;
export type Quality = z.infer<typeof QualitySchema>;
export type MediaState = z.infer<typeof MediaStateSchema>;
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type FocalPoint = z.infer<typeof FocalPointSchema>;
