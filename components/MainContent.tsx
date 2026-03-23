"use client";

import { useSidebarStore } from "@/lib/sidebarStore";
import { cn } from "@/lib/utils";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  return (
    <main className={cn("min-h-screen pt-14 lg:pt-0 transition-all duration-250 ease-in-out", collapsed ? "lg:ml-[64px]" : "lg:ml-[240px]")}>
      {children}
    </main>
  );
}
