/**
 * Phase 1: seed media records reference `placeholders/*.jpg` keys that don't
 * physically exist. The generator writes `.svg` files in `public/placeholders/`
 * alongside them. This helper maps a seed key to a browser-resolvable URL.
 *
 * Phase 2 replaces this with an R2-backed URL resolver.
 */
export function resolveMediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const withLeadingSlash = key.startsWith('/') ? key : `/${key}`;
  return withLeadingSlash.replace(/\.jpg$/i, '.svg');
}
