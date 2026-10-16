"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, LayoutDashboard, LayoutTemplate, LogOut, PanelsTopLeft, ShieldCheck, Users } from "lucide-react";
import Brand from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import { useInvoiceStore } from "@/lib/store";
import { logoutAction } from "@/lib/actions/auth";
import type { AppData } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/landing", label: "Landing", icon: PanelsTopLeft },
  { href: "/admin/templates", label: "Template", icon: LayoutTemplate },
  { href: "/admin/site", label: "Situs", icon: Globe },
];

/** Separate dashboard chrome for the master admin. */
export default function AdminShell({
  initial,
  brand,
  children,
}: {
  initial: AppData;
  brand: { name: string; logo: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const current = NAV.find((n) => isActive(n.href, n.exact));

  // The template editor uses the same client store as the app (templates, profile for previews).
  useEffect(() => {
    useInvoiceStore.getState().init(initial);
  }, [initial]);

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Brand name={brand.name} logo={brand.logo} className="flex-1" />
        </div>
        <div className="px-5 pt-4 pb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <ShieldCheck className="size-3" /> MASTER ADMIN
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(n.href, n.exact) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <n.icon className="size-4.5" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link href="/invoices" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> Kembali ke aplikasi
          </Link>
          <a
            href="/?preview=1"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-4" /> Lihat landing page
          </a>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{initial.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{initial.user.email}</p>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" aria-label="Keluar" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-lg lg:hidden">
        <Link href="/invoices" aria-label="Kembali ke aplikasi" className="-ml-1 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{current?.label ?? "Admin"}</p>
          <p className="truncate text-[11px] text-muted-foreground">Master admin · {brand.name}</p>
        </div>
        <ThemeToggle />
        <form action={logoutAction}>
          <button type="submit" aria-label="Keluar" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:text-destructive">
            <LogOut className="size-4" />
          </button>
        </form>
      </header>

      <main className="w-full max-w-7xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">{children}</main>

      {/* ---------- mobile tab bar ---------- */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 pt-1.5 backdrop-blur-lg lg:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
              isActive(n.href, n.exact) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <n.icon className="size-5.5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
