import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requireAdminPage();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">상품 등록</h1>
      <ProductForm />
    </div>
  );
}
