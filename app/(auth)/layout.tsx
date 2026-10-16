import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";
import { getSite } from "@/lib/site";
import { siteAssetUrl } from "@/lib/site-config";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { settings, assets } = await getSite();
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-6">
        <Brand name={settings.siteName} logo={siteAssetUrl("logo", assets)} size="lg" />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">{children}</div>
      <p className="mt-6 text-center text-xs text-muted-foreground">100% gratis · Invoice tanpa batas · Tanpa kartu kredit</p>
    </div>
  );
}
