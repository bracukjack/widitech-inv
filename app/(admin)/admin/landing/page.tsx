import { requireAdminPage } from "@/lib/auth";
import { getSite } from "@/lib/site";
import LandingEditor from "@/components/admin/LandingEditor";

export const metadata = { title: "Landing page — Admin" };

export default async function AdminLandingPage() {
  await requireAdminPage();
  const { landing } = await getSite();
  return <LandingEditor initial={landing} />;
}
