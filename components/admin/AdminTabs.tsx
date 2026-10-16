"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutTemplate, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Pengguna", icon: Users, match: (p: string) => p === "/admin" || p.startsWith("/admin/users") },
  { href: "/admin/templates", label: "Template", icon: LayoutTemplate, match: (p: string) => p.startsWith("/admin/templates") },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-xl bg-muted p-1">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
            t.match(pathname) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <t.icon className="size-4" /> {t.label}
        </Link>
      ))}
    </div>
  );
}
