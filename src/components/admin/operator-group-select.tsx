"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OperatorGroup } from "@/types/database";

export function OperatorGroupSelect({
  userId,
  groupId,
  groups,
}: {
  userId: string;
  groupId: string | null;
  groups: OperatorGroup[];
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(value: string) {
    setUpdating(true);
    const res = await fetch(`/api/admin/operators/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: value || null }),
    });
    setUpdating(false);
    if (!res.ok) {
      alert("그룹 변경에 실패했습니다");
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={groupId ?? ""}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand disabled:opacity-50"
    >
      <option value="">미지정</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
