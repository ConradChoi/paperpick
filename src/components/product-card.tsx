import Link from "next/link";
import type { Locale } from "@/app/[lang]/dictionaries";

export type ProductSummary = {
  id: string;
  brand: string;
  name: string;
  spec: string;
  price: number;
  imageUrl: string | null;
};

export function ProductCard({
  product,
  lang,
  imagePlaceholder,
  inquireLabel,
}: {
  product: ProductSummary;
  lang: Locale;
  imagePlaceholder: string;
  inquireLabel: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <Link
        href={`/${lang}/products/${product.id}`}
        className="flex aspect-4/3 items-center justify-center border-b border-line bg-surface-muted text-sm text-ink-faint"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          imagePlaceholder
        )}
      </Link>
      <div className="flex flex-col gap-2 p-4">
        <Link href={`/${lang}/products/${product.id}`} className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">{product.brand}</span>
          <span className="font-semibold text-ink">{product.name}</span>
          <span className="text-[13px] text-ink-muted">{product.spec}</span>
          <span className="text-lg font-bold text-ink">
            ₩{product.price.toLocaleString()}
          </span>
        </Link>
        <Link
          href={`/${lang}/inquiry?productId=${product.id}`}
          className="mt-1 inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          {inquireLabel}
        </Link>
      </div>
    </div>
  );
}
