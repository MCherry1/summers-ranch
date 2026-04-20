import type { SiteConfig } from "~/schemas";
import { site as seedSite } from "./site";
import { getSiteOverride } from "./overrides";

/**
 * Overlay-aware SiteConfig accessor — merges KV override over the
 * committed seed. Used by Owner-only edits on /admin/settings/site
 * and by any public surface that needs the latest ranch metadata.
 */

export async function getSiteLive(): Promise<SiteConfig> {
  const override = await getSiteOverride();
  if (!override) return seedSite;
  return { ...seedSite, ...override };
}
