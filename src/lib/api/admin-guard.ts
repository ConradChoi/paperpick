import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/error";
import { getAdminAccess } from "@/lib/auth/admin-access";
import type { AdminMenu, PermissionAction } from "@/types/database";

// Verifies the caller has an active session AND passes `is_admin()`. RLS
// still enforces this independently on every query — this check exists so
// we can return an accurate 401 vs 403 instead of a misleading empty result.
//
// Uses the `is_admin()` RPC (SECURITY DEFINER) rather than selecting from
// `admins` directly: the `admins` table's own self-select RLS policy
// (`auth.uid() = user_id OR exists(select ... from admins ...)`) is
// self-referential, and testing against a real logged-in admin showed that
// direct select returning no row even though `is_admin()`-gated queries on
// other tables correctly saw the same user as admin. `is_admin()` is the
// verified-working path, so both RLS and this guard now go through it.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error || !isAdmin) {
    throw new ApiError(403, "FORBIDDEN", "관리자 권한이 없습니다");
  }

  return { supabase, user };
}

// Fine-grained version of requireAdmin() — an operator (non-super-admin)
// additionally needs their group to grant the given action on the given
// menu. `actions` accepts an array to mean "any of these" (e.g. image
// upload is used from both the new-product and edit-product forms, so it
// only requires create OR update, not specifically one of them).
export async function requireAdminPermission(
  menu: AdminMenu,
  actions: PermissionAction | PermissionAction[],
) {
  const { supabase, user } = await requireAdmin();
  const access = await getAdminAccess(supabase, user.id);

  const required = Array.isArray(actions) ? actions : [actions];
  if (!required.some((action) => access.can(menu, action))) {
    throw new ApiError(403, "FORBIDDEN", "이 작업에 대한 권한이 없습니다");
  }

  return { supabase, user, access };
}

// Operator group / operator account management is exclusively a super
// admin capability — never delegable via group permissions, since that
// would let an operator grant themselves more access.
export async function requireSuperAdmin() {
  const { supabase, user } = await requireAdmin();
  const access = await getAdminAccess(supabase, user.id);

  if (!access.isSuperAdmin) {
    throw new ApiError(403, "FORBIDDEN", "최고관리자만 사용할 수 있습니다");
  }

  return { supabase, user };
}
