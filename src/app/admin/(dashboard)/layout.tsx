import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { Sidebar, type NavItem } from "@/components/admin/sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdminPage();
  const access = await getAdminAccess(user.id);

  const navItems: NavItem[] = [];
  if (access.can("products", "read")) {
    navItems.push({ href: "/admin/products", label: "상품 관리" });
  }
  if (access.can("inquiries", "read")) {
    navItems.push({ href: "/admin/inquiries", label: "리드 관리" });
  }
  if (access.isSuperAdmin) {
    navItems.push(
      { href: "/admin/operators", label: "운영자 관리" },
      { href: "/admin/operator-groups", label: "운영자 그룹 관리" },
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar navItems={navItems} />
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
