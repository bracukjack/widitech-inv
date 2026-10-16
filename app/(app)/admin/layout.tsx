import { requireAdminPage } from "@/lib/auth";
import AdminTabs from "@/components/admin/AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <div className="space-y-5 px-4 pt-5 pb-10 sm:px-6 lg:pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel admin</h1>
        <p className="text-sm text-muted-foreground">Kelola pengguna dan template invoice.</p>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
