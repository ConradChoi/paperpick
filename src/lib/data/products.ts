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

// One selectable choice on the product detail page's option switcher — the
// product itself is always included as the first entry, followed by any
// products an admin linked to it via product_option_links. Each carries
// every field the detail page displays, since selecting one swaps the
// entire page (price, images, spec, description), not just the price.
export type ProductOption = {
  id: string;
  brand: string;
  name: string;
  size: string;
  weightGsm: number;
  unit: string;
  price: number;
  priceVisible: boolean;
  description: string | null;
  images: string[];
};

export type ProductDetail = ProductOption & {
  // Always includes this product itself (index 0) plus its linked options,
  // so the page can render every choice uniformly.
  options: ProductOption[];
  status: string;
};

export async function fetchProduct(
  id: string,
  locale: Locale,
): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_option_links!product_option_links_product_id_fkey(option_products:products!product_option_links_option_product_id_fkey(*))",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { product_option_links, ...productRow } = data as Product & {
    product_option_links: { option_products: Product | null }[];
  };
  const p = productRow;

  const linkedOptions = (product_option_links ?? [])
    .map((row) => row.option_products)
    .filter((op): op is Product => !!op && op.status === "active")
    .map((op) => toOption(op, locale));

  return {
    ...toOption(p, locale),
    options: [toOption(p, locale), ...linkedOptions],
    status: p.status,
  };
}

function toOption(p: Product, locale: Locale): ProductOption {
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
    images: [p.image_url, ...(p.additional_image_urls ?? [])].filter(
      (url): url is string => !!url,
    ),
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
