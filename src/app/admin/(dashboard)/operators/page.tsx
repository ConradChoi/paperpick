import { requireSuperAdminPage } from "@/lib/auth/require-admin-page";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperatorGroupSelect } from "@/components/admin/operator-group-select";
import { DeleteOperatorButton } from "@/components/admin/delete-operator-button";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OperatorGroup } from "@/types/database";

export const dynamic = "force-dynamic";

type OperatorRow = {
  user_id: string;
  email: string | null;
  is_super_admin: boolean;
  group_id: string | null;
  created_at: string;
  operator_groups: { name: string } | null;
};

export default async function OperatorsPage() {
  const { user: caller } = await requireSuperAdminPage();
  const admin = createAdminClient();

  const [operatorsResult, groupsResult] = await Promise.all([
    admin
      .from("admins")
      .select("user_id, email, is_super_admin, group_id, created_at, operator_groups(name)")
      .order("created_at", { ascending: true }),
    admin.from("operator_groups").select("*").order("name", { ascending: true }),
  ]);

  if (operatorsResult.error) throw operatorsResult.error;
  if (groupsResult.error) throw groupsResult.error;

  const operators = (operatorsResult.data ?? []) as unknown as OperatorRow[];
  const groups = (groupsResult.data ?? []) as OperatorGroup[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">운영자 관리</h1>
        <ButtonLink href="/admin/operators/new">+ 운영자 등록</ButtonLink>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-[13px] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">구분</th>
              <th className="px-4 py-3 font-medium">그룹</th>
              <th className="px-4 py-3 font-medium">등록일</th>
              <th className="px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.user_id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{op.email}</td>
                <td className="px-4 py-3">
                  {op.is_super_admin ? (
                    <Badge style="info">최고관리자</Badge>
                  ) : (
                    <Badge style="neutral">운영자</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {op.is_super_admin ? (
                    <span className="text-ink-muted">전체 권한</span>
                  ) : (
                    <OperatorGroupSelect
                      userId={op.user_id}
                      groupId={op.group_id}
                      groups={groups}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(op.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  {!op.is_super_admin && op.user_id !== caller.id && (
                    <DeleteOperatorButton id={op.user_id} email={op.email ?? ""} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
