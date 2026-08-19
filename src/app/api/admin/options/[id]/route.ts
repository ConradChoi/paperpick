import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const optionGroupUpdateSchema = z.object({
  nameKo: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().optional(),
  type: z.enum(["display", "variant"]).optional(),
  sortOrder: z.number().int().optional(),
});

const NULLABLE_TEXT_FIELDS = new Set(["nameEn"]);

const fieldMap: Record<string, string> = {
  nameKo: "name_ko",
  nameEn: "name_en",
  type: "type",
  sortOrder: "sort_order",
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/options/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = optionGroupUpdateSchema.safeParse(body);
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
      .from("option_groups")
      .update(update)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "OPTION_GROUP_NOT_FOUND", "옵션 그룹을 찾을 수 없습니다");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/options/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;

    // Cascades to option_values (and via those, product_option_values) —
    // see 20260819210000_product_options.sql.
    const { data, error } = await supabase
      .from("option_groups")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "OPTION_GROUP_NOT_FOUND", "옵션 그룹을 찾을 수 없습니다");
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return errorResponse(error);
  }
}
