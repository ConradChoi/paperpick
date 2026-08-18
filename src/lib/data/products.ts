import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";
import type { ProductSummary } from "@/components/product-card";
import { sanitizeProductDescription, looksLikeHtml, escapePlainTextAsHtml } from "@/lib/sanitize";

const PAGE_SIZE = 12;

type Locale = "ko" | "en";

export type ProductListResult = {
  data: ProductSummary[];
  page: number;
  totalPages: number;
};

// Shared by the Server Components (direct call) and the public
// `GET /api/products` route handler (client-side fetches), so both stay in
// sync with one implementation instead of two copies of the same query.
export async function fetchProducts(params: {
  brand?: string | null;
  size?: string | null;
  weight?: number | null;
  locale: Locale;
  page: number;
}): Promise<ProductListResult> {
  const { brand, size, weight, locale, page } = params;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // The filter value comes from a locale-specific brand list (see
  // ProductFilters), so it must be matched against the same locale's column.
  if (brand) query = query.eq(locale === "en" ? "brand_en" : "brand_ko", brand);
  if (size) query = query.eq("size", size);
  if (weight) query = query.eq("weight_gsm", weight);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;

  const items = (data as Product[]).map((p) => toSummary(p, locale));

  return {
    data: items,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export type ProductDetail = {
  id: string;
  brand: string;
  name: string;
  size: string;
  weightGsm: number;
  unit: string;
  price: number;
  priceVisible: boolean;
  description: string | null;
  imageUrl: string | null;
  // Representative image (imageUrl) followed by additional_image_urls, in
  // order, with empty/falsy entries filtered out. imageUrl, when present,
  // is always index 0.
  images: string[];
  status: string;
};

export async function fetchProduct(
  id: string,
  locale: Locale,
): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const p = data as Product;
  const rawDescription =
    locale === "en" ? (p.description_en ?? p.description_ko) : p.description_ko;

  return {
    id: p.id,
    brand: locale === "en" ? (p.brand_en ?? p.brand_ko) : p.brand_ko,
    name: locale === "en" ? (p.name_en ?? p.name_ko) : p.name_ko,
    size: p.size,
    weightGsm: p.weight_gsm,
    unit: locale === "en" ? (p.unit_en ?? p.unit_ko) : p.unit_ko,
    price: p.price,
    priceVisible: p.price_visible,
    // Re-sanitized here even though it's sanitized on write — defense in
    // depth against rows written before this allowlist existed or edited
    // directly in the DB, since this is what the public page renders.
    // Rows written before the rich-text editor existed are plain text, not
    // HTML — those must never be run through sanitizeHtml (see looksLikeHtml
    // for why) and are instead escaped + line-break-converted directly.
    description: rawDescription
      ? looksLikeHtml(rawDescription)
        ? sanitizeProductDescription(rawDescription)
        : escapePlainTextAsHtml(rawDescription)
      : null,
    imageUrl: p.image_url,
    images: [p.image_url, ...(p.additional_image_urls ?? [])].filter(
      (url): url is string => !!url,
    ),
    status: p.status,
  };
}

function toSummary(p: Product, locale: Locale): ProductSummary {
  return {
    id: p.id,
    brand: locale === "en" ? (p.brand_en ?? p.brand_ko) : p.brand_ko,
    name: locale === "en" ? (p.name_en ?? p.name_ko) : p.name_ko,
    spec: `${p.size} · ${p.weight_gsm}g · ${locale === "en" ? (p.unit_en ?? p.unit_ko) : p.unit_ko}`,
    price: p.price,
    priceVisible: p.price_visible,
    imageUrl: p.image_url,
  };
}
