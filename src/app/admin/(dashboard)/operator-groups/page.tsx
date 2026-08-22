import { requireSuperAdminPage } from "@/lib/auth/require-admin-page";
import { OperatorGroupsManager } from "@/components/admin/operator-groups-manager";
import type { OperatorGroup, OperatorGroupPermission } from "@/types/database";

// Group create/update/delete all call router.refresh() and expect the very
// next render to reflect it — same reasoning as products/inquiries pages.
export const dynamic = "force-dynamic";

export default async function OperatorGroupsPage() {
  const { supabase } = await requireSuperAdminPage();

  const { data, error } = await supabase
    .from("operator_groups")
    .select("*, operator_group_permissions(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const groups = (data ?? []) as (OperatorGroup & {
    operator_group_permissions: OperatorGroupPermission[];
  })[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">운영자 그룹 관리</h1>
      <p className="text-sm text-ink-muted">
        그룹별로 메뉴 접근 권한(등록/조회/수정/삭제)을 설정합니다. 운영자
        등록 시 그룹을 지정하면 해당 그룹의 권한이 그대로 적용됩니다.
      </p>
      <OperatorGroupsManager groups={groups} />
    </div>
  );
}
