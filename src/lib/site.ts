import { SiteConfig } from "~/schemas";
import siteConfigJson from "../../data/seed/site-config.json";

/**
 * Loads the validated SiteConfig. Single source of truth for ranch name,
 * tagline, contact info, and Phase-2 surface toggles (§17.8, §22).
 *
 * Parses on import so a malformed config surfaces at build time, not at
 * request time. Re-export the typed value; consumers never see Zod.
 */

export const site = SiteConfig.parse(siteConfigJson);
export type Site = typeof site;
