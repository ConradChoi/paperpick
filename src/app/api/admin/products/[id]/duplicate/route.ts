import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import type { Product } from "@/types/database";

// Copies an existing product into a new row — same fields (including
// already-uploaded image URLs and description HTML, which are safe to
// reuse as-is) plus the option products it links to, so an admin doesn't
// have to re-enter a near-identical listing (e.g. a new weight/price
// variant) from scratch. The new row starts as a soldout draft so it
// isn't accidentally live before the admin reviews it on the edit screen.
export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]/duplicate">,
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;

    const { data: source, error: sourceError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
    }
    const p = source as Product;

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        brand_ko: p.brand_ko,
        brand_en: p.brand_en,
        name_ko: `${p.name_ko} (복사본)`,
        name_en: p.name_en ? `${p.name_en} (Copy)` : null,
        size: p.size,
        weight_gsm: p.weight_gsm,
        unit_ko: p.unit_ko,
        unit_en: p.unit_en,
        price: p.price,
        price_visible: p.price_visible,
        description_ko: p.description_ko,
        description_en: p.description_en,
        image_url: p.image_url,
        additional_image_urls: p.additional_image_urls,
        status: "soldout",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const { data: links, error: linksError } = await supabase
      .from("product_option_links")
      .select("option_product_id")
      .eq("product_id", id);
    if (linksError) throw linksError;

    if (links && links.length > 0) {
      const { error: linkInsertError } = await supabase
        .from("product_option_links")
        .insert(
          links.map((l) => ({
            product_id: newProduct.id,
            option_product_id: l.option_product_id,
          })),
        );
      if (linkInsertError) throw linkInsertError;
    }

    return NextResponse.json({ data: newProduct }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
