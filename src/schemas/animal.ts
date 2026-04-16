import { z } from 'zod';

export const SexSchema = z.enum(['bull', 'cow', 'heifer', 'steer', 'calf']);
export const StatusSchema = z.enum([
  'breeding',
  'sale',
  'sold',
  'retained',
  'culled',
  'deceased',
  'reference',
]);
export const SourceSchema = z.enum(['herd', 'purchased', 'reference']);
export const AcquisitionMethodSchema = z.enum([
  'private-treaty',
  'auction',
  'consignment',
  'production',
  'online',
  'other',
]);
export const AhaReadinessSchema = z.enum([
  'not-applicable',
  'not-started',
  'in-progress',
  'ready-for-owner-review',
  'ready-for-submission',
  'submitted',
  'registered',
  'blocked',
]);
export const PregnancyStatusSchema = z.enum(['open', 'bred', 'confirmed']);
export const CalfStatusSchema = z.enum(['nursing', 'weaned']);
export const TagHistoryReasonSchema = z.enum([
  'birth-default',
  'weaning-retag',
  'correction',
  'replacement-tag',
  'initial',
  'unknown',
]);

export const CalvingEaseSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const DispositionSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const TagHistoryEntrySchema = z.object({
  tag: z.string(),
  normalizedTag: z.string(),
  effectiveStart: z.string(),
  effectiveEnd: z.string().nullable(),
  reason: TagHistoryReasonSchema,
  qualifier: z.string().nullable(),
  isDisplayTagAtThatTime: z.boolean(),
});

export const AnimalSchema = z.object({
  animalId: z.string().uuid(),
  displayTag: z.string(),
  normalizedTag: z.string(),
  tagHistory: z.array(TagHistoryEntrySchema),

  name: z.string().nullable(),
  species: z.literal('cattle'),
  sex: SexSchema.nullable(),
  status: StatusSchema.nullable(),

  sireAnimalId: z.string().uuid().nullable(),
  damAnimalId: z.string().uuid().nullable(),
  sireDisplayFallback: z.string().nullable(),
  damDisplayFallback: z.string().nullable(),

  calfStatus: CalfStatusSchema.nullable(),
  isProvisionalTag: z.boolean(),

  birthDate: z.string().nullable(),
  deathDate: z.string().nullable(),
  dateEntered: z.string().nullable(),
  source: SourceSchema.nullable(),
  sourceRanch: z.string().nullable(),
  acquisitionMethod: AcquisitionMethodSchema.nullable(),
  showSourcePublicly: z.boolean(),

  birthWeight: z.number().nullable(),
  weaningWeight: z.number().nullable(),
  yearlingWeight: z.number().nullable(),
  calvingEase: CalvingEaseSchema.nullable(),
  disposition: DispositionSchema.nullable(),

  registrationNumber: z.string().nullable(),
  tattoo: z.string().nullable(),
  breed: z.string().nullable(),
  breedDetail: z.string().nullable(),
  ahaReadiness: AhaReadinessSchema.nullable(),

  pregnancyStatus: PregnancyStatusSchema.nullable(),
  pregnancySetDate: z.string().nullable(),
  expectedCalving: z.string().nullable(),

  soldTo: z.string().nullable(),
  saleMethod: z.string().nullable(),
  saleDate: z.string().nullable(),
  saleNotes: z.string().nullable(),

  removalDate: z.string().nullable(),
  removalReason: z.string().nullable(),

  branded: z.boolean(),
  notes: z.string().nullable(),

  publicVisible: z.boolean(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Animal = z.infer<typeof AnimalSchema>;
export type TagHistoryEntry = z.infer<typeof TagHistoryEntrySchema>;
export type Sex = z.infer<typeof SexSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type AcquisitionMethod = z.infer<typeof AcquisitionMethodSchema>;
export type AhaReadiness = z.infer<typeof AhaReadinessSchema>;
export type PregnancyStatus = z.infer<typeof PregnancyStatusSchema>;
export type CalfStatus = z.infer<typeof CalfStatusSchema>;
export type CalvingEase = z.infer<typeof CalvingEaseSchema>;
export type Disposition = z.infer<typeof DispositionSchema>;
