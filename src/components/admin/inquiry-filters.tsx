"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  { value: "new", label: "신규" },
  { value: "in_progress", label: "처리중" },
  { value: "done", label: "완료" },
];
const TYPES = [
  { value: "general", label: "일반 문의" },
  { value: "reservation", label: "사전예약" },
  { value: "newsletter", label: "뉴스레터" },
];

export function InquiryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "rounded-md border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-muted outline-none focus:border-brand";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className={selectClass}
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="">전체 상태</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={searchParams.get("type") ?? ""}
        onChange={(e) => updateFilter("type", e.target.value)}
      >
        <option value="">전체 유형</option>
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateFilter("search", search);
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색 (이름/연락처)"
          className={selectClass}
        />
      </form>
    </div>
  );
}
