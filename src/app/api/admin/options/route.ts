import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

// Used by both the Admin option-management screen and the product form's
// option picker — both need every group with its values, ordered.
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("option_groups")
      .select("*, option_values(*)")
      .order("sort_order", { ascending: true })
      .order("sort_order", { ascending: true, referencedTable: "option_values" });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

const optionGroupSchema = z.object({
  nameKo: z.string().trim().min(1),
  nameEn: z.string().trim().optional(),
  type: z.enum(["display", "variant"]),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await parseJsonBody(request);
    const parsed = optionGroupSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const v = parsed.data;

    const { data, error } = await supabase
      .from("option_groups")
      .insert({
        name_ko: v.nameKo,
        name_en: v.nameEn || null,
        type: v.type,
        sort_order: v.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
