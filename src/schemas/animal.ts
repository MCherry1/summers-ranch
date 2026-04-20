import { z } from "zod";
import { idString, isoDate, isoDateTime } from "./common";

/**
 * AnimalRecord — per CARD-REDESIGN-SPEC §22.1.
 *
 * animalId is the stable internal identity; tags can change (damaged ear
 * tag), names can change, registration numbers arrive late. All internal
 * URL paths use animalId. Public surfaces may display tag.
 */

export const Sex = z.enum(["cow", "bull", "heifer", "steer", "calf"]);
export type Sex = z.infer<typeof Sex>;

export const AnimalStatus = z.enum([
  "available",  // for sale
  "breeding",   // active in herd, not for sale
  "growing",    // calf/yearling, not yet breeding, not for sale
  "sold",       // sold to another operation
  "deceased",
  "retired",    // reference/companion, not active
]);
export type AnimalStatus = z.infer<typeof AnimalStatus>;

export const Distinction = z.enum(["DOD", "SOD"]);
export type Distinction = z.infer<typeof Distinction>;

export const PerformanceData = z.object({
  weaningWeight: z.number().nullable(),
  yearlingWeight: z.number().nullable(),
  epd: z.record(z.string(), z.number()).nullable(),
});
export type PerformanceData = z.infer<typeof PerformanceData>;

export const AnimalRecord = z.object({
  id: idString,
  tag: z.string().min(1),
  name: z.string().nullable(),
  sex: Sex,
  breed: z.string().default("Hereford"),
  dateOfBirth: isoDate.nullable(),
  registrationNumber: z.string().nullable(),     // AHA number
  distinction: Distinction.nullable(),
  distinctionYear: z.number().int().nullable(),
  currentStatus: AnimalStatus,
  sireId: idString.nullable(),
  damId: idString.nullable(),
  isReference: z.boolean(),                      // deceased or sold-untracked
  performanceData: PerformanceData.nullable(),
  privateNotes: z.string().default(""),          // admin-only, never public
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type AnimalRecord = z.infer<typeof AnimalRecord>;
