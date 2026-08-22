"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { OperatorGroup } from "@/types/database";

export function OperatorForm({ groups }: { groups: OperatorGroup[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        groupId: form.get("groupId") || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      setSubmitting(false);
      return;
    }

    router.push("/admin/operators");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
      <FormField
        label="이메일"
        name="email"
        type="email"
        placeholder="operator@example.com"
        required
      />
      <FormField
        label="초기 비밀번호"
        name="password"
        type="password"
        helperText="8자 이상. 운영자는 로그인 후 직접 비밀번호를 변경할 수 있습니다."
        required
      />
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-ink">운영자 그룹</label>
        <select
          name="groupId"
          defaultValue=""
          className="rounded-md border border-line px-4 py-3 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="">미지정 (모든 메뉴 접근 불가)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="w-fit">
        운영자 등록
      </Button>
    </form>
  );
}
