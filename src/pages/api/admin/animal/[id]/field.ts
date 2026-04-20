import type { APIRoute } from "astro";
import { z } from "zod";
import { AnimalRecord } from "~/schemas";
import { requireCapability } from "~/lib/auth/guards";
import { getAnimalLive } from "~/lib/cattle-live";
import { writeAnimalOverride } from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * POST /api/admin/animal/[id]/field
 *
 * Body: { field: string, value: unknown }
 *
 * Validates:
 *   - caller has edit-animals capability
 *   - animal exists
 *   - field is a known field in AnimalRecord
 *   - value validates against that field's schema
 *
 * Persists the change to the OVERRIDES KV and appends a per-field
 * audit entry to AUDIT_LOG. Returns { ok, animal } on success.
 *
 * Sensitive fields (privateNotes) are gated to view-financial-data;
 * Editors can't touch them.
 */

const SENSITIVE_FIELDS = new Set(["privateNotes"]);

// Map of field name → Zod schema for just that field, derived from
// the top-level AnimalRecord shape. Nested fields (performanceData.*)
// are handled as a nested object for now — edit-the-whole-object
// until a structured editor ships.
const FIELD_SCHEMAS: Record<string, z.ZodTypeAny> = {
  tag: AnimalRecord.shape.tag,
  name: AnimalRecord.shape.name,
  sex: AnimalRecord.shape.sex,
  breed: AnimalRecord.shape.breed,
  dateOfBirth: AnimalRecord.shape.dateOfBirth,
  registrationNumber: AnimalRecord.shape.registrationNumber,
  distinction: AnimalRecord.shape.distinction,
  distinctionYear: AnimalRecord.shape.distinctionYear,
  currentStatus: AnimalRecord.shape.currentStatus,
  sireId: AnimalRecord.shape.sireId,
  damId: AnimalRecord.shape.damId,
  isReference: AnimalRecord.shape.isReference,
  performanceData: AnimalRecord.shape.performanceData,
  privateNotes: AnimalRecord.shape.privateNotes,
};

export const POST: APIRoute = async (context) => {
  const guard = await requireCapability(context, "edit-animals");
  if (guard instanceof Response) return guard;
  const user = guard;

  const { id } = context.params;
  if (!id) return json({ error: "Missing animal id." }, 400);

  const animal = await getAnimalLive(id);
  if (!animal) return json({ error: "Animal not found." }, 404);

  let payload: { field?: unknown; value?: unknown };
  try {
    payload = (await context.request.json()) as typeof payload;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const field = String(payload.field ?? "");
  if (!(field in FIELD_SCHEMAS)) {
    return json({ error: `Unknown field: ${field}` }, 400);
  }

  if (SENSITIVE_FIELDS.has(field) && user.role === "editor") {
    return json({ error: "Not permitted to edit this field." }, 403);
  }

  const schema = FIELD_SCHEMAS[field]!;
  const parsed = schema.safeParse(payload.value);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid value.";
    return json({ error: message }, 400);
  }

  const newValue = parsed.data;
  const oldValue = (animal as Record<string, unknown>)[field];

  if (deepEqual(oldValue, newValue)) {
    return json({ ok: true, animal, noop: true });
  }

  await writeAnimalOverride(id, { [field]: newValue } as Partial<
    typeof animal
  >);

  await logFieldEdit({
    target: "animal",
    targetId: id,
    field,
    oldValue,
    newValue,
    actorUserId: user.id,
    timestamp: new Date().toISOString(),
  });

  // Return the freshly merged animal so the client can reflect any
  // derived values (updatedAt) without a second round-trip.
  const updated = await getAnimalLive(id);
  return json({ ok: true, animal: updated });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
