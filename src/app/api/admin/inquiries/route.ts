import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/api/admin-guard";
import { errorResponse } from "@/lib/api/error";
import { sanitizeSearchTerm } from "@/lib/api/search";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdminPermission("inquiries", "read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    let query = supabase
      .from("inquiries")
      .select("*, products(name_ko, name_en)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    const safeSearch = search ? sanitizeSearchTerm(search) : "";
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,contact.ilike.%${safeSearch}%`,
      );
    }

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const items = (data ?? []).map((row) => {
      const product = row.products as { name_ko: string; name_en: string | null } | null;
      return {
        id: row.id,
        type: row.type,
        name: row.name,
        contact: row.contact,
        product: product ? product.name_ko : null,
        status: row.status,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({
      data: items,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
