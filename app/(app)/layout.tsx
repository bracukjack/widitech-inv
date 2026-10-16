import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { requireUserPage } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { getSite } from "@/lib/site";
import { siteAssetUrl } from "@/lib/site-config";

// Private pages — keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Everything in this group needs a signed-in user; data is loaded once here and kept in the client store.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const [data, site] = await Promise.all([getAppData(user), getSite()]);
  return (
    <AppShell initial={data} brand={{ name: site.settings.siteName, logo: siteAssetUrl("logo", site.assets) }}>
      {children}
    </AppShell>
  );
}
