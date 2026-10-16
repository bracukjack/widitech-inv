import { listUsers } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";
import AdminUsers from "@/components/admin/AdminUsers";

export const metadata = { title: "Pengguna — Admin" };

export default async function AdminUsersPage() {
  // Checked here too: layouts aren't guaranteed to re-run on client-side navigation.
  const me = await requireAdminPage();
  const users = await listUsers();
  return <AdminUsers users={users} currentUserId={me.id} />;
}
