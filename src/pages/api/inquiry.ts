import type { APIRoute } from "astro";
import { z } from "zod";
import { env as cfEnv } from "cloudflare:workers";
import type { Inquiry } from "~/schemas";
import { writeInquiry } from "~/lib/overrides";
import {
  dispatchNewInquiryNotifications,
  publicOriginFrom,
} from "~/lib/notify";
import { getAnimalLive } from "~/lib/cattle-live";

/**
 * POST /api/inquiry
 *
 * Public submission endpoint per spec §13.1. Accepts either JSON
 * (XHR from enhanced forms) or application/x-www-form-urlencoded
 * (plain HTML form). Responds with JSON for XHR callers and a 303
 * redirect to /contact?sent=1 for form POSTs (progressive enhancement
 * — works without JavaScript).
 *
 * Safety measures for Phase 1:
 *   - Honeypot field `website` (bots fill; real users don't see it)
 *   - Per-IP rate limit: 1 submission per 60s via CHALLENGES KV
 *   - Zod validation with reasonable length limits
 *   - Email format check
 *
 * On success:
 *   - Writes Inquiry record to OVERRIDES KV (inquiry:<uuid>)
 *   - Dispatches email + SMS via waitUntil per user notificationPrefs
 *     (§13.3). Channels skip gracefully when not configured.
 */

const Body = z.object({
  senderName: z.string().trim().min(1).max(120),
  senderEmail: z.email().max(200),
  senderPhone: z.string().trim().max(40).nullable().optional(),
  message: z.string().trim().min(5).max(4000),
  subject: z.string().trim().max(200).optional(),
  referencedAnimalIds: z.array(z.string()).max(8).optional(),
  website: z.string().optional(),  // honeypot — should be empty
});

export const POST: APIRoute = async (context) => {
  const env = cfEnv as unknown as Env;
  const contentType = context.request.headers.get("content-type") ?? "";
  const wantsJson =
    contentType.includes("application/json") ||
    context.request.headers.get("accept")?.includes("application/json") === true;

  // Parse either JSON or form body
  let raw: Record<string, unknown>;
  try {
    if (contentType.includes("application/json")) {
      raw = (await context.request.json()) as Record<string, unknown>;
    } else {
      const form = await context.request.formData();
      raw = {};
      form.forEach((value, key) => {
        if (key === "referencedAnimalIds") {
          raw[key] = String(value)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          raw[key] = value;
        }
      });
    }
  } catch {
    return respond(context, wantsJson, 400, {
      error: "Couldn't parse request body.",
    });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? "Invalid submission.";
    return respond(context, wantsJson, 400, { error: message });
  }

  const input = parsed.data;

  // Honeypot — silent success to avoid giving the bot a signal
  if (input.website && input.website.trim() !== "") {
    return respond(context, wantsJson, 200, { ok: true });
  }

  // Per-IP rate limit (60 seconds)
  const ip =
    context.request.headers.get("cf-connecting-ip") ??
    context.request.headers.get("x-forwarded-for") ??
    "unknown";
  if (env.CHALLENGES) {
    const rateKey = `rate:inquiry:${ip}`;
    const recent = await env.CHALLENGES.get(rateKey);
    if (recent) {
      return respond(context, wantsJson, 429, {
        error: "Please wait a moment before sending another message.",
      });
    }
    await env.CHALLENGES.put(rateKey, "1", { expirationTtl: 60 });
  }

  // Resolve referenced animals for context (subject composition +
  // inquiry record).
  const referencedAnimalIds = input.referencedAnimalIds ?? [];
  const referencedAnimals = (
    await Promise.all(referencedAnimalIds.map((id) => getAnimalLive(id)))
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  const subject = input.subject?.trim()
    ? input.subject.trim()
    : composeSubject(referencedAnimals);

  const inquiry: Inquiry = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    senderPhone: input.senderPhone ?? null,
    subject,
    message: input.message,
    referencedAnimalIds: referencedAnimals.map((a) => a.id),
    status: "unread",
    readAt: null,
    readByUserId: null,
  };

  try {
    await writeInquiry(inquiry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return respond(context, wantsJson, 500, {
      error: `Couldn't save your message: ${message}`,
    });
  }

  // Fire-and-forget notifications
  const ctx = context.locals.runtime?.cfContext;
  const publicOrigin = publicOriginFrom(
    env,
    new URL(context.request.url).origin
  );
  const notifyJob = () =>
    dispatchNewInquiryNotifications(inquiry, { env, publicOrigin });

  if (ctx?.waitUntil) {
    ctx.waitUntil(notifyJob());
  } else {
    void notifyJob();
  }

  return respond(context, wantsJson, 200, {
    ok: true,
    inquiry: { id: inquiry.id, subject: inquiry.subject },
  });
};

function composeSubject(
  animals: Array<{ name: string | null; tag: string; id: string }>
): string {
  if (animals.length === 0) return "General inquiry";
  if (animals.length === 1) {
    const a = animals[0]!;
    return `About ${a.name ?? `#${a.tag}`}`;
  }
  const names = animals
    .map((a) => a.name ?? `#${a.tag}`)
    .slice(0, 3)
    .join(", ");
  return `About ${names}`;
}

function respond(
  context: { redirect: (url: string, status?: 303) => Response },
  wantsJson: boolean,
  status: number,
  body: { ok?: boolean; error?: string; inquiry?: { id: string; subject: string } }
): Response {
  if (wantsJson) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Form POST — redirect with a query param so the contact page can
  // show a confirmation message or an error banner without needing JS.
  if (status >= 400) {
    const qs = new URLSearchParams({
      error: body.error ?? "Couldn't send.",
    });
    return context.redirect(`/contact?${qs.toString()}`, 303);
  }
  return context.redirect(`/contact?sent=1`, 303);
}
