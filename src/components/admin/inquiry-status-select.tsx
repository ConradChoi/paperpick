"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InquiryStatus } from "@/types/database";

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "신규",
  in_progress: "처리중",
  done: "완료",
};

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(newStatus: string) {
    setUpdating(true);
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);
    if (!res.ok) {
      alert("상태 변경에 실패했습니다");
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand disabled:opacity-50"
    >
      {Object.entries(STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
