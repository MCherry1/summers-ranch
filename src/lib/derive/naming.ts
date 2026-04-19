import type { AnimalRecord, Sex } from "~/schemas";

/**
 * Naming function — single canonical server-side constructor for the
 * animal's human-readable reference per spec §5.2.
 *
 *   name present → "Sweetheart"
 *   name null    → "Cow #842" (sex label + # + tag)
 *
 * Possessive form used in page titles and gallery links.
 */

const SEX_LABEL: Record<Sex, string> = {
  cow: "Cow",
  bull: "Bull",
  heifer: "Heifer",
  steer: "Steer",
  calf: "Calf",
};

export function displayName(animal: AnimalRecord): string {
  if (animal.name) return animal.name;
  return `${SEX_LABEL[animal.sex]} #${animal.tag}`;
}

export function possessive(animal: AnimalRecord): string {
  const name = displayName(animal);
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

export function galleryTitle(animal: AnimalRecord): string {
  return `${possessive(animal)} gallery`;
}

export function headerStrip(animal: AnimalRecord): string {
  if (animal.name) return `${animal.name} · #${animal.tag}`;
  return `${SEX_LABEL[animal.sex]} #${animal.tag}`;
}

export function sexLabel(sex: Sex): string {
  return SEX_LABEL[sex];
}
