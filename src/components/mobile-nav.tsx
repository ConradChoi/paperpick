"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { LangSwitcher } from "@/components/lang-switcher";

type NavLabels = {
  navProducts: string;
  navBulk: string;
  navInquire: string;
};

export function MobileNav({
  lang,
  labels,
}: {
  lang: Locale;
  labels: NavLabels;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={lang === "ko" ? "메뉴 열기" : "Open menu"}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md border border-line"
      >
        <span
          className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full flex flex-col gap-4 border-b border-line bg-surface px-4 py-4 text-sm text-ink-muted shadow-sm">
          <Link href={`/${lang}/products`} className="hover:text-ink" onClick={() => setOpen(false)}>
            {labels.navProducts}
          </Link>
          <Link href={`/${lang}/inquiry`} className="hover:text-ink" onClick={() => setOpen(false)}>
            {labels.navBulk}
          </Link>
          <Link
            href={`/${lang}/inquiry`}
            className="flex items-center gap-1.5 hover:text-ink"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="h-4 w-4" />
            {labels.navInquire}
          </Link>
          <LangSwitcher lang={lang} />
        </nav>
      )}
    </div>
  );
}
