import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const productUpdateSchema = z.object({
  brandKo: z.string().trim().min(1).optional(),
  brandEn: z.string().trim().optional(),
  nameKo: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().optional(),
  size: z.enum(["A4", "A3", "B4", "B5"]).optional(),
  weightGsm: z.number().int().positive().optional(),
  unitKo: z.string().trim().min(1).optional(),
  unitEn: z.string().trim().optional(),
  price: z.number().int().nonnegative().optional(),
  descriptionKo: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  status: z.enum(["active", "soldout"]).optional(),
});

const fieldMap: Record<string, string> = {
  brandKo: "brand_ko",
  brandEn: "brand_en",
  nameKo: "name_ko",
  nameEn: "name_en",
  size: "size",
  weightGsm: "weight_gsm",
  unitKo: "unit_ko",
  unitEn: "unit_en",
  price: "price",
  descriptionKo: "description_ko",
  descriptionEn: "description_en",
  imageUrl: "image_url",
  status: "status",
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }

    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) update[fieldMap[key]] = value;
    }

    const { data, error } = await supabase
      .from("products")
      .update(update)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;

    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return errorResponse(error);
  }
}
