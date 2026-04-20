import type { APIRoute } from "astro";
import { requireAdmin } from "~/lib/auth/guards";
import { acceptTransfer } from "~/lib/transfer";

/**
 * POST /api/admin/team/transfer/accept
 *
 * Body: { transferId: string }
 *
 * Any admin may call, but acceptTransfer validates that the transfer
 * was actually addressed to the caller. On success, the caller's role
 * overlay flips to "owner" and the previous Owner's flips to "admin".
 * The next page load will reflect the new role.
 */

export const POST: APIRoute = async (context) => {
  const guard = await requireAdmin(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  let payload: { transferId?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }
  const transferId = String(payload.transferId ?? "").trim();
  if (!transferId) return json({ error: "Missing transferId." }, 400);

  const result = await acceptTransfer(transferId, user.id);
  if (!result.ok) return json({ error: result.error }, 400);

  return json({ ok: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
