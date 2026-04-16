/**
 * Turn an ISO birth date into a human-readable age string.
 * Returns null for null input; returns a short label otherwise
 * (e.g., "2 weeks", "3 months", "4 years").
 */
export function computeAge(
  birthDate: string | null,
  referenceDate: Date = new Date(),
): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const diffMs = referenceDate.getTime() - birth.getTime();
  if (diffMs < 0) return null;

  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);

  if (days < 14) return days === 1 ? '1 day' : `${days} days`;
  if (days < 60) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30));
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365.25);
  const remainingDays = days - Math.floor(years * 365.25);
  const remainingMonths = Math.round(remainingDays / 30);
  if (years < 3 && remainingMonths > 0 && remainingMonths < 12) {
    return `${years} yr ${remainingMonths} mo`;
  }
  return years === 1 ? '1 year' : `${years} years`;
}
