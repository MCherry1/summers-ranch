import type { AdminUser, Inquiry } from "~/schemas";
import { getAllAdminUsersLive } from "~/lib/admin-users-live";

/**
 * Notification dispatch — spec §13.3 and §17.2.
 *
 * Channels:
 *   Email via MailChannels (Cloudflare's free transactional email).
 *     Requires env.MAILCHANNELS_FROM_EMAIL to be set, plus SPF +
 *     domain-lockdown DNS records — otherwise skip gracefully.
 *   SMS via Twilio. Requires env.TWILIO_ACCOUNT_SID,
 *     env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM_NUMBER. Skips gracefully
 *     if any is missing.
 *
 * Inquiries always land in /admin/inquiries regardless of whether
 * dispatch succeeds. Notifications are a convenience; missing them
 * doesn't hide messages.
 *
 * Per-user notificationPrefs gate who gets what per spec §17.2.
 */

type NotificationEvent =
  | "new-inquiry-received"
  | "contributor-uploaded"
  | "pending-tag-requires-resolution"
  | "upload-issue-detected"
  | "nudge-surfaced";

interface DispatchContext {
  env: Env;
  publicOrigin: string;  // e.g. "https://mrsummersranch.com"
}

/**
 * Build the admin-interior URL for a given path. Falls back to a
 * sensible default if EXPECTED_ORIGIN isn't configured.
 */
export function publicOriginFrom(env: Env, requestOrigin?: string): string {
  return env.EXPECTED_ORIGIN ?? requestOrigin ?? "https://mrsummersranch.com";
}

/**
 * Fan-out a notification event to every admin user whose
 * notificationPrefs enables it on each configured channel.
 */
async function dispatchToRecipients(
  event: NotificationEvent,
  ctx: DispatchContext,
  emailPayload: { subject: string; bodyText: string },
  smsPayload: { bodyText: string }
): Promise<void> {
  const users = await getAllAdminUsersLive();

  const tasks: Promise<unknown>[] = [];
  for (const user of users) {
    const pref = user.notificationPrefs[event];
    if (!pref) continue;

    if (pref.email && user.email && !user.email.endsWith(".invalid")) {
      tasks.push(
        sendMailChannels(ctx.env, {
          to: { email: user.email, name: user.displayName },
          subject: emailPayload.subject,
          bodyText: emailPayload.bodyText,
        }).catch((err) => logDispatchFailure("email", user, err))
      );
    }

    if (pref.sms && user.phone) {
      tasks.push(
        sendTwilioSms(ctx.env, {
          to: user.phone,
          bodyText: smsPayload.bodyText,
        }).catch((err) => logDispatchFailure("sms", user, err))
      );
    }
  }

  await Promise.allSettled(tasks);
}

function logDispatchFailure(
  channel: "email" | "sms",
  user: AdminUser,
  err: unknown
): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(
    `[notify] ${channel} dispatch failed for user=${user.id}: ${message}`
  );
}

// ── MailChannels ────────────────────────────────────────────────────

interface MailChannelsRecipient {
  email: string;
  name?: string;
}

interface MailChannelsArgs {
  to: MailChannelsRecipient;
  subject: string;
  bodyText: string;
}

export async function sendMailChannels(
  env: Env,
  args: MailChannelsArgs
): Promise<void> {
  const fromEmail = env.MAILCHANNELS_FROM_EMAIL;
  if (!fromEmail) {
    // Not configured — silent skip. The inquiry still captured.
    return;
  }
  const fromName = env.MAILCHANNELS_FROM_NAME ?? "Summers Ranch";

  const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [
        {
          to: [
            {
              email: args.to.email,
              ...(args.to.name ? { name: args.to.name } : {}),
            },
          ],
        },
      ],
      from: { email: fromEmail, name: fromName },
      subject: args.subject,
      content: [{ type: "text/plain", value: args.bodyText }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `MailChannels ${res.status}: ${text.slice(0, 200)}`
    );
  }
}

// ── Twilio ──────────────────────────────────────────────────────────

interface TwilioArgs {
  to: string;        // E.164
  bodyText: string;
}

export async function sendTwilioSms(env: Env, args: TwilioArgs): Promise<void> {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    // Not configured — silent skip.
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = btoa(`${sid}:${token}`);
  const form = new URLSearchParams({
    From: from,
    To: args.to,
    Body: args.bodyText,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio ${res.status}: ${text.slice(0, 200)}`);
  }
}

// ── Inquiry-specific dispatcher ─────────────────────────────────────

export async function dispatchNewInquiryNotifications(
  inquiry: Inquiry,
  ctx: DispatchContext
): Promise<void> {
  const adminUrl = `${ctx.publicOrigin}/admin/inquiries/${inquiry.id}`;

  const emailSubject = `New inquiry: ${inquiry.subject}`;
  const emailBody = [
    `New inquiry received on Summers Ranch.`,
    ``,
    `From: ${inquiry.senderName} <${inquiry.senderEmail}>${
      inquiry.senderPhone ? ` · ${inquiry.senderPhone}` : ""
    }`,
    `Subject: ${inquiry.subject}`,
    ``,
    inquiry.message,
    ``,
    `Read and reply: ${adminUrl}`,
  ].join("\n");

  const smsBody = `New Summers Ranch inquiry from ${inquiry.senderName}. ${adminUrl}`;

  await dispatchToRecipients(
    "new-inquiry-received",
    ctx,
    { subject: emailSubject, bodyText: emailBody },
    { bodyText: smsBody }
  );
}
