import type { APIRoute } from "astro";
import { z } from "zod";
import { SiteConfig } from "~/schemas";
import { requireCapability } from "~/lib/auth/guards";
import { getSiteLive } from "~/lib/site-live";
import { writeSiteOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/site/field
 *
 * Body: { field: string, value: unknown }
 *
 * Owner-only. Inline-edits on /admin/settings/site post here. Scope
 * limited to the ranch-metadata subset — Phase 2+ surface toggles
 * and style regeneration are out of scope for this endpoint.
 */

const EDITABLE_FIELDS: Record<string, z.ZodTypeAny> = {
  ranchName: SiteConfig.shape.ranchName,
  tagline: SiteConfig.shape.tagline,
  contactPhone: SiteConfig.shape.contactPhone,
  contactEmail: SiteConfig.shape.contactEmail,
  contactAddress: SiteConfig.shape.contactAddress,
};

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "site-config");
  if (guard instanceof Response) return guard;
  const user = guard;

  let payload: { field?: unknown; value?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid body." }, 400);
  }

  const field = String(payload.field ?? "");
  if (!(field in EDITABLE_FIELDS)) {
    return json({ error: `Unknown or non-editable field: ${field}` }, 400);
  }

  const schema = EDITABLE_FIELDS[field]!;
  const parsed = schema.safeParse(payload.value);
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid value." },
      400
    );
  }

  const current = await getSiteLive();
  const oldValue = (current as Record<string, unknown>)[field];
  const newValue = parsed.data;

  await writeSiteOverride({ [field]: newValue } as Partial<typeof current>);

  await logFieldEdit({
    target: "site",
    targetId: "site-config",
    field,
    oldValue,
    newValue,
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  return json({ ok: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
