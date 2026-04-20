/**
 * Age derivations from date of birth.
 *
 * formatAge() returns human-readable strings appropriate for card
 * display — short and plain-language, no "Not set" for null. Life
 * stage per spec §14.10 drives staleness thresholds and bucketing
 * density elsewhere.
 */

export interface LifeStage {
  key: "newborn" | "young-calf" | "weanling" | "yearling" | "mature";
  label: string;
}

export function ageInDays(
  dateOfBirth: string | null,
  today: Date = new Date()
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth + "T00:00:00Z");
  if (Number.isNaN(dob.getTime())) return null;
  const ms = today.getTime() - dob.getTime();
  return Math.floor(ms / 86_400_000);
}

export function lifeStage(ageDays: number | null): LifeStage | null {
  if (ageDays === null) return null;
  if (ageDays < 60) return { key: "newborn", label: "Newborn" };
  if (ageDays < 205) return { key: "young-calf", label: "Young calf" };
  if (ageDays < 365) return { key: "weanling", label: "Weanling" };
  if (ageDays < 730) return { key: "yearling", label: "Yearling" };
  return { key: "mature", label: "Mature" };
}

/**
 * Card-ready age string. Prioritizes the unit that reads most
 * naturally for the animal's life stage.
 *   < 60 days  → "23 days"
 *   < 2 years  → "11 months"
 *   ≥ 2 years  → "9 years"
 */
export function formatAge(
  dateOfBirth: string | null,
  today: Date = new Date()
): string | null {
  const days = ageInDays(dateOfBirth, today);
  if (days === null) return null;
  if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 730) {
    const months = Math.floor(days / 30.44);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const dob = new Date(dateOfBirth! + "T00:00:00Z");
  let years = today.getUTCFullYear() - dob.getUTCFullYear();
  const hadBirthday =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() &&
      today.getUTCDate() >= dob.getUTCDate());
  if (!hadBirthday) years -= 1;
  return `${years} year${years === 1 ? "" : "s"}`;
}
