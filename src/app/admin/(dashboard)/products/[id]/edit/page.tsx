import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { ProductForm } from "@/components/admin/product-form";
import type { OptionGroup, OptionValue, Product } from "@/types/database";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;

  const [productResult, optionGroupsResult, selectedResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("option_groups")
      .select("*, option_values(*)")
      .order("sort_order", { ascending: true })
      .order("sort_order", { ascending: true, referencedTable: "option_values" }),
    supabase
      .from("product_option_values")
      .select("option_value_id")
      .eq("product_id", id),
  ]);

  if (productResult.error) throw productResult.error;
  if (!productResult.data) notFound();
  if (optionGroupsResult.error) throw optionGroupsResult.error;
  if (selectedResult.error) throw selectedResult.error;

  const optionGroups = (optionGroupsResult.data ?? []) as (OptionGroup & {
    option_values: OptionValue[];
  })[];
  const selectedOptionValueIds = (selectedResult.data ?? []).map(
    (row) => row.option_value_id as string,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 수정</h1>
      <ProductForm
        product={productResult.data as Product}
        optionGroups={optionGroups}
        selectedOptionValueIds={selectedOptionValueIds}
      />
    </div>
  );
}
