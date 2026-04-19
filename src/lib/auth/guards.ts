import type { APIContext } from "astro";
import type { AdminUser } from "~/schemas";
import type { Capability } from "./rbac";
import { can } from "./rbac";
import { currentUser } from "./session";

/**
 * Route guards used at the top of admin-surface .astro frontmatter.
 *
 *   const user = await requireAdmin(Astro);
 *   if (user instanceof Response) return user;
 *
 * If the user is unauthenticated or lacks the capability, the guard
 * returns a redirect Response. Callers return that Response
 * immediately, short-circuiting page render.
 */

export async function requireAdmin(
  context: APIContext,
  redirectTo = "/admin/login"
): Promise<AdminUser | Response> {
  const user = await currentUser(context.request);
  if (!user) {
    const next = context.url.pathname + context.url.search;
    const target = redirectTo + "?next=" + encodeURIComponent(next);
    return context.redirect(target, 302);
  }
  return user;
}

export async function requireCapability(
  context: APIContext,
  capability: Capability
): Promise<AdminUser | Response> {
  const result = await requireAdmin(context);
  if (result instanceof Response) return result;
  if (!can(result.role, capability)) {
    return context.redirect("/admin/herd", 302);
  }
  return result;
}
