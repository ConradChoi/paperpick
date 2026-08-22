"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteOperatorButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`'${email}' 운영자 계정을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/operators/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      alert("삭제에 실패했습니다");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-error hover:underline disabled:opacity-50"
    >
      삭제
    </button>
  );
}
