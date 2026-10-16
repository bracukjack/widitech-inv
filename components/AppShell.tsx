"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LogOut, Plus, Settings, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/lib/store";
import { logoutAction } from "@/lib/actions/auth";
import type { AppData } from "@/lib/data";
import { cn } from "@/lib/utils";

const REFRESH_AFTER_MS = 30_000;

export default function AppShell({ initial, children }: { initial: AppData; children: React.ReactNode }) {
  const pathname = usePathname();
  const user = initial.user;

  // Load server data into the client store. Done in an effect (browser only) so a
  // server render never puts one user's data into the shared module-level store.
  useEffect(() => {
    useInvoiceStore.getState().init(initial);
  }, [initial]);

  // Pick up changes made on another device or tab when the user comes back.
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < REFRESH_AFTER_MS) return;
      last = Date.now();
      void useInvoiceStore.getState().refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const nav = [
    { href: "/", label: "Invoice" },
    { href: "/settings", label: "Pengaturan" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  // Invoice screens bring their own bottom action bar on mobile.
  const showBottomNav = !pathname.startsWith("/invoice/");
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link href="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              W
            </span>
            <span className="text-[15px]">Widitech Invoice</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(n.href) ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/invoice/new">
                <Plus className="size-4" /> Buat invoice
              </Link>
            </Button>
            <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-6xl", showBottomNav && "pb-24 md:pb-0")}>{children}</main>

      {showBottomNav && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 px-6 pt-2 backdrop-blur-lg md:hidden">
          <div className="mx-auto flex max-w-sm items-end justify-between">
            <BottomLink href="/" label="Invoice" icon={FileText} active={isActive("/")} />
            <Link
              href="/invoice/new"
              aria-label="Buat invoice"
              className="-mt-7 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
            >
              <Plus className="size-7" />
            </Link>
            <BottomLink href="/settings" label="Pengaturan" icon={Settings} active={isActive("/settings")} />
          </div>
        </nav>
      )}
    </>
  );
}

function UserMenu({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = (name || email).trim().slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold ring-offset-background transition hover:ring-2 hover:ring-border"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{name || "Tanpa nama"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <MenuLink href="/settings" icon={Settings} onClick={() => setOpen(false)}>
            Pengaturan
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" icon={ShieldCheck} onClick={() => setOpen(false)}>
              Panel admin
            </MenuLink>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" /> Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: typeof Settings;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </Link>
  );
}

function BottomLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof FileText;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-20 flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5.5" />
      {label}
    </Link>
  );
}
