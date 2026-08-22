import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminMenu, PermissionAction } from "@/types/database";

export type AdminAccess = {
  isSuperAdmin: boolean;
  groupId: string | null;
  can: (menu: AdminMenu, action: PermissionAction) => boolean;
};

const NO_ACCESS: AdminAccess = {
  isSuperAdmin: false,
  groupId: null,
  can: () => false,
};

const ACTION_COLUMN: Record<PermissionAction, string> = {
  create: "can_create",
  read: "can_read",
  update: "can_update",
  delete: "can_delete",
};

// Resolves what the given (already-authenticated, already is_admin()-gated)
// user is allowed to do, using their own cookie-bound client — not a
// service-role one. `admins` is readable by any admin already
// (admins_select_admin), and operator_group_permissions has a
// select-your-own-group policy (see
// 20260822100000_operator_rls_without_service_role.sql) specifically so
// this doesn't need elevated trust: it runs on every /admin/* page load,
// so it must not depend on SUPABASE_SERVICE_ROLE_KEY being configured.
export async function getAdminAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminAccess> {
  const { data: adminRow } = await supabase
    .from("admins")
    .select("is_super_admin, group_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!adminRow) return NO_ACCESS;
  if (adminRow.is_super_admin) {
    return { isSuperAdmin: true, groupId: null, can: () => true };
  }
  if (!adminRow.group_id) {
    return { isSuperAdmin: false, groupId: null, can: () => false };
  }

  const { data: permissions } = await supabase
    .from("operator_group_permissions")
    .select("menu, can_create, can_read, can_update, can_delete")
    .eq("group_id", adminRow.group_id);

  const byMenu = new Map((permissions ?? []).map((p) => [p.menu, p]));

  return {
    isSuperAdmin: false,
    groupId: adminRow.group_id,
    can: (menu, action) => {
      const row = byMenu.get(menu) as Record<string, boolean> | undefined;
      return !!row?.[ACTION_COLUMN[action]];
    },
  };
}
