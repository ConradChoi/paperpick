import { NextResponse } from "next/server";
import { z } from "zod";
import XlsxPopulate from "xlsx-populate";
import { requireAdminPermission } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { sanitizeSearchTerm } from "@/lib/api/search";

const MAX_ROWS = 5000;

const exportSchema = z.object({
  password: z
    .string()
    .min(6, "비밀번호는 6자 이상이어야 합니다")
    .max(200),
  status: z.enum(["new", "in_progress", "done"]).optional(),
  type: z.enum(["general", "reservation", "newsletter"]).optional(),
  search: z.string().trim().optional(),
});

const TYPE_LABEL: Record<string, string> = {
  general: "일반 문의",
  reservation: "사전예약",
  newsletter: "뉴스레터",
};

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  in_progress: "처리중",
  done: "완료",
};

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdminPermission("inquiries", "read");
    const body = await parseJsonBody(request);
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const { password, status, type, search } = parsed.data;

    // Fetch one extra row beyond MAX_ROWS so we can tell "exactly MAX_ROWS
    // total" apart from "more than MAX_ROWS, truncated" — otherwise a
    // result that happens to match the cap exactly looks identical to one
    // that got cut off.
    let query = supabase
      .from("inquiries")
      .select("*, products(name_ko, name_en)")
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS + 1);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    const safeSearch = search ? sanitizeSearchTerm(search) : "";
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,contact.ilike.%${safeSearch}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const truncated = (data?.length ?? 0) > MAX_ROWS;
    const exportedRows = truncated ? data!.slice(0, MAX_ROWS) : (data ?? []);

    const rows: (string | number)[][] = [];
    if (truncated) {
      rows.push([
        `⚠ 검색 조건에 맞는 데이터가 ${MAX_ROWS}건을 초과해 상위 ${MAX_ROWS}건만 내보냈습니다. 필터를 좁혀서 다시 시도해주세요.`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
    rows.push([
      "유형", "이름", "연락처", "관심 상품", "메시지", "언어", "상태", "접수일",
    ]);

    for (const row of exportedRows) {
      const product = row.products as
        | { name_ko: string; name_en: string | null }
        | null;
      rows.push([
        TYPE_LABEL[row.type] ?? row.type,
        row.name,
        row.contact,
        product ? product.name_ko : "",
        row.message ?? "",
        row.locale,
        STATUS_LABEL[row.status] ?? row.status,
        row.created_at,
      ]);
    }

    const workbook = await XlsxPopulate.fromBlankAsync();
    workbook.sheet(0).cell("A1").value(rows);
    const buffer = await workbook.outputAsync({ password });

    const filename = `inquiries-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
