import type { APIRoute } from "astro";
import { requireCapability } from "~/lib/auth/guards";
import { resolveUploadIssue } from "~/lib/overrides";

/**
 * POST /api/admin/upload-issues/:id/resolve
 *
 * Marks an issue resolved. Redirects back to /admin/upload-issues.
 * Submitted via a plain HTML <form> so it works without JS.
 */
export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "resolve-pending-tags");
  if (guard instanceof Response) return guard;

  const { id } = context.params;
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }
  await resolveUploadIssue(id);

  return new Response(null, {
    status: 303,
    headers: { Location: "/admin/upload-issues" },
  });
};
