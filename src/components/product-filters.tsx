"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";
import type { ProductOptionGroupView } from "@/lib/data/products";

const BRANDS: Record<Locale, string[]> = {
  ko: ["더블에이", "한솔카피", "페이퍼원"],
  en: ["Double A", "Hansol Copy", "PaperOne"],
};
const SIZES = ["A4", "A3", "B4", "B5"];
const WEIGHTS = [70, 75, 80];

// Query param key for a given option group's filter dropdown — namespaced
// by group id so multiple groups' selections don't collide.
function optionParamKey(groupId: string) {
  return `og_${groupId}`;
}

export function ProductFilters({
  lang,
  labels,
  optionGroups = [],
}: {
  lang: Locale;
  labels: { brand: string; size: string; weight: string };
  optionGroups?: ProductOptionGroupView[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink-muted outline-none focus:border-brand";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className={selectClass}
        value={searchParams.get("brand") ?? ""}
        onChange={(e) => updateFilter("brand", e.target.value)}
      >
        <option value="">{labels.brand}</option>
        {BRANDS[lang].map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={searchParams.get("size") ?? ""}
        onChange={(e) => updateFilter("size", e.target.value)}
      >
        <option value="">{labels.size}</option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={searchParams.get("weight") ?? ""}
        onChange={(e) => updateFilter("weight", e.target.value)}
      >
        <option value="">{labels.weight}</option>
        {WEIGHTS.map((w) => (
          <option key={w} value={w}>
            {w}g
          </option>
        ))}
      </select>
      {optionGroups.map((group) => (
        <select
          key={group.id}
          className={selectClass}
          value={searchParams.get(optionParamKey(group.id)) ?? ""}
          onChange={(e) => updateFilter(optionParamKey(group.id), e.target.value)}
        >
          <option value="">
            {lang === "en" ? `All ${group.name}` : `${group.name} 전체`}
          </option>
          {group.values.map((v) => (
            <option key={v.id} value={v.id}>
              {v.value}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
