import type { APIRoute } from "astro";
import { requireCapability } from "~/lib/auth/guards";
import { readInquiry, writeInquiry } from "~/lib/overrides";

/**
 * POST /api/admin/inquiries/:id/unarchive
 *
 * Flips status back to "read" (not "unread" — the user has already
 * seen it) and redirects to the detail page.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "view-inquiries");
  if (guard instanceof Response) return guard;

  const { id } = context.params;
  if (!id) return new Response("Missing id", { status: 400 });

  const inquiry = await readInquiry(id);
  if (!inquiry) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/inquiries" },
    });
  }

  inquiry.status = "read";
  await writeInquiry(inquiry);

  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/inquiries/${id}` },
  });
};
