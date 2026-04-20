import type { Role } from "~/schemas";

/**
 * Role-based capability gating per spec §12.4.
 *
 * Capabilities nest: Owner has all, Admin has a subset, Editor a
 * smaller subset, Contributor has only their own profile/notifications
 * + upload surface.
 *
 * One canonical source so every admin surface uses the same predicates.
 */

export type Capability =
  | "edit-animals"
  | "view-inquiries"
  | "review-uploads"
  | "resolve-pending-tags"
  | "edit-documents"
  | "upload-photos"
  | "view-audit-log"
  | "manage-team-contributors"  // add/remove contributors
  | "manage-team-full"           // add/remove any role, change roles
  | "view-financial-data"
  | "site-config"
  | "transfer-ownership";

const CAPABILITY_MATRIX: Record<Role, Set<Capability>> = {
  owner: new Set<Capability>([
    "edit-animals",
    "view-inquiries",
    "review-uploads",
    "resolve-pending-tags",
    "edit-documents",
    "upload-photos",
    "view-audit-log",
    "manage-team-contributors",
    "manage-team-full",
    "view-financial-data",
    "site-config",
    "transfer-ownership",
  ]),
  admin: new Set<Capability>([
    "edit-animals",
    "view-inquiries",
    "review-uploads",
    "resolve-pending-tags",
    "edit-documents",
    "upload-photos",
    "manage-team-contributors",
    "view-financial-data",
  ]),
  editor: new Set<Capability>([
    "edit-animals",
    "review-uploads",
    "resolve-pending-tags",
    "edit-documents",
    "upload-photos",
  ]),
  contributor: new Set<Capability>([
    "upload-photos",
  ]),
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_MATRIX[role].has(capability);
}

/**
 * Nav item visibility by role — mirrors spec §12.6.
 *   Owner/Admin/Editor see most items
 *   Editor hides Inquiries (no view-inquiries capability)
 *   Contributor sees only a minimal nav
 */
export function navItemsForRole(role: Role): Array<{
  href: string;
  label: string;
  key: string;
}> {
  if (role === "contributor") {
    return [
      { href: "/admin/settings", label: "Profile", key: "profile" },
      { href: "/admin/settings/notifications", label: "Notifications", key: "notifications" },
    ];
  }

  const items: Array<{ href: string; label: string; key: string }> = [
    { href: "/admin/herd", label: "Herd", key: "herd" },
  ];

  if (can(role, "view-inquiries")) {
    items.push({ href: "/admin/inquiries", label: "Inquiries", key: "inquiries" });
  }
  if (can(role, "review-uploads")) {
    items.push({ href: "/admin/review", label: "Review", key: "review" });
  }
  if (can(role, "resolve-pending-tags")) {
    items.push({ href: "/admin/pending-tags", label: "Pending tags", key: "pending-tags" });
    items.push({ href: "/admin/upload-issues", label: "Upload issues", key: "upload-issues" });
  }
  if (can(role, "edit-documents")) {
    items.push({ href: "/admin/documents", label: "Documents", key: "documents" });
  }
  items.push({ href: "/admin/settings", label: "Settings", key: "settings" });

  return items;
}
