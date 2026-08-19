import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { ProductForm } from "@/components/admin/product-form";
import type { OptionGroup, OptionValue } from "@/types/database";

export default async function NewProductPage() {
  const { supabase } = await requireAdminPage();

  const { data, error } = await supabase
    .from("option_groups")
    .select("*, option_values(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "option_values" });
  if (error) throw error;
  const optionGroups = (data ?? []) as (OptionGroup & { option_values: OptionValue[] })[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 등록</h1>
      <ProductForm optionGroups={optionGroups} />
    </div>
  );
}
