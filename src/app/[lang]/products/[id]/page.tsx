import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { fetchProduct, fetchProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { ProductOptionSwitcher } from "@/components/product-option-switcher";

export default async function ProductDetailPage({
  params,
}: PageProps<"/[lang]/products/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const product = await fetchProduct(id, lang);
  if (!product) notFound();

  const related = await fetchProducts({ locale: lang, page: 1 });
  const relatedProducts = related.data.filter((p) => p.id !== id).slice(0, 3);

  return (
    <div className="flex flex-col">
      <ProductOptionSwitcher
        lang={lang}
        options={product.options}
        imagePlaceholder={dict.productCard.imagePlaceholder}
        priceOnRequestLabel={dict.productCard.priceOnRequest}
        inquireLabel={dict.productDetail.inquireReserve}
        detailsTitle={dict.productDetail.detailsTitle}
        specLabels={{
          size: dict.productDetail.size,
          weight: dict.productDetail.weight,
          contents: dict.productDetail.contents,
          origin: dict.productDetail.origin,
          originValue: dict.productDetail.originValue,
        }}
      />

      {relatedProducts.length > 0 && (
        <div className="bg-surface-muted px-4 py-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <h2 className="text-xl font-bold text-ink">
              {dict.productDetail.relatedTitle}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  lang={lang}
                  imagePlaceholder={dict.productCard.imagePlaceholder}
                  priceOnRequestLabel={dict.productCard.priceOnRequest}
                  inquireLabel={dict.productCard.inquire}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
