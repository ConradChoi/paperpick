import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import type { Product } from "@/types/database";

// See src/app/admin/(dashboard)/inquiries/page.tsx for why this is needed —
// create/edit/delete all call router.refresh() or router.push()+refresh()
// and expect the list to reflect the mutation on the very next render.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdminPage();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const products = (data ?? []) as Product[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">상품 관리</h1>
        <ButtonLink href="/admin/products/new">+ 상품 등록</ButtonLink>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-[13px] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">브랜드</th>
              <th className="px-4 py-3 font-medium">상품명</th>
              <th className="px-4 py-3 font-medium">규격</th>
              <th className="px-4 py-3 font-medium">가격</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  등록된 상품이 없습니다.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink-muted">{p.brand_ko}</td>
                <td className="px-4 py-3 font-medium text-ink">{p.name_ko}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {p.size} · {p.weight_gsm}g
                </td>
                <td className="px-4 py-3 text-ink">₩{p.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge style={p.status === "active" ? "success" : "neutral"}>
                    {p.status === "active" ? "판매중" : "품절"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-brand hover:underline"
                    >
                      수정
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name_ko} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
