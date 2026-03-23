"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  FilePlus,
  Trash2,
  Bell,
  Tags,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationPanel from "@/components/NotificationPanel";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebarStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useTimeStore } from "@/lib/timeStore";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useFinanceStore } from "@/lib/financeStore";
import { getDeletedInvoices } from "@/lib/invoiceStore";
import { useSearchStore } from "@/lib/searchStore";

const navSections = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "WORK",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/time-tracker", label: "Time Track", icon: Clock },
    ],
  },
  {
    label: "MONEY",
    items: [
      { href: "/finance", label: "Finance", icon: DollarSign },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/invoice/new", label: "New Invoice", icon: FilePlus },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { href: "/settings/categories", label: "Categories", icon: Tags },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/trash", label: "Trash", icon: Trash2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const [notifOpen, setNotifOpen] = useState(false);

  // Notification bell
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  // Running timer
  const activeTimer = useTimeStore((s) => s.activeTimer);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!activeTimer) {
      setElapsed("");
      return;
    }
    const tick = () => {
      const diff = Date.now() - new Date(activeTimer.startTime).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTimer]);

  // Trash count — select raw arrays to avoid new-array-per-render infinite loop
  const deletedProjectCount = useProjectStore((s) => s.projects.filter((p) => p.isDeleted).length);
  const deletedClientCount = useClientStore((s) => s.clients.filter((c) => c.isDeleted).length);
  const deletedTimeLogCount = useTimeStore((s) => s.timeLogs.filter((t) => t.isDeleted).length);
  const deletedExpenseCount = useFinanceStore((s) => s.expenses.filter((e) => e.isDeleted).length);
  const deletedIncomeCount = useFinanceStore((s) => s.manualIncomes.filter((i) => i.isDeleted).length);
  const [deletedInvoiceCount, setDeletedInvoiceCount] = useState(0);

  useEffect(() => {
    setDeletedInvoiceCount(getDeletedInvoices().length);
  }, []);

  const totalDeletedCount =
    deletedProjectCount +
    deletedClientCount +
    deletedTimeLogCount +
    deletedExpenseCount +
    deletedIncomeCount +
    deletedInvoiceCount;

  // Search
  const openSearch = useSearchStore((s) => s.open);

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
          <span className="font-bold text-primary text-lg tracking-tight">Freelance OS</span>
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
          collapsed ? "lg:w-[64px]" : "lg:w-[240px]",
          "w-[240px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn("border-b border-sidebar-border flex items-center justify-between", collapsed ? "lg:justify-center lg:px-2 lg:py-4" : "py-[20px] px-[18px]")}>
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FolderKanban className="size-4 text-primary-foreground" />
            </div>
            <span className={cn("font-semibold text-sidebar-foreground text-[15px] tracking-tight transition-opacity duration-250", collapsed ? "lg:hidden" : "")}>
              Freelance OS
            </span>
          </Link>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={cn("relative p-1.5 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors", collapsed ? "lg:hidden" : "")}
            title="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "lg:px-1.5 lg:py-3 px-3 py-3" : "p-3")}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-5" : ""}>
              {section.label && !collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {section.label}
                </div>
              )}
              {section.label && collapsed && (
                <div className="hidden lg:block border-t border-sidebar-border my-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  const isTimeTrack = item.href === "/time-tracker";
                  const isTrash = item.href === "/trash";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-[9px] rounded-lg text-[13.5px] font-medium transition-colors relative group h-[34px]",
                        collapsed ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2" : "px-3 py-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <span className="relative">
                        <item.icon className="w-[15px] h-[15px] shrink-0" />
                        {isTimeTrack && activeTimer && (
                          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </span>
                      <span className={cn("flex-1 flex items-center gap-2 transition-opacity duration-250", collapsed ? "lg:hidden" : "")}>
                        {item.label}
                        {isTimeTrack && activeTimer && elapsed && (
                          <span className="font-mono text-xs text-muted-foreground">{elapsed}</span>
                        )}
                        {isTrash && totalDeletedCount > 0 && (
                          <span className="ml-auto text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                            {totalDeletedCount}
                          </span>
                        )}
                      </span>
                      {collapsed && (
                        <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-sidebar-border", collapsed ? "lg:py-3 lg:px-1.5 p-3" : "p-3")}>
          <div className={cn("flex items-center", collapsed ? "lg:flex-col lg:gap-2 justify-between" : "justify-between")}>
            <span className={cn("text-xs text-muted-foreground", collapsed ? "lg:hidden" : "")}>Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={openSearch}
            className={cn("mt-2 w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors", collapsed ? "lg:hidden" : "")}
          >
            <span>⌘K</span>
            <span>Search</span>
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center border-t border-sidebar-border py-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </aside>

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
