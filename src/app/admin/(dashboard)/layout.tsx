import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { Sidebar } from "@/components/admin/sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar />
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
