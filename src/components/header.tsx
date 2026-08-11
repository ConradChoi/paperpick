import Link from "next/link";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";
import { LangSwitcher } from "@/components/lang-switcher";
import { MobileNav } from "@/components/mobile-nav";

export async function Header({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link href={`/${lang}`} className="text-lg font-bold text-ink">
          {dict.common.logo}
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-ink-muted sm:flex sm:gap-6">
          <Link href={`/${lang}`} className="hover:text-ink">
            {dict.common.home}
          </Link>
          <Link href={`/${lang}/products`} className="hover:text-ink">
            {dict.common.products}
          </Link>
          <Link href={`/${lang}/inquiry`} className="hover:text-ink">
            {dict.common.contact}
          </Link>
          <LangSwitcher lang={lang} />
          <Link
            href={`/${lang}/inquiry`}
            className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {dict.common.inquire}
          </Link>
        </nav>
        <MobileNav lang={lang} labels={dict.common} />
      </div>
    </header>
  );
}
