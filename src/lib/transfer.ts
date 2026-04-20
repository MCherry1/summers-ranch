import type { PendingOwnershipTransfer } from "~/schemas";
import {
  getAllAdminUsersLive,
  getAdminUserLive,
} from "~/lib/admin-users-live";
import {
  getAllTransfers,
  readTransfer,
  writeUserOverride,
  writeTransfer,
} from "~/lib/overrides";
import { logFieldEdit } from "~/lib/audit";

/**
 * Ownership transfer — spec §17.7.
 *
 * Two-step mutual acknowledgment. One pending transfer at a time.
 * Transfers expire after 7 days (KV TTL + status check on read).
 *
 * Role-swap atomicity note: KV doesn't support multi-key transactions.
 * On Accept we promote the target to Owner first, then demote the
 * previous Owner to Admin. If the second write fails, the site has
 * two Owners briefly — annoying but not broken. Zero Owners (the
 * failure mode if we demoted first) would be worse.
 */

const TRANSFER_DURATION_DAYS = 7;

export async function getActiveTransfer(): Promise<PendingOwnershipTransfer | null> {
  const all = await getAllTransfers();
  const active = all.find((t) => t.status === "pending");
  if (!active) return null;

  // Defensive expiry check on read (TTL should have cleaned it, but
  // belt and suspenders).
  if (new Date(active.expiresAt).getTime() < Date.now()) {
    await writeTransfer({
      ...active,
      status: "expired",
      resolvedAt: new Date().toISOString(),
    });
    return null;
  }
  return active;
}

export async function getTransferForTarget(
  userId: string
): Promise<PendingOwnershipTransfer | null> {
  const active = await getActiveTransfer();
  if (!active) return null;
  return active.toUserId === userId ? active : null;
}

interface ProposeArgs {
  fromUserId: string;
  toUserId: string;
  confirmDisplayName: string;
}

interface ProposeResult {
  ok: boolean;
  transfer?: PendingOwnershipTransfer;
  error?: string;
}

export async function proposeTransfer(
  args: ProposeArgs
): Promise<ProposeResult> {
  const existing = await getActiveTransfer();
  if (existing) {
    return {
      ok: false,
      error:
        "Another transfer is already pending. Cancel it before proposing a new one.",
    };
  }

  const from = await getAdminUserLive(args.fromUserId);
  const to = await getAdminUserLive(args.toUserId);
  if (!from || from.role !== "owner") {
    return { ok: false, error: "Proposer must be the current Owner." };
  }
  if (!to) {
    return { ok: false, error: "Target user not found." };
  }
  if (to.role !== "admin") {
    return {
      ok: false,
      error:
        "Target must be an Admin. Promote them first from the Team page, then propose the transfer.",
    };
  }
  if (to.id === from.id) {
    return { ok: false, error: "Can't transfer to yourself." };
  }

  const normalizedConfirm = args.confirmDisplayName.trim().toLowerCase();
  const normalizedTarget = to.displayName.trim().toLowerCase();
  if (normalizedConfirm !== normalizedTarget) {
    return {
      ok: false,
      error: `Type the target's display name exactly (${to.displayName}) to confirm.`,
    };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + TRANSFER_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  const transfer: PendingOwnershipTransfer = {
    id: crypto.randomUUID(),
    fromUserId: from.id,
    toUserId: to.id,
    proposedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "pending",
    resolvedAt: null,
  };

  await writeTransfer(transfer);

  await logFieldEdit({
    target: "user",
    targetId: to.id,
    field: "ownership.proposed",
    oldValue: null,
    newValue: { fromUserId: from.id, expiresAt: transfer.expiresAt },
    actorUserId: from.id,
    timestamp: now.toISOString(),
  });

  return { ok: true, transfer };
}

export async function acceptTransfer(
  transferId: string,
  actorUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const transfer = await readTransfer(transferId);
  if (!transfer || transfer.status !== "pending") {
    return { ok: false, error: "Transfer not pending." };
  }
  if (transfer.toUserId !== actorUserId) {
    return { ok: false, error: "This transfer isn't for you." };
  }
  if (new Date(transfer.expiresAt).getTime() < Date.now()) {
    await writeTransfer({
      ...transfer,
      status: "expired",
      resolvedAt: new Date().toISOString(),
    });
    return { ok: false, error: "Transfer expired." };
  }

  const from = await getAdminUserLive(transfer.fromUserId);
  const to = await getAdminUserLive(transfer.toUserId);
  if (!from || !to) {
    await writeTransfer({
      ...transfer,
      status: "cancelled",
      resolvedAt: new Date().toISOString(),
    });
    return {
      ok: false,
      error: "A party is no longer on the team. Transfer cancelled.",
    };
  }
  if (from.role !== "owner") {
    await writeTransfer({
      ...transfer,
      status: "cancelled",
      resolvedAt: new Date().toISOString(),
    });
    return {
      ok: false,
      error: "Current Owner no longer holds Owner role. Transfer cancelled.",
    };
  }

  // Promote target first — safer failure mode (two Owners briefly)
  // than the reverse (zero Owners if promote fails after demote).
  await writeUserOverride(to.id, { role: "owner" });
  await writeUserOverride(from.id, { role: "admin" });

  const now = new Date().toISOString();
  await writeTransfer({
    ...transfer,
    status: "accepted",
    resolvedAt: now,
  });

  await logFieldEdit({
    target: "user",
    targetId: to.id,
    field: "ownership.accepted",
    oldValue: { previousOwnerId: from.id },
    newValue: { newOwnerId: to.id },
    actorUserId: actorUserId,
    timestamp: now,
  });

  return { ok: true };
}

export async function declineTransfer(
  transferId: string,
  actorUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const transfer = await readTransfer(transferId);
  if (!transfer || transfer.status !== "pending") {
    return { ok: false, error: "Transfer not pending." };
  }
  if (transfer.toUserId !== actorUserId) {
    return { ok: false, error: "This transfer isn't for you." };
  }

  const now = new Date().toISOString();
  await writeTransfer({
    ...transfer,
    status: "declined",
    resolvedAt: now,
  });

  await logFieldEdit({
    target: "user",
    targetId: transfer.toUserId,
    field: "ownership.declined",
    oldValue: { fromUserId: transfer.fromUserId },
    newValue: null,
    actorUserId: actorUserId,
    timestamp: now,
  });

  return { ok: true };
}

export async function cancelTransfer(
  transferId: string,
  actorUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const transfer = await readTransfer(transferId);
  if (!transfer || transfer.status !== "pending") {
    return { ok: false, error: "Transfer not pending." };
  }
  if (transfer.fromUserId !== actorUserId) {
    return {
      ok: false,
      error: "Only the proposing Owner can cancel this transfer.",
    };
  }

  const now = new Date().toISOString();
  await writeTransfer({
    ...transfer,
    status: "cancelled",
    resolvedAt: now,
  });

  await logFieldEdit({
    target: "user",
    targetId: transfer.toUserId,
    field: "ownership.cancelled",
    oldValue: { fromUserId: transfer.fromUserId },
    newValue: null,
    actorUserId: actorUserId,
    timestamp: now,
  });

  return { ok: true };
}

/**
 * For the Owner's Site page — returns the list of Admins available as
 * transfer targets. Matches spec §17.7: "Selects an Admin from a
 * dropdown (only Admins are eligible)".
 */
export async function eligibleTransferTargets(): Promise<
  Array<{ id: string; displayName: string; email: string }>
> {
  const all = await getAllAdminUsersLive();
  return all
    .filter((u) => u.role === "admin")
    .map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }));
}
