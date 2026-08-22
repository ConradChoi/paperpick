import { requireAdminPage } from "@/lib/auth/require-admin-page";

// Reached only when an operator's group has zero readable menus — a
// deliberate dead end (not requireMenuAccess, which would redirect back
// here and loop) so they see an explanation instead of a blank redirect.
export default async function AdminNoAccessPage() {
  await requireAdminPage();

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <h1 className="text-xl font-bold text-ink">접근 권한이 없습니다</h1>
      <p className="text-sm text-ink-muted">
        배정된 메뉴 권한이 없습니다. 최고관리자에게 문의해주세요.
      </p>
    </div>
  );
}
