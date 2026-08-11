"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";

export function LangSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(ko|en)/, "");

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-ink-muted">
      <Link
        href={`/ko${rest}`}
        className={lang === "ko" ? "text-brand" : "hover:text-ink"}
      >
        KR
      </Link>
      <span>/</span>
      <Link
        href={`/en${rest}`}
        className={lang === "en" ? "text-brand" : "hover:text-ink"}
      >
        EN
      </Link>
    </div>
  );
}
