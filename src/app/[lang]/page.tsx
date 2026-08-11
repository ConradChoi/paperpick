import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard, type ProductSummary } from "@/components/product-card";
import { fetchProducts } from "@/lib/data/products";

export default async function LandingPage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  let highlightProducts: ProductSummary[] = [];
  try {
    const result = await fetchProducts({ locale: lang, page: 1 });
    highlightProducts = result.data.slice(0, 3);
  } catch {
    // Product highlight is a nice-to-have on the landing page — if the API
    // is unreachable, still render the rest of the page instead of a 500.
    highlightProducts = [];
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand px-4 py-16 text-center sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 lg:flex-row lg:justify-between lg:text-left">
          <div className="flex max-w-xl flex-col items-center gap-4 lg:items-start">
            <h1 className="whitespace-pre-line text-3xl font-bold text-white sm:text-4xl">
              {dict.landing.heroTitle}
            </h1>
            <p className="whitespace-pre-line text-white/85">
              {dict.landing.heroSubtitle}
            </p>
            <ButtonLink href={`/${lang}/products`} variant="secondary" size="lg">
              {dict.landing.browseProducts}
            </ButtonLink>
          </div>
          <div className="hidden aspect-4/3 w-full max-w-md rounded-lg bg-white/10 lg:block" />
        </div>
      </section>

      {/* Why Paper Pick */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">
          {dict.landing.whyTitle}
        </h2>
        <div className="grid w-full gap-6 sm:grid-cols-3">
          {dict.landing.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-surface-muted p-6"
            >
              <p className="font-semibold text-ink">{feature.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular products */}
      {highlightProducts.length > 0 && (
        <section className="bg-surface-muted px-4 py-16 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
            <h2 className="w-full text-2xl font-bold text-ink sm:text-3xl">
              {dict.landing.popularProducts}
            </h2>
            <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {highlightProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  imagePlaceholder={dict.productCard.imagePlaceholder}
                  inquireLabel={dict.productCard.inquire}
                />
              ))}
            </div>
            <ButtonLink href={`/${lang}/products`} variant="ghost">
              {dict.landing.viewAll}
            </ButtonLink>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="flex flex-col items-center gap-6 bg-surface-inverse px-4 py-16 text-center sm:px-8">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {dict.landing.ctaTitle}
        </h2>
        <ButtonLink href={`/${lang}/inquiry`} variant="primary" size="lg">
          {dict.landing.ctaButton}
        </ButtonLink>
      </section>
    </div>
  );
}
