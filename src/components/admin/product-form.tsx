"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { ImageUploadSlots, type ImageUploadValue } from "@/components/admin/image-upload-slots";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { OptionGroup, OptionValue, Product } from "@/types/database";

const SIZES = ["A4", "A3", "B4", "B5"];

type OptionGroupWithValues = OptionGroup & { option_values: OptionValue[] };

export function ProductForm({
  product,
  optionGroups = [],
  selectedOptionValueIds = [],
}: {
  product?: Product;
  optionGroups?: OptionGroupWithValues[];
  selectedOptionValueIds?: string[];
}) {
  const router = useRouter();
  const isEdit = !!product;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageUploadValue>({
    thumbnailUrl: product?.image_url ?? null,
    additionalUrls: product?.additional_image_urls ?? [],
  });
  const [descriptionKo, setDescriptionKo] = useState(product?.description_ko ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.description_en ?? "");
  const [priceVisible, setPriceVisible] = useState(product?.price_visible ?? true);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(selectedOptionValueIds),
  );

  function toggleOption(valueId: string) {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(valueId)) next.delete(valueId);
      else next.add(valueId);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!images.thumbnailUrl) {
      setError("대표 이미지를 등록해주세요");
      return;
    }

    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      brandKo: form.get("brandKo"),
      // Always send the field, even "" — the API normalizes "" to null.
      // Swallowing "" into `undefined` here would make PATCH treat an
      // intentionally-cleared field as "no change" and keep the old value.
      brandEn: form.get("brandEn") ?? "",
      nameKo: form.get("nameKo"),
      nameEn: form.get("nameEn") ?? "",
      size: form.get("size"),
      weightGsm: Number(form.get("weightGsm")),
      unitKo: form.get("unitKo"),
      unitEn: form.get("unitEn") ?? "",
      price: Number(form.get("price")),
      priceVisible,
      descriptionKo,
      descriptionEn,
      imageUrl: images.thumbnailUrl,
      additionalImageUrls: images.additionalUrls,
      status: form.get("status"),
      optionValueIds: Array.from(selectedOptions),
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      setSubmitting(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-ink">상품 이미지</span>
        <ImageUploadSlots value={images} onChange={setImages} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="브랜드 (한글)"
          name="brandKo"
          defaultValue={product?.brand_ko}
          required
        />
        <FormField
          label="브랜드 (영문)"
          name="brandEn"
          defaultValue={product?.brand_en ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="상품명 (한글)"
          name="nameKo"
          defaultValue={product?.name_ko}
          required
        />
        <FormField
          label="상품명 (영문)"
          name="nameEn"
          defaultValue={product?.name_en ?? ""}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-ink">규격</label>
          <select
            name="size"
            defaultValue={product?.size ?? "A4"}
            className="rounded-md border border-line px-4 py-3 text-sm text-ink outline-none focus:border-brand"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="평량 (g)"
          name="weightGsm"
          type="number"
          defaultValue={product?.weight_gsm}
          required
        />
        <FormField
          label="가격 (원)"
          name="price"
          type="number"
          defaultValue={product?.price}
          required
        />
      </div>

      <Checkbox
        name="priceVisible"
        label="User 화면에 가격 노출 (해제 시 '가격문의'로 표시)"
        checked={priceVisible}
        onChange={(e) => setPriceVisible(e.target.checked)}
      />

      {optionGroups.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-medium text-ink">옵션</span>
          {optionGroups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-2 rounded-md border border-line p-3"
            >
              <span className="text-sm font-medium text-ink">
                {group.name_ko}
                {group.type === "variant" && (
                  <span className="ml-2 text-xs font-normal text-ink-muted">
                    (선택 시 가격에 차액 반영)
                  </span>
                )}
              </span>
              {group.option_values.length === 0 ? (
                <p className="text-xs text-ink-faint">
                  등록된 값이 없습니다. 옵션 관리에서 값을 먼저 추가해주세요.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {group.option_values.map((value) => (
                    <label
                      key={value.id}
                      className="flex cursor-pointer items-center gap-1.5 text-[13px] text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions.has(value.id)}
                        onChange={() => toggleOption(value.id)}
                        className="h-4 w-4 rounded border-line text-brand accent-brand"
                      />
                      {value.value_ko}
                      {group.type === "variant" && value.price_delta !== 0 && (
                        <span className="text-xs text-ink-muted">
                          ({value.price_delta > 0 ? "+" : ""}
                          {value.price_delta.toLocaleString()}원)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="구성 (한글)"
          name="unitKo"
          placeholder="2,500매(1박스)"
          defaultValue={product?.unit_ko}
          required
        />
        <FormField
          label="구성 (영문)"
          name="unitEn"
          placeholder="2,500 sheets (box)"
          defaultValue={product?.unit_en ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-ink">상세설명 (한글)</label>
        <RichTextEditor
          value={product?.description_ko}
          onChange={setDescriptionKo}
          placeholder="상세설명을 입력해주세요"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-ink">상세설명 (영문)</label>
        <RichTextEditor
          value={product?.description_en}
          onChange={setDescriptionEn}
          placeholder="Enter a description"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-ink">판매 상태</label>
        <select
          name="status"
          defaultValue={product?.status ?? "active"}
          className="w-40 rounded-md border border-line px-4 py-3 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="active">판매중</option>
          <option value="soldout">품절</option>
        </select>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="w-fit">
        {isEdit ? "수정 저장" : "상품 등록"}
      </Button>
    </form>
  );
}
