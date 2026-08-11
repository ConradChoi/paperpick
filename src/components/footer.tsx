import Link from "next/link";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export async function Footer({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);

  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6 text-sm font-medium text-ink">
            <Link href={`/${lang}/privacy`} className="hover:text-brand">
              {dict.footer.privacyPolicy}
            </Link>
            <Link href={`/${lang}/terms`} className="hover:text-brand">
              {dict.footer.termsOfService}
            </Link>
          </div>
        </div>
        <div className="h-px bg-line" />
        <p className="whitespace-pre-line text-xs text-ink-faint">
          {dict.footer.companyInfo}
        </p>
        <p className="text-xs text-ink-faint">{dict.footer.copyright}</p>
      </div>
    </footer>
  );
}
