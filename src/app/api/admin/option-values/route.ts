import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const optionValueSchema = z.object({
  optionGroupId: z.string().uuid(),
  valueKo: z.string().trim().min(1),
  valueEn: z.string().trim().optional(),
  priceDelta: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await parseJsonBody(request);
    const parsed = optionValueSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const v = parsed.data;

    const { data, error } = await supabase
      .from("option_values")
      .insert({
        option_group_id: v.optionGroupId,
        value_ko: v.valueKo,
        value_en: v.valueEn || null,
        price_delta: v.priceDelta ?? 0,
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
