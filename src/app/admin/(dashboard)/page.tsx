import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getAdminAccess } from "@/lib/auth/admin-access";

export default async function AdminIndexPage() {
  const { user } = await requireAdminPage();
  const access = await getAdminAccess(user.id);

  if (access.can("products", "read")) redirect("/admin/products");
  if (access.can("inquiries", "read")) redirect("/admin/inquiries");
  redirect("/admin/no-access");
}
