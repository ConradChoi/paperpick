"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import type { OptionGroup, OptionType, OptionValue } from "@/types/database";

type GroupWithValues = OptionGroup & { option_values: OptionValue[] };

export function OptionsManager({ groups }: { groups: GroupWithValues[] }) {
  const router = useRouter();
  const [addingGroup, setAddingGroup] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <OptionGroupCard key={group.id} group={group} onChanged={() => router.refresh()} />
      ))}

      {addingGroup ? (
        <NewGroupForm
          onDone={() => {
            setAddingGroup(false);
            router.refresh();
          }}
          onCancel={() => setAddingGroup(false)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          onClick={() => setAddingGroup(true)}
        >
          + 옵션 그룹 추가
        </Button>
      )}
    </div>
  );
}

function OptionGroupCard({
  group,
  onChanged,
}: {
  group: GroupWithValues;
  onChanged: () => void;
}) {
  const [addingValue, setAddingValue] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteGroup() {
    if (!confirm(`'${group.name_ko}' 옵션 그룹을 삭제하시겠습니까? 소속된 값도 모두 삭제되고, 이 옵션을 사용 중인 상품에서도 제거됩니다.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/options/${group.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onChanged();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{group.name_ko}</span>
          {group.name_en && (
            <span className="text-xs text-ink-muted">({group.name_en})</span>
          )}
          <Badge style={group.type === "variant" ? "info" : "neutral"}>
            {group.type === "variant" ? "구매 옵션 (가격 반영)" : "노출용 (배지 표시)"}
          </Badge>
        </div>
        <button
          type="button"
          onClick={handleDeleteGroup}
          disabled={deleting}
          className="text-xs text-error hover:underline disabled:opacity-50"
        >
          그룹 삭제
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {group.option_values.length === 0 && (
          <p className="text-xs text-ink-faint">등록된 값이 없습니다.</p>
        )}
        {group.option_values.map((value) => (
          <OptionValueRow
            key={value.id}
            value={value}
            groupType={group.type}
            onChanged={onChanged}
          />
        ))}
      </div>

      {addingValue ? (
        <NewValueForm
          groupId={group.id}
          groupType={group.type}
          onDone={() => {
            setAddingValue(false);
            onChanged();
          }}
          onCancel={() => setAddingValue(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingValue(true)}
          className="w-fit text-[13px] font-medium text-brand hover:underline"
        >
          + 값 추가
        </button>
      )}
    </div>
  );
}

function OptionValueRow({
  value,
  groupType,
  onChanged,
}: {
  value: OptionValue;
  groupType: OptionType;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`'${value.value_ko}' 값을 삭제하시겠습니까?`)) return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/option-values/${value.id}`, { method: "DELETE" });
    setSubmitting(false);
    if (res.ok) onChanged();
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/option-values/${value.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valueKo: form.get("valueKo"),
        valueEn: form.get("valueEn") ?? "",
        priceDelta:
          groupType === "variant" ? Number(form.get("priceDelta") || 0) : 0,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      return;
    }
    setEditing(false);
    onChanged();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-wrap items-end gap-2 rounded-md bg-surface-muted p-3"
      >
        <FormField
          label="값 (한글)"
          name="valueKo"
          defaultValue={value.value_ko}
          required
          className="w-40"
        />
        <FormField
          label="값 (영문)"
          name="valueEn"
          defaultValue={value.value_en ?? ""}
          className="w-40"
        />
        {groupType === "variant" && (
          <FormField
            label="가격 차액 (원)"
            name="priceDelta"
            type="number"
            defaultValue={value.price_delta}
            className="w-32"
          />
        )}
        {error && <p className="w-full text-xs text-error">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            취소
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-ink">{value.value_ko}</span>
        {value.value_en && (
          <span className="text-xs text-ink-muted">({value.value_en})</span>
        )}
        {groupType === "variant" && (
          <span className="text-xs font-medium text-brand">
            {value.price_delta > 0 && "+"}
            {value.price_delta !== 0 ? `₩${value.price_delta.toLocaleString()}` : "+0원"}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-ink-muted hover:text-ink"
        >
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="text-xs text-error hover:underline disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function NewGroupForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameKo: form.get("nameKo"),
        nameEn: form.get("nameEn") ?? "",
        type: form.get("type"),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-line p-4"
    >
      <FormField label="그룹명 (한글)" name="nameKo" required className="w-40" />
      <FormField label="그룹명 (영문)" name="nameEn" className="w-40" />
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-ink">유형</label>
        <select
          name="type"
          defaultValue="display"
          className="rounded-md border border-line px-4 py-3 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="display">노출용 (배지 표시)</option>
          <option value="variant">구매 옵션 (가격 반영)</option>
        </select>
      </div>
      {error && <p className="w-full text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          추가
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}

function NewValueForm({
  groupId,
  groupType,
  onDone,
  onCancel,
}: {
  groupId: string;
  groupType: OptionType;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/option-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionGroupId: groupId,
        valueKo: form.get("valueKo"),
        valueEn: form.get("valueEn") ?? "",
        priceDelta:
          groupType === "variant" ? Number(form.get("priceDelta") || 0) : 0,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-md bg-surface-muted p-3"
    >
      <FormField label="값 (한글)" name="valueKo" required className="w-40" />
      <FormField label="값 (영문)" name="valueEn" className="w-40" />
      {groupType === "variant" && (
        <FormField
          label="가격 차액 (원)"
          name="priceDelta"
          type="number"
          defaultValue={0}
          className="w-32"
        />
      )}
      {error && <p className="w-full text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          추가
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
