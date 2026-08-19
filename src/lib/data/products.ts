import { createClient } from "@/lib/supabase/server";
import type { OptionGroup, OptionType, OptionValue, Product } from "@/types/database";
import type { ProductSummary } from "@/components/product-card";
import { sanitizeProductDescription, looksLikeHtml, escapePlainTextAsHtml } from "@/lib/sanitize";

const PAGE_SIZE = 12;

type Locale = "ko" | "en";

export type ProductOptionGroupView = {
  id: string;
  name: string;
  type: OptionType;
  values: { id: string; value: string; priceDelta: number }[];
};

// Available option groups/values for the product list filters — every
// group in the catalog, independent of any single product's selection.
export async function fetchOptionGroups(locale: Locale): Promise<ProductOptionGroupView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("option_groups")
    .select("*, option_values(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "option_values" });
  if (error) throw error;

  const groups = (data ?? []) as (OptionGroup & { option_values: OptionValue[] })[];
  return groups.map((g) => ({
    id: g.id,
    name: locale === "en" ? (g.name_en ?? g.name_ko) : g.name_ko,
    type: g.type,
    values: g.option_values.map((v) => ({
      id: v.id,
      value: locale === "en" ? (v.value_en ?? v.value_ko) : v.value_ko,
      priceDelta: v.price_delta,
    })),
  }));
}

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
  // One selected value id per option group (as the filter UI renders one
  // dropdown per group) — a product must have EVERY id in this list, i.e.
  // AND across groups. Since a product can only have one value from a given
  // group's checkbox set on its own row, "has all of these ids" already
  // means "matches every selected facet."
  optionValueIds?: string[] | null;
  locale: Locale;
  page: number;
}): Promise<ProductListResult> {
  const { brand, size, weight, optionValueIds, locale, page } = params;

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

  if (optionValueIds && optionValueIds.length > 0) {
    const { data: matches, error: matchError } = await supabase
      .from("product_option_values")
      .select("product_id, option_value_id")
      .in("option_value_id", optionValueIds);
    if (matchError) throw matchError;

    const countByProduct = new Map<string, number>();
    for (const row of matches ?? []) {
      countByProduct.set(row.product_id, (countByProduct.get(row.product_id) ?? 0) + 1);
    }
    const matchingProductIds = [...countByProduct.entries()]
      .filter(([, count]) => count === optionValueIds.length)
      .map(([id]) => id);

    if (matchingProductIds.length === 0) {
      return { data: [], page, totalPages: 1 };
    }
    query = query.in("id", matchingProductIds);
  }

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
  optionGroups: ProductOptionGroupView[];
  status: string;
};

type ProductOptionValueRow = {
  option_values: (OptionValue & { option_groups: OptionGroup }) | null;
};

export async function fetchProduct(
  id: string,
  locale: Locale,
): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_option_values(option_values(*, option_groups(*)))")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { product_option_values, ...productRow } = data as Product & {
    product_option_values: ProductOptionValueRow[];
  };
  const p = productRow;
  const optionGroups = buildOptionGroups(product_option_values, locale);
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
    optionGroups,
    status: p.status,
  };
}

// Reshapes a product's flat product_option_values join rows into
// locale-resolved groups, preserving each group's/value's sort_order.
function buildOptionGroups(
  rows: ProductOptionValueRow[],
  locale: Locale,
): ProductOptionGroupView[] {
  const groupsById = new Map<string, ProductOptionGroupView & { sortOrder: number }>();
  const valuesSortOrder = new Map<string, number>();

  for (const row of rows) {
    const ov = row.option_values;
    if (!ov) continue;
    const og = ov.option_groups;
    if (!groupsById.has(og.id)) {
      groupsById.set(og.id, {
        id: og.id,
        name: locale === "en" ? (og.name_en ?? og.name_ko) : og.name_ko,
        type: og.type,
        values: [],
        sortOrder: og.sort_order,
      });
    }
    groupsById.get(og.id)!.values.push({
      id: ov.id,
      value: locale === "en" ? (ov.value_en ?? ov.value_ko) : ov.value_ko,
      priceDelta: ov.price_delta,
    });
    valuesSortOrder.set(ov.id, ov.sort_order);
  }

  return [...groupsById.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      id: group.id,
      name: group.name,
      type: group.type,
      values: group.values.sort(
        (a, b) => (valuesSortOrder.get(a.id) ?? 0) - (valuesSortOrder.get(b.id) ?? 0),
      ),
    }));
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
