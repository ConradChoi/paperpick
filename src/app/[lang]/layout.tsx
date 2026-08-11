import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, locales } from "./dictionaries";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paper Pick",
  description: "믿을 수 있는 A4 복사용지, 페이퍼 픽",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${pretendard.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Header lang={lang} />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer lang={lang} />
      </body>
    </html>
  );
}
