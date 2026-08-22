"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

export function Sidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface p-4">
      <div className="mb-4 px-2 text-lg font-bold text-ink">
        Paper Pick Admin
      </div>
      {navItems.map((item) => {
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
    </aside>
  );
}
