import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { Badge } from "@/components/ui/badge";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryStatusSelect } from "@/components/admin/inquiry-status-select";
import { ExportButton } from "@/components/admin/export-button";
import type { InquiryType } from "@/types/database";

// Admin operational data must never be served stale — a status change via
// InquiryStatusSelect calls router.refresh() and expects the very next
// render to reflect it. Observed in testing: without this, router.refresh()
// re-ran the Server Component but still returned the pre-mutation data.
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<InquiryType, string> = {
  general: "일반 문의",
  reservation: "사전예약",
  newsletter: "뉴스레터",
};
const TYPE_BADGE: Record<InquiryType, "neutral" | "info" | "success"> = {
  general: "success",
  reservation: "info",
  newsletter: "neutral",
};
const PAGE_SIZE = 20;

export default async function AdminInquiriesPage({
  searchParams,
}: PageProps<"/admin/inquiries">) {
  const { supabase } = await requireAdminPage();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : null;
  const type = typeof sp.type === "string" ? sp.type : null;
  const search = typeof sp.search === "string" ? sp.search : null;
  const page = typeof sp.page === "string" ? Math.max(1, Number(sp.page) || 1) : 1;

  let query = supabase
    .from("inquiries")
    .select("*, products(name_ko)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (search) {
    const safe = search.replace(/[,()%_]/g, "");
    if (safe) query = query.or(`name.ilike.%${safe}%,contact.ilike.%${safe}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;

  const inquiries = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">리드 관리</h1>
        <ExportButton />
      </div>

      <InquiryFilters />

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-[13px] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">관심 상품</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">접수일</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  조건에 맞는 문의가 없습니다.
                </td>
              </tr>
            )}
            {inquiries.map((row) => {
              const product = row.products as { name_ko: string } | null;
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Badge style={TYPE_BADGE[row.type as InquiryType]}>
                      {TYPE_LABEL[row.type as InquiryType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{row.contact}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {product?.name_ko ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <InquiryStatusSelect id={row.id} status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(row.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
