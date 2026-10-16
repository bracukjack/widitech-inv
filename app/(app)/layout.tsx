import AppShell from "@/components/AppShell";
import { requireUserPage } from "@/lib/auth";
import { getAppData } from "@/lib/data";

// Everything in this group needs a signed-in user; data is loaded once here and kept in the client store.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const data = await getAppData(user);
  return <AppShell initial={data}>{children}</AppShell>;
}
