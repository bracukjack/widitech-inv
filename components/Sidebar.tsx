"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Settings,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebarStore";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice/new", label: "New Invoice", icon: FilePlus },
  { href: "/invoices", label: "My Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-md hover:bg-muted"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="font-bold text-primary text-lg">InvoiceGen</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-all duration-250 ease-in-out lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-60",
          "w-60",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn("border-b border-sidebar-border flex items-center", collapsed ? "lg:justify-center lg:px-2 lg:py-4" : "p-5")}>
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FileText className="size-4 text-primary-foreground" />
            </div>
            <span className={cn("font-bold text-sidebar-foreground text-lg transition-opacity duration-250", collapsed ? "lg:hidden" : "")}>
              InvoiceGen
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 space-y-1", collapsed ? "lg:px-1.5 lg:py-3 px-3 py-3" : "p-3")}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors relative group",
                  collapsed ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className={cn("transition-opacity duration-250", collapsed ? "lg:hidden" : "")}>
                  {item.label}
                </span>
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-sidebar-border flex items-center", collapsed ? "lg:flex-col lg:gap-2 lg:py-3 lg:px-1.5 p-3 justify-between" : "p-3 justify-between")}>
          <span className={cn("text-xs text-muted-foreground", collapsed ? "lg:hidden" : "")}>Theme</span>
          <ThemeToggle />
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center border-t border-sidebar-border py-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </aside>
    </>
  );
}
