"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DuplicateProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      setDuplicating(false);
      alert("복사에 실패했습니다");
      return;
    }
    const { data } = await res.json();
    router.push(`/admin/products/${data.id}/edit`);
    router.refresh();
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={duplicating}
      className="text-ink-muted hover:text-ink disabled:opacity-50"
    >
      복사
    </button>
  );
}
