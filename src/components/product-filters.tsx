"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";

const BRANDS: Record<Locale, string[]> = {
  ko: ["더블에이", "한솔카피", "페이퍼원"],
  en: ["Double A", "Hansol Copy", "PaperOne"],
};
const SIZES = ["A4", "A3", "B4", "B5"];
const WEIGHTS = [70, 75, 80];

export function ProductFilters({
  lang,
  labels,
}: {
  lang: Locale;
  labels: { brand: string; size: string; weight: string };
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
    </div>
  );
}
