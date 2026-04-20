import type { Sex } from "~/schemas";

/**
 * Silhouette selection for zero-photo animals per spec §3.5. Until
 * photos exist for an animal, the card renders one of three stylized
 * Hereford silhouettes chosen by sex. Heifers and steers map to the
 * adult body; calf gets its own proportionally-larger-head variant.
 */
export function silhouetteFor(sex: Sex): string {
  switch (sex) {
    case "bull":
    case "steer":
      return "/silhouettes/hereford-bull.svg";
    case "cow":
    case "heifer":
      return "/silhouettes/hereford-cow.svg";
    case "calf":
      return "/silhouettes/hereford-calf.svg";
  }
}
