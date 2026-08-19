import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { OptionsManager } from "@/components/admin/options-manager";
import type { OptionGroup, OptionValue } from "@/types/database";

// Same reasoning as products/inquiries — group/value create/update/delete
// all call router.refresh() and expect the list to reflect the mutation on
// the very next render.
export const dynamic = "force-dynamic";

export default async function AdminOptionsPage() {
  const { supabase } = await requireAdminPage();

  const { data, error } = await supabase
    .from("option_groups")
    .select("*, option_values(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "option_values" });

  if (error) throw error;

  const groups = (data ?? []) as (OptionGroup & { option_values: OptionValue[] })[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">옵션 관리</h1>
      </div>
      <p className="text-sm text-ink-muted">
        여기서 등록한 옵션 그룹/값은 상품 등록·수정 화면에서 상품별로 선택해
        적용할 수 있습니다. &apos;노출용&apos; 옵션은 정보 표시용 배지로,
        &apos;구매 옵션&apos;은 User가 선택하면 가격에 차액이 반영됩니다.
      </p>
      <OptionsManager groups={groups} />
    </div>
  );
}
