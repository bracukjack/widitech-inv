import { listUsers } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";
import AdminUsers from "@/components/admin/AdminUsers";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Pengguna — Admin" };

export default async function AdminUsersPage() {
  const me = await requireAdminPage();
  const users = await listUsers();
  return (
    <>
      <PageHeader title="Pengguna" description={`${users.length} akun terdaftar. Reset password atau nonaktifkan akun dari sini.`} />
      <AdminUsers users={users} currentUserId={me.id} />
    </>
  );
}
