import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const optionValueUpdateSchema = z.object({
  valueKo: z.string().trim().min(1).optional(),
  valueEn: z.string().trim().optional(),
  priceDelta: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});

const NULLABLE_TEXT_FIELDS = new Set(["valueEn"]);

const fieldMap: Record<string, string> = {
  valueKo: "value_ko",
  valueEn: "value_en",
  priceDelta: "price_delta",
  sortOrder: "sort_order",
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/option-values/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = optionValueUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }

    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      if (NULLABLE_TEXT_FIELDS.has(key) && value === "") {
        update[fieldMap[key]] = null;
      } else {
        update[fieldMap[key]] = value;
      }
    }

    const { data, error } = await supabase
      .from("option_values")
      .update(update)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "OPTION_VALUE_NOT_FOUND", "옵션 값을 찾을 수 없습니다");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/option-values/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;

    const { data, error } = await supabase
      .from("option_values")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "OPTION_VALUE_NOT_FOUND", "옵션 값을 찾을 수 없습니다");
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return errorResponse(error);
  }
}
