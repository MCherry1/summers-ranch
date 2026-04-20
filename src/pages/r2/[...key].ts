import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

/**
 * GET /r2/<key>
 *
 * Public read-through for uploaded photos in R2. The bucket stays
 * private (R2 credentials never leave the Worker); this endpoint
 * proxies reads with appropriate caching headers. Any public request
 * for a photo goes through here.
 *
 * Phase 2 may add a signed-URL path for heavier objects, hot-path
 * caching via Cloudflare Cache API, and format conversion (HEIC→WebP)
 * on the fly. Phase 1: streams the original file with immutable cache.
 */

export const GET: APIRoute = async ({ params }) => {
  const env = cfEnv as unknown as Env;
  if (!env.PHOTOS) {
    return new Response("R2 not configured", { status: 500 });
  }

  const key = params.key;
  if (!key) return new Response("Missing key", { status: 400 });

  const object = await env.PHOTOS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Uploaded images never change — long cache is safe. A new upload
  // has a new UUID key so there's no invalidation problem.
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
};
