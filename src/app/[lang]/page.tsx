import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { Globe, Headset, MessageCircle, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard, type ProductSummary } from "@/components/product-card";
import { fetchProducts } from "@/lib/data/products";

// Same icon set used for both the Hero's compact feature row and the
// "왜 페이퍼 픽인가요" section below, for a consistent visual language.
const FEATURE_ICONS = [ShieldCheck, Globe, Headset];

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
      <section className="bg-surface px-4 py-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <div className="flex max-w-xl flex-col items-center gap-6 lg:items-start">
            <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
              <span className="text-ink">{dict.landing.heroTitleLine1}</span>
              <br />
              <span className="text-brand">{dict.landing.heroTitleLine2}</span>
            </h1>
            <p className="whitespace-pre-line text-ink-muted">
              {dict.landing.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <ButtonLink href={`/${lang}/products`} size="lg">
                {dict.landing.browseProducts}
              </ButtonLink>
              <ButtonLink
                href={`/${lang}/inquiry`}
                variant="secondary"
                size="lg"
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {dict.landing.heroBulkInquire}
              </ButtonLink>
            </div>

            <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-4 lg:justify-start">
              {dict.landing.heroFeatures.map((feature, index) => {
                const Icon = FEATURE_ICONS[index];
                return (
                  <div key={feature.title} className="flex items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0 text-brand" />
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-ink">
                        {feature.title}
                      </p>
                      <p className="text-xs text-ink-muted">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden items-stretch gap-6 lg:flex">
            <div className="aspect-square w-72 overflow-hidden rounded-2xl bg-surface-muted xl:w-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-paper-stack.jpg"
                alt={dict.landing.heroImageAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center gap-4 text-left">
              <div>
                <p className="text-lg font-bold text-ink">
                  {dict.landing.heroSpecs.size}
                </p>
                <p className="text-xs text-ink-muted">
                  {dict.landing.heroSpecs.sizeDetail}
                </p>
              </div>
              <div className="h-px w-10 bg-line" />
              <div>
                <p className="text-lg font-bold text-ink">
                  {dict.landing.heroSpecs.weight}
                </p>
                <p className="text-xs text-ink-muted">
                  {dict.landing.heroSpecs.weightDetail}
                </p>
              </div>
              <div className="h-px w-10 bg-line" />
              <div>
                <p className="text-sm font-bold text-ink">
                  {dict.landing.heroSpecs.category}
                </p>
                <p className="text-xs text-ink-muted">
                  {dict.landing.heroSpecs.categoryDetail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Paper Pick */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">
          {dict.landing.whyTitle}
        </h2>
        <div className="grid w-full gap-6 sm:grid-cols-3">
          {dict.landing.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <div
                key={feature.title}
                className="flex flex-col items-start gap-3 rounded-2xl bg-surface-muted p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <p className="font-semibold text-ink">{feature.title}</p>
                <p className="text-sm text-ink-muted">{feature.desc}</p>
              </div>
            );
          })}
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
                  priceOnRequestLabel={dict.productCard.priceOnRequest}
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
