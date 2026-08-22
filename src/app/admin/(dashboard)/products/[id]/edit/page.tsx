import { notFound, redirect } from "next/navigation";
import { requireMenuAccess } from "@/lib/auth/require-admin-page";
import { ProductForm, type SelectableProduct } from "@/components/admin/product-form";
import type { Product } from "@/types/database";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { supabase, access } = await requireMenuAccess("products");
  if (!access.can("products", "update")) redirect("/admin/products");
  const { id } = await params;

  const [productResult, availableProductsResult, selectedResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("products")
      .select("id, brand_ko, name_ko, price")
      .neq("id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_option_links")
      .select("option_product_id")
      .eq("product_id", id),
  ]);

  if (productResult.error) throw productResult.error;
  if (!productResult.data) notFound();
  if (availableProductsResult.error) throw availableProductsResult.error;
  if (selectedResult.error) throw selectedResult.error;

  const availableProducts = (availableProductsResult.data ?? []) as SelectableProduct[];
  const selectedOptionProductIds = (selectedResult.data ?? []).map(
    (row) => row.option_product_id as string,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 수정</h1>
      <ProductForm
        product={productResult.data as Product}
        availableProducts={availableProducts}
        selectedOptionProductIds={selectedOptionProductIds}
      />
    </div>
  );
}
