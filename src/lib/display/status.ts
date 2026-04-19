import type { AnimalStatus } from "~/schemas";

/**
 * Status labels — warm, plain-language versions of the enum used
 * across card fronts, card backs, and admin. Chosen to be respectful
 * for reference animals ("In memory" rather than "Deceased") while
 * staying accurate for working-herd animals.
 *
 * Matt can tweak these in one place if the tone needs adjustment.
 */
export const STATUS_LABEL: Record<AnimalStatus, string> = {
  available: "Available",
  breeding: "Active in herd",
  growing: "Growing",
  sold: "Sold",
  deceased: "In memory",
  retired: "Retired",
};
