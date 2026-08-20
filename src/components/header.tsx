import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";
import { LangSwitcher } from "@/components/lang-switcher";
import { MobileNav } from "@/components/mobile-nav";

export async function Header({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link
          href={`/${lang}`}
          className="text-lg font-bold uppercase tracking-wide text-ink"
        >
          {dict.common.logo}
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-muted sm:flex">
          <Link href={`/${lang}/products`} className="hover:text-ink">
            {dict.common.navProducts}
          </Link>
          <Link href={`/${lang}/products`} className="hover:text-ink">
            {dict.common.navBrand}
          </Link>
          <Link href={`/${lang}/inquiry`} className="hover:text-ink">
            {dict.common.navBulk}
          </Link>
          <Link
            href={`/${lang}/inquiry`}
            className="flex items-center gap-1.5 hover:text-ink"
          >
            <MessageCircle className="h-4 w-4" />
            {dict.common.navInquire}
          </Link>
          <span className="h-4 w-px bg-line" />
          <LangSwitcher lang={lang} />
        </nav>
        <MobileNav lang={lang} labels={dict.common} />
      </div>
    </header>
  );
}
