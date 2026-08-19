"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductOptionGroupView } from "@/lib/data/products";

export function ProductOptions({
  lang,
  productId,
  basePrice,
  priceVisible,
  priceOnRequestLabel,
  optionGroups,
  inquireLabel,
}: {
  lang: Locale;
  productId: string;
  basePrice: number;
  priceVisible: boolean;
  priceOnRequestLabel: string;
  optionGroups: ProductOptionGroupView[];
  inquireLabel: string;
}) {
  const variantGroups = useMemo(
    () => optionGroups.filter((g) => g.type === "variant" && g.values.length > 0),
    [optionGroups],
  );
  const displayGroups = useMemo(
    () => optionGroups.filter((g) => g.type === "display" && g.values.length > 0),
    [optionGroups],
  );

  // Defaults to each variant group's first value, so the displayed price is
  // always concrete rather than "select an option to see the price."
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of variantGroups) {
      initial[group.id] = group.values[0].id;
    }
    return initial;
  });

  const totalDelta = variantGroups.reduce((sum, group) => {
    const value = group.values.find((v) => v.id === selected[group.id]);
    return sum + (value?.priceDelta ?? 0);
  }, 0);
  const finalPrice = basePrice + totalDelta;

  const optionSummary = variantGroups
    .map((group) => {
      const value = group.values.find((v) => v.id === selected[group.id]);
      return value ? `${group.name}: ${value.value}` : null;
    })
    .filter((s): s is string => !!s)
    .join(", ");

  const inquiryHref = `/${lang}/inquiry?productId=${productId}${
    optionSummary ? `&option=${encodeURIComponent(optionSummary)}` : ""
  }`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xl font-bold text-ink">
        {priceVisible ? `₩${finalPrice.toLocaleString()}` : priceOnRequestLabel}
      </p>

      {variantGroups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">{group.name}</span>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isSelected = selected[group.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({ ...prev, [group.id]: value.id }))
                  }
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    isSelected
                      ? "bg-brand text-white"
                      : "border border-line bg-surface text-ink-muted"
                  }`}
                >
                  {value.value}
                  {priceVisible && value.priceDelta !== 0 && (
                    <span className="ml-1 opacity-80">
                      ({value.priceDelta > 0 ? "+" : ""}
                      {value.priceDelta.toLocaleString()})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {displayGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayGroups.flatMap((group) =>
            group.values.map((value) => (
              <Badge key={value.id} style="neutral">
                {value.value}
              </Badge>
            )),
          )}
        </div>
      )}

      <ButtonLink href={inquiryHref} size="lg">
        {inquireLabel}
      </ButtonLink>
    </div>
  );
}
