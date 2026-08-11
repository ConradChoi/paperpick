import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error";
import { fetchProducts } from "@/lib/data/products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");
    const size = searchParams.get("size");
    const weight = searchParams.get("weight");
    const locale = searchParams.get("locale") === "en" ? "en" : "ko";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    const result = await fetchProducts({
      brand,
      size,
      weight: weight ? Number(weight) : null,
      locale,
      page,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
