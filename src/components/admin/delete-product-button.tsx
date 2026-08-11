"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
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
