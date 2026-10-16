import { requireAdminPage } from "@/lib/auth";
import { getSite, siteOrigin } from "@/lib/site";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Pengaturan situs — Admin" };

export default async function AdminSitePage() {
  await requireAdminPage();
  const site = await getSite();
  const origin = await siteOrigin(site.settings);
  return (
    <>
      <PageHeader title="Pengaturan situs" description="Nama website, logo, warna dan SEO." />
      <SiteSettingsForm initial={site.settings} assets={site.assets} origin={origin} />
    </>
  );
}
