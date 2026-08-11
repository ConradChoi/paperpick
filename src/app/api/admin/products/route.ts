import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { isProductImageUrl, sanitizeProductDescription } from "@/lib/sanitize";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// Product images must come from POST /api/admin/upload (Supabase Storage),
// never a hand-typed URL — enforced here via isProductImageUrl, not just by
// convention on the frontend.
const productImageUrl = z
  .string()
  .trim()
  .min(1)
  .refine(isProductImageUrl, { message: "허용되지 않은 이미지 경로입니다" });

const productSchema = z.object({
  brandKo: z.string().trim().min(1),
  brandEn: z.string().trim().optional(),
  nameKo: z.string().trim().min(1),
  nameEn: z.string().trim().optional(),
  size: z.enum(["A4", "A3", "B4", "B5"]),
  weightGsm: z.number().int().positive(),
  unitKo: z.string().trim().min(1),
  unitEn: z.string().trim().optional(),
  price: z.number().int().nonnegative(),
  descriptionKo: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  imageUrl: productImageUrl,
  additionalImageUrls: z.array(productImageUrl).max(4).optional(),
  status: z.enum(["active", "soldout"]).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await parseJsonBody(request);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const v = parsed.data;

    const { data, error } = await supabase
      .from("products")
      .insert({
        brand_ko: v.brandKo,
        // `|| null` (not `??`), so an explicitly-cleared "" is stored as
        // null the same as an omitted field — both mean "no translation
        // yet", and downstream display falls back to the Korean value via
        // `p.brand_en ?? p.brand_ko`, which only fires on null/undefined.
        brand_en: v.brandEn || null,
        name_ko: v.nameKo,
        name_en: v.nameEn || null,
        size: v.size,
        weight_gsm: v.weightGsm,
        unit_ko: v.unitKo,
        unit_en: v.unitEn || null,
        price: v.price,
        description_ko: v.descriptionKo
          ? sanitizeProductDescription(v.descriptionKo)
          : null,
        description_en: v.descriptionEn
          ? sanitizeProductDescription(v.descriptionEn)
          : null,
        image_url: v.imageUrl,
        additional_image_urls: v.additionalImageUrls ?? [],
        status: v.status ?? "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
