import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/auth/admin-access";
import type { AdminMenu } from "@/types/database";

// Page-level equivalent of `src/lib/api/admin-guard.ts`'s requireAdmin() —
// redirects instead of throwing, since Server Components render a page,
// they don't return a JSON error response. Goes through the `is_admin()`
// RPC for the same reason documented there: a direct `admins` table select
// hit a self-referential RLS gap for a real logged-in admin.
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    redirect("/admin/login");
  }

  return { supabase, user };
}

// Same as requireAdminPage(), but also requires "read" access to the given
// menu — used by each menu's own list page so an operator without access
// to e.g. 리드 관리 can't reach it just by knowing the URL (the sidebar
// already hides the link, but that's cosmetic, not a boundary).
export async function requireMenuAccess(menu: AdminMenu) {
  const { supabase, user } = await requireAdminPage();
  const access = await getAdminAccess(supabase, user.id);

  if (!access.can(menu, "read")) {
    redirect("/admin");
  }

  return { supabase, user, access };
}

// Operator/group management screens are super-admin-only — see
// requireSuperAdmin() in admin-guard.ts for why this isn't a delegable
// group permission.
export async function requireSuperAdminPage() {
  const { supabase, user } = await requireAdminPage();
  const access = await getAdminAccess(supabase, user.id);

  if (!access.isSuperAdmin) {
    redirect("/admin");
  }

  return { supabase, user };
}
