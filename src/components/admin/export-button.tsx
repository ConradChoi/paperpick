"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export function ExportButton() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleExport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDownloading(true);

    const res = await fetch("/api/admin/inquiries/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        status: searchParams.get("status") || undefined,
        type: searchParams.get("type") || undefined,
        search: searchParams.get("search") || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "다운로드에 실패했습니다");
      setDownloading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiries-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    if (res.headers.get("X-Export-Truncated") === "true") {
      alert("데이터가 많아 상위 5,000건만 내보내졌습니다. 필터를 좁혀서 다시 시도해주세요.");
    }

    setDownloading(false);
    setOpen(false);
    setPassword("");
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        ⬇ CSV 다운로드
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleExport}
            className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-surface p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-ink">파일 비밀번호 설정</h2>
            <p className="text-[13px] text-ink-muted">
              다운로드된 파일은 여기서 입력한 비밀번호로 보호됩니다. 파일을 열 때
              같은 비밀번호를 입력해야 합니다.
            </p>
            <FormField
              label="비밀번호 (6자 이상)"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={downloading}
              >
                취소
              </Button>
              <Button type="submit" disabled={downloading}>
                {downloading ? "생성 중..." : "다운로드"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
