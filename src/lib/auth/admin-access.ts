import { createAdminClient } from "@/lib/supabase/admin";
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
// user is allowed to do. Uses the service-role client rather than the
// caller's cookie-bound one: operator_group_permissions is RLS-locked to
// super admins only (see 20260822010000_operator_permissions.sql) since
// operators must never read/write permission data, including their own —
// this lookup runs with elevated trust *after* the caller has already
// cleared the base admin check.
export async function getAdminAccess(userId: string): Promise<AdminAccess> {
  const admin = createAdminClient();

  const { data: adminRow } = await admin
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

  const { data: permissions } = await admin
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
