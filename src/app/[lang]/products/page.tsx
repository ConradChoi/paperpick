import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { fetchProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";

export default async function ProductListPage({
  params,
  searchParams,
}: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const sp = await searchParams;
  const brand = typeof sp.brand === "string" ? sp.brand : null;
  const size = typeof sp.size === "string" ? sp.size : null;
  const weight = typeof sp.weight === "string" ? Number(sp.weight) : null;
  const page = typeof sp.page === "string" ? Math.max(1, Number(sp.page) || 1) : 1;

  const result = await fetchProducts({ brand, size, weight, locale: lang, page });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        {dict.productList.title}
      </h1>
      <ProductFilters
        lang={lang}
        labels={{
          brand: dict.productList.filterBrand,
          size: dict.productList.filterSize,
          weight: dict.productList.filterWeight,
        }}
      />

      {result.data.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-muted">
          {lang === "en" ? "No products found." : "등록된 상품이 없습니다."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              imagePlaceholder={dict.productCard.imagePlaceholder}
              inquireLabel={dict.productCard.inquire}
            />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 py-8">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
            (p) => {
              const params = new URLSearchParams();
              if (brand) params.set("brand", brand);
              if (size) params.set("size", size);
              if (weight) params.set("weight", String(weight));
              if (p > 1) params.set("page", String(p));
              const qs = params.toString();
              return (
                <Link
                  key={p}
                  href={`/${lang}/products${qs ? `?${qs}` : ""}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
                    p === page
                      ? "bg-brand text-white"
                      : "border border-line text-ink-muted hover:border-brand"
                  }`}
                >
                  {p}
                </Link>
              );
            },
          )}
        </nav>
      )}
    </div>
  );
}
