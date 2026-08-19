"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/options", label: "옵션 관리" },
  { href: "/admin/inquiries", label: "리드 관리" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface p-4">
      <div className="mb-4 px-2 text-lg font-bold text-ink">
        Paper Pick Admin
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-4 py-3 text-sm font-medium ${
              active ? "bg-brand-tint text-brand" : "text-ink-muted hover:bg-surface-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="mt-auto rounded-md px-4 py-3 text-left text-sm font-medium text-ink-muted hover:bg-surface-muted"
      >
        로그아웃
      </button>
    </aside>
  );
}
