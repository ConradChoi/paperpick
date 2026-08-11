import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { fetchProduct, fetchProducts } from "@/lib/data/products";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";

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

  const specs: [string, string][] = [
    [dict.productDetail.size, `${product.size} (210×297mm)`],
    [dict.productDetail.weight, `${product.weightGsm}g/m²`],
    [dict.productDetail.contents, product.unit],
    [dict.productDetail.origin, dict.productDetail.originValue],
  ];

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 lg:flex-row">
        <ProductGallery
          images={product.images}
          alt={product.name}
          placeholder={dict.productCard.imagePlaceholder}
        />
        <div className="flex flex-col gap-4 lg:w-1/2">
          <span className="text-sm text-ink-muted">{product.brand}</span>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {product.name}
          </h1>
          <p className="text-2xl font-bold text-ink">
            ₩{product.price.toLocaleString()}
          </p>
          <dl className="flex flex-col gap-2 rounded-lg bg-surface-muted p-4">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between text-[13px]">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink
            href={`/${lang}/inquiry?productId=${product.id}`}
            size="lg"
          >
            {dict.productDetail.inquireReserve}
          </ButtonLink>
        </div>
      </div>

      {product.description && (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
          <h2 className="mb-4 text-xl font-bold text-ink">
            {dict.productDetail.detailsTitle}
          </h2>
          <div
            className="product-description text-sm leading-relaxed text-ink-muted"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

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
