"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TopBar({ newInquiryCount }: { newInquiryCount: number | null }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-line bg-surface px-6">
      {newInquiryCount !== null && (
        <Link
          href="/admin/inquiries"
          className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-muted"
        >
          <span aria-hidden="true">🔔</span>
          <span>새 문의</span>
          {newInquiryCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-semibold text-white">
              {newInquiryCount > 99 ? "99+" : newInquiryCount}
            </span>
          )}
        </Link>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-muted"
      >
        로그아웃
      </button>
    </header>
  );
}
