import { z } from "zod";
import { idString, isoDateTime } from "./common";

/**
 * AdminUser, Inquiry, AuditLogEntry, PendingOwnershipTransfer,
 * SiteConfig, InstallToken, Nudge — per CARD-REDESIGN-SPEC §22.1.
 */

export const Role = z.enum(["owner", "admin", "editor", "contributor"]);
export type Role = z.infer<typeof Role>;

export const ActivationStatus = z.enum(["not-yet-activated", "active"]);
export const TrustState = z.enum(["default", "review-required", "revoked"]);

export const PasskeyDevice = z.object({
  credentialId: z.string(),
  nickname: z.string(),
  deviceType: z.string(),
  addedAt: isoDateTime,
  lastUsedAt: isoDateTime.nullable(),
});

export const RecoveryCode = z.object({
  codeHash: z.string(),
  used: z.boolean(),
  usedAt: isoDateTime.nullable(),
});

export const NotificationPref = z.object({
  email: z.boolean(),
  sms: z.boolean(),
});

export const AdminUser = z.object({
  id: idString,
  role: Role,
  displayName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  timeZone: z.string(),                          // IANA zone
  adminAccentColor: z.string().nullable(),       // overrides --color-accent for this user

  passkeyDevices: z.array(PasskeyDevice),
  recoveryCodes: z.array(RecoveryCode).nullable(),   // Owner only

  activationStatus: ActivationStatus,
  uploadToken: z.string(),                       // hashed in storage
  trustState: TrustState,                        // applies to Contributors

  notificationPrefs: z.record(z.string(), NotificationPref),

  createdAt: isoDateTime,
  createdByUserId: idString,
});
export type AdminUser = z.infer<typeof AdminUser>;

export const InquiryStatus = z.enum(["unread", "read", "replied", "archived"]);

export const Inquiry = z.object({
  id: idString,
  receivedAt: isoDateTime,
  senderName: z.string(),
  senderEmail: z.email(),
  senderPhone: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  referencedAnimalIds: z.array(idString),
  status: InquiryStatus,
  readAt: isoDateTime.nullable(),
  readByUserId: idString.nullable(),
});
export type Inquiry = z.infer<typeof Inquiry>;

export const AuditLogEntry = z.object({
  id: idString,
  timestamp: isoDateTime,
  actorUserId: idString,
  action: z.string(),
  targetUserId: idString.nullable(),
  context: z.record(z.string(), z.unknown()),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntry>;

export const TransferStatus = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);

export const PendingOwnershipTransfer = z.object({
  id: idString,
  fromUserId: idString,
  toUserId: idString,
  proposedAt: isoDateTime,
  expiresAt: isoDateTime,                        // proposedAt + 7 days
  status: TransferStatus,
  resolvedAt: isoDateTime.nullable(),
});
export type PendingOwnershipTransfer = z.infer<typeof PendingOwnershipTransfer>;

export const SiteConfig = z.object({
  ranchName: z.string(),
  tagline: z.string(),
  contactPhone: z.string().nullable(),
  contactEmail: z.email().nullable(),
  contactAddress: z.string().nullable(),
  publicSurfaceToggles: z.record(z.string(), z.boolean()),    // Phase 2
  newUserNotificationDefaults: z.record(z.string(), NotificationPref),
  styleDirectionId: z.string(),                               // references locked v4
});
export type SiteConfig = z.infer<typeof SiteConfig>;

export const InstallToken = z.object({
  id: z.uuid(),
  forUserId: idString,
  createdAt: isoDateTime,
  expiresAt: isoDateTime,                        // createdAt + 24 hours
  consumedAt: isoDateTime.nullable(),
});
export type InstallToken = z.infer<typeof InstallToken>;

export const NudgeType = z.enum(["per-animal", "coverage"]);

export const Nudge = z.object({
  id: idString,
  type: NudgeType,
  subtype: z.string(),                           // 'stale-king', 'completion-celebration', etc.
  animalId: idString.nullable(),                 // null for coverage
  targetFieldPath: z.string().nullable(),        // deep-link to field
  createdAt: isoDateTime,
  snoozedUntil: isoDateTime.nullable(),
  dismissedAt: isoDateTime.nullable(),
  resolvedAt: isoDateTime.nullable(),
});
export type Nudge = z.infer<typeof Nudge>;
