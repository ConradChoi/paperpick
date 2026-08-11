import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { ProductForm } from "@/components/admin/product-form";
import type { Product } from "@/types/database";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 수정</h1>
      <ProductForm product={data as Product} />
    </div>
  );
}
