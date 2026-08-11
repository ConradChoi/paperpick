import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "../dictionaries";

const COPY: Record<Locale, { title: string; body: string }> = {
  ko: {
    title: "개인정보처리방침",
    body: "이 페이지는 준비 중입니다. 실제 개인정보처리방침 내용은 privacy-security-officer 검토 후 게시됩니다.",
  },
  en: {
    title: "Privacy Policy",
    body: "This page is a placeholder. The actual privacy policy will be published after privacy-security-officer review.",
  },
};

export default async function PrivacyPage({
  params,
}: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const copy = COPY[lang];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-bold text-ink">{copy.title}</h1>
      <p className="text-sm text-ink-muted">{copy.body}</p>
    </div>
  );
}
