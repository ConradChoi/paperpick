"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OperatorGroup } from "@/types/database";

export function OperatorApproval({
  userId,
  groups,
}: {
  userId: string;
  groups: OperatorGroup[];
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSubmitting(true);
    const res = await fetch(`/api/admin/operators/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error?.message ?? "처리 중 문제가 발생했습니다");
      return;
    }
    router.refresh();
  }

  async function handleApprove() {
    if (!groupId) {
      alert("승인하려면 그룹을 먼저 선택해주세요");
      return;
    }
    await patch({ status: "approved", groupId });
  }

  async function handleReject() {
    if (!confirm("이 가입 요청을 거절하시겠습니까?")) return;
    await patch({ status: "rejected" });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        disabled={submitting}
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand disabled:opacity-50"
      >
        <option value="">그룹 선택</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleApprove}
        disabled={submitting}
        className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
      >
        승인
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={submitting}
        className="text-xs font-medium text-error hover:underline disabled:opacity-50"
      >
        거절
      </button>
    </div>
  );
}
