"use client";

import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
  placeholder: string;
};

export function ProductGallery({ images, alt, placeholder }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  const selected = images[selectedIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-line bg-surface-muted text-sm text-ink-faint lg:w-1/2">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:w-1/2">
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-muted">
        {/* A broken main image only swaps the main frame to the placeholder
            — the thumbnail strip below stays interactive so the other,
            still-working images remain reachable. */}
        {!selected || broken ? (
          <span className="text-sm text-ink-faint">{placeholder}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => {
                setSelectedIndex(index);
                setBroken(false);
              }}
              aria-label={`${alt} 이미지 ${index + 1}`}
              aria-current={index === selectedIndex}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-20 sm:w-20 ${
                index === selectedIndex ? "border-brand" : "border-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
