"use client";

import { useState } from "react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { ButtonLink } from "@/components/ui/button";
import { ProductGallery } from "@/components/product-gallery";
import type { ProductOption } from "@/lib/data/products";

export function ProductOptionSwitcher({
  lang,
  options,
  imagePlaceholder,
  priceOnRequestLabel,
  inquireLabel,
  detailsTitle,
  specLabels,
}: {
  lang: Locale;
  // options[0] is always the product's own page; any further entries are
  // admin-linked products the User can switch to in place.
  options: ProductOption[];
  imagePlaceholder: string;
  priceOnRequestLabel: string;
  inquireLabel: string;
  detailsTitle: string;
  specLabels: {
    size: string;
    weight: string;
    contents: string;
    origin: string;
    originValue: string;
  };
}) {
  const [selectedId, setSelectedId] = useState(options[0].id);
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  const specs: [string, string][] = [
    [specLabels.size, `${selected.size} (210×297mm)`],
    [specLabels.weight, `${selected.weightGsm}g/m²`],
    [specLabels.contents, selected.unit],
    [specLabels.origin, specLabels.originValue],
  ];

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 lg:flex-row">
        <ProductGallery
          key={selected.id}
          images={selected.images}
          alt={selected.name}
          placeholder={imagePlaceholder}
        />
        <div className="flex flex-col gap-4 lg:w-1/2">
          <span className="text-sm text-ink-muted">{selected.brand}</span>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{selected.name}</h1>

          {options.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedId(option.id)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    option.id === selected.id
                      ? "bg-brand text-white"
                      : "border border-line bg-surface text-ink-muted"
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}

          <p className="text-2xl font-bold text-ink">
            {selected.priceVisible
              ? `₩${selected.price.toLocaleString()}`
              : priceOnRequestLabel}
          </p>
          <dl className="flex flex-col gap-2 rounded-lg bg-surface-muted p-4">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between text-[13px]">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href={`/${lang}/inquiry?productId=${selected.id}`} size="lg">
            {inquireLabel}
          </ButtonLink>
        </div>
      </div>

      {selected.description && (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
          <h2 className="mb-4 text-xl font-bold text-ink">{detailsTitle}</h2>
          <div
            className="product-description text-sm leading-relaxed text-ink-muted"
            dangerouslySetInnerHTML={{ __html: selected.description }}
          />
        </div>
      )}
    </div>
  );
}
