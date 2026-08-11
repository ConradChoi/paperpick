import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api/error";
import { fetchProduct } from "@/lib/data/products";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/products/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const locale =
      new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ko";

    const product = await fetchProduct(id, locale);
    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    return errorResponse(error);
  }
}
