import { redirect } from "next/navigation";
import { requireMenuAccess } from "@/lib/auth/require-admin-page";
import { ProductForm, type SelectableProduct } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const { supabase, access } = await requireMenuAccess("products");
  if (!access.can("products", "create")) redirect("/admin/products");

  const { data, error } = await supabase
    .from("products")
    .select("id, brand_ko, name_ko, price")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const availableProducts = (data ?? []) as SelectableProduct[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 등록</h1>
      <ProductForm availableProducts={availableProducts} />
    </div>
  );
}
