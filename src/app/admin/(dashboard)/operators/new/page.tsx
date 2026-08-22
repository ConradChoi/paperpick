import { requireSuperAdminPage } from "@/lib/auth/require-admin-page";
import { OperatorForm } from "@/components/admin/operator-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OperatorGroup } from "@/types/database";

export default async function NewOperatorPage() {
  await requireSuperAdminPage();
  const admin = createAdminClient();

  const { data, error } = await admin
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
