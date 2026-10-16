import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { getSite } from "@/lib/site";
import { siteAssetUrl } from "@/lib/site-config";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Master-admin dashboard. Every page below also calls requireAdminPage() itself,
// because layouts aren't guaranteed to re-run on client-side navigation.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [data, site] = await Promise.all([getAppData(admin), getSite()]);
  return (
    <AdminShell initial={data} brand={{ name: site.settings.siteName, logo: siteAssetUrl("logo", site.assets) }}>
      {children}
    </AdminShell>
  );
}
