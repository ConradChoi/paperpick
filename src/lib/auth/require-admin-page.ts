import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
