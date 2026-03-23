"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import GlobalSearch from "@/components/GlobalSearch";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import { Toaster } from "sonner";
import { useSearchStore } from "@/lib/searchStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useTimeStore } from "@/lib/timeStore";
import { useFinanceStore } from "@/lib/financeStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useCategoryStore } from "@/lib/categoryStore";
import { useActivityStore } from "@/lib/activityStore";
import { getInvoices } from "@/lib/invoiceStore";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const searchStore = useSearchStore();

  // Rehydrate all stores on mount
  useEffect(() => {
    useSettingsStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    useTimeStore.persist.rehydrate();
    useFinanceStore.persist.rehydrate();
    useNotificationStore.persist.rehydrate();
    useCategoryStore.persist.rehydrate();
    useActivityStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // Generate notifications on mount and when projects/invoices change
  const projects = useProjectStore((s) => s.projects);
  const generateNotifications = useNotificationStore((s) => s.generateNotifications);

  useEffect(() => {
    if (!hydrated) return;
    const invoices = getInvoices();
    generateNotifications(projects, invoices);
  }, [hydrated, projects, generateNotifications]);

  // Onboarding redirect
  const hasCompletedOnboarding = useSettingsStore((s) => s.settings.hasCompletedOnboarding);
  useEffect(() => {
    if (hydrated && !hasCompletedOnboarding && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [hydrated, hasCompletedOnboarding, pathname, router]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        // Only allow Escape and Cmd+K in inputs
        if (e.key === 'Escape') {
          searchStore.close();
          setShortcutsOpen(false);
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchStore.open();
          return;
        }
        return;
      }

      // Cmd+K - Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchStore.open();
        return;
      }

      // ? - Show shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        searchStore.close();
        setShortcutsOpen(false);
        return;
      }

      // Navigation shortcuts (Cmd+1-6)
      if (e.metaKey || e.ctrlKey) {
        const routes: Record<string, string> = {
          '1': '/',
          '2': '/projects',
          '3': '/clients',
          '4': '/finance',
          '5': '/invoices',
          '6': '/time-tracker',
        };
        if (routes[e.key]) {
          e.preventDefault();
          router.push(routes[e.key]);
          return;
        }

        // Cmd+Shift shortcuts
        if (e.shiftKey) {
          if (e.key === 'P' || e.key === 'p') {
            e.preventDefault();
            router.push('/projects');
            return;
          }
          if (e.key === 'C' || e.key === 'c') {
            e.preventDefault();
            router.push('/clients');
            return;
          }
          if (e.key === 'I' || e.key === 'i') {
            e.preventDefault();
            router.push('/invoice/new');
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, searchStore]);

  return (
    <>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <GlobalSearch />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}
