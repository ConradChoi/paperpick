"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, X } from "lucide-react";

export type ImageUploadValue = {
  thumbnailUrl: string | null;
  additionalUrls: string[];
};

type ImageUploadSlotsProps = {
  value: ImageUploadValue;
  onChange: (value: ImageUploadValue) => void;
};

const MAX_ADDITIONAL = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Slot 0 is the required representative image, slots 1-4 are the optional
// additional images (`additionalUrls[slotIndex - 1]`).
type Slot = { index: number; url: string | null; isThumbnail: boolean };

export function ImageUploadSlots({ value, onChange }: ImageUploadSlotsProps) {
  const { thumbnailUrl, additionalUrls } = value;
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [errorSlot, setErrorSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        body?.error?.message ?? "이미지 업로드에 실패했습니다",
      );
    }
    return body.url as string;
  }

  async function handleFileSelect(slotIndex: number, file: File) {
    setError(null);
    setErrorSlot(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorSlot(slotIndex);
      setError("JPG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorSlot(slotIndex);
      setError("파일 크기는 5MB를 초과할 수 없습니다");
      return;
    }

    setUploadingSlot(slotIndex);
    try {
      const url = await uploadFile(file);
      if (slotIndex === 0) {
        onChange({ thumbnailUrl: url, additionalUrls });
      } else {
        // Slots are filled in visual order but stored as a dense array —
        // uploading into a slot past an empty one (e.g. only slot 4) must
        // never leave holes, since JSON.stringify turns array holes into
        // `null` and the server rejects null entries. Reconstructing the
        // 4-slot view, writing into position, then filtering keeps the
        // stored array always dense regardless of which slot was clicked.
        const positioned: (string | null)[] = Array.from(
          { length: MAX_ADDITIONAL },
          (_, i) => additionalUrls[i] ?? null,
        );
        positioned[slotIndex - 1] = url;
        const next = positioned.filter((u): u is string => !!u);
        onChange({ thumbnailUrl, additionalUrls: next });
      }
    } catch (e) {
      setErrorSlot(slotIndex);
      setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다");
    } finally {
      setUploadingSlot(null);
    }
  }

  function handleRemove(slotIndex: number) {
    setError(null);
    setErrorSlot(null);
    if (slotIndex === 0) {
      onChange({ thumbnailUrl: null, additionalUrls });
    } else {
      const next = additionalUrls.filter((_, i) => i !== slotIndex - 1);
      onChange({ thumbnailUrl, additionalUrls: next });
    }
  }

  const slots: Slot[] = [
    { index: 0, url: thumbnailUrl, isThumbnail: true },
    ...Array.from({ length: MAX_ADDITIONAL }, (_, i) => ({
      index: i + 1,
      url: additionalUrls[i] ?? null,
      isThumbnail: false,
    })),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-5 sm:overflow-visible">
        {slots.map((slot) => (
          <ImageSlot
            key={slot.index}
            slot={slot}
            uploading={uploadingSlot === slot.index}
            disabled={uploadingSlot !== null && uploadingSlot !== slot.index}
            hasError={errorSlot === slot.index}
            onSelectFile={(file) => handleFileSelect(slot.index, file)}
            onRemove={() => handleRemove(slot.index)}
          />
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        JPG·PNG·WebP, 최대 5MB, 정사각형 권장(최소 600×600px)
      </p>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function ImageSlot({
  slot,
  uploading,
  disabled,
  hasError,
  onSelectFile,
  onRemove,
}: {
  slot: Slot;
  uploading: boolean;
  disabled: boolean;
  hasError: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { url, isThumbnail } = slot;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelectFile(file);
  }

  const sizeClasses = "relative h-20 w-20 shrink-0 sm:h-auto sm:w-auto sm:aspect-square";
  const borderWidth = isThumbnail ? "border-2" : "border";
  const borderColor = hasError ? "border-error" : "border-line";

  if (!url) {
    return (
      <div className={sizeClasses}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label={
            isThumbnail ? "대표 이미지 업로드" : `추가 이미지 ${slot.index} 업로드`
          }
          className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border-dashed bg-surface-muted text-[11px] text-ink-faint transition-colors hover:border-line-strong disabled:pointer-events-none disabled:opacity-50 ${borderWidth} ${borderColor}`}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          {isThumbnail && <span>대표</span>}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
        />
        {uploading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={sizeClasses}>
      <div className={`h-full w-full overflow-hidden rounded-md ${borderWidth} ${borderColor}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
      {isThumbnail && (
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-brand px-2 py-0.5 text-[11px] text-white">
          대표
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={uploading}
        aria-label={isThumbnail ? "대표 이미지 삭제" : `추가 이미지 ${slot.index} 삭제`}
        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow disabled:pointer-events-none disabled:opacity-50"
      >
        <X className="h-3 w-3" />
      </button>
      {uploading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      )}
    </div>
  );
}
