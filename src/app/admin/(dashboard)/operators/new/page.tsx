import { requireSuperAdminPage } from "@/lib/auth/require-admin-page";
import { OperatorForm } from "@/components/admin/operator-form";
import type { OperatorGroup } from "@/types/database";

export default async function NewOperatorPage() {
  const { supabase } = await requireSuperAdminPage();

  const { data, error } = await supabase
    .from("operator_groups")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  const groups = (data ?? []) as OperatorGroup[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">운영자 등록</h1>
      <OperatorForm groups={groups} />
    </div>
  );
}
