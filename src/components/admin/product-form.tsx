"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import type { Product } from "@/types/database";

const SIZES = ["A4", "A3", "B4", "B5"];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      brandKo: form.get("brandKo"),
      brandEn: form.get("brandEn") || undefined,
      nameKo: form.get("nameKo"),
      nameEn: form.get("nameEn") || undefined,
      size: form.get("size"),
      weightGsm: Number(form.get("weightGsm")),
      unitKo: form.get("unitKo"),
      unitEn: form.get("unitEn") || undefined,
      price: Number(form.get("price")),
      descriptionKo: form.get("descriptionKo") || undefined,
      descriptionEn: form.get("descriptionEn") || undefined,
      status: form.get("status"),
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

      <TextAreaField
        label="상세설명 (한글)"
        name="descriptionKo"
        defaultValue={product?.description_ko ?? ""}
      />
      <TextAreaField
        label="상세설명 (영문)"
        name="descriptionEn"
        defaultValue={product?.description_en ?? ""}
      />

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
