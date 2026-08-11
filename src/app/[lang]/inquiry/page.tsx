import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { fetchProduct } from "@/lib/data/products";
import { InquiryForm } from "@/components/inquiry-form";

export default async function InquiryPage({
  params,
  searchParams,
}: PageProps<"/[lang]/inquiry">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const sp = await searchParams;
  const productId = typeof sp.productId === "string" ? sp.productId : undefined;
  const product = productId ? await fetchProduct(productId, lang) : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          {dict.inquiryForm.title}
        </h1>
        <p className="text-sm text-ink-muted">
          {product ? dict.inquiryForm.subtitleDesktop : dict.inquiryForm.subtitle}
        </p>
      </div>
      <InquiryForm
        lang={lang}
        dict={dict.inquiryForm}
        productId={product?.id}
        productName={product?.name}
        defaultType={product ? "reservation" : "general"}
      />
    </div>
  );
}
