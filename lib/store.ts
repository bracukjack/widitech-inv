"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type { Invoice, InvoiceStatus, Settings } from "@/types/invoice";
import type { AppData } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/result";
import { normalizeInvoice, normalizeSettings } from "@/lib/normalize";
import { setTemplateRegistry, type TemplateConfig } from "@/lib/themes";
import {
  clearMyDataAction,
  deleteInvoiceAction,
  importDataAction,
  refreshAppDataAction,
  saveInvoiceAction,
  saveSettingsAction,
} from "@/lib/actions/data";

function unwrap<T>(res: ActionResult<T>): T {
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

function sortInvoices(list: Invoice[]): Invoice[] {
  return [...list].sort(
    (a, b) => b.invoiceDate.localeCompare(a.invoiceDate) || b.createdAt.localeCompare(a.createdAt)
  );
}

interface InvoiceStore {
  hydrated: boolean;
  user: SessionUser | null;
  invoices: Invoice[];
  settings: Settings;
  /** Every template, including inactive ones (needed to render older invoices). */
  templates: TemplateConfig[];

  init: (data: AppData) => void;
  refresh: () => Promise<void>;
  /** Persists to the server and resolves with the stored invoice. Throws with a readable message. */
  saveInvoice: (invoice: Invoice) => Promise<Invoice>;
  deleteInvoice: (id: string) => Invoice | undefined;
  restoreInvoice: (invoice: Invoice) => void;
  setStatus: (id: string, status: InvoiceStatus) => void;
  setTheme: (id: string, theme: string) => void;
  saveSettings: (settings: Settings) => Promise<boolean>;
  setTemplates: (templates: TemplateConfig[]) => void;
  exportData: () => string;
  importData: (payload: { invoices: unknown[]; settings?: unknown }) => Promise<{ invoices: number }>;
  clearAll: () => Promise<void>;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => {
  /** Applies a change immediately, saves in the background, rolls back if the server refuses. */
  const optimistic = (id: string, change: Partial<Invoice>) => {
    const before = get().invoices.find((i) => i.id === id);
    if (!before) return;
    const next = { ...before, ...change };
    set({ invoices: get().invoices.map((i) => (i.id === id ? next : i)) });
    saveInvoiceAction(next)
      .then(unwrap)
      .then((saved) => set({ invoices: get().invoices.map((i) => (i.id === id ? saved : i)) }))
      .catch((e: Error) => {
        set({ invoices: get().invoices.map((i) => (i.id === id ? before : i)) });
        toast.error(`Gagal menyimpan: ${e.message}`);
      });
  };

  return {
    hydrated: false,
    user: null,
    invoices: [],
    settings: normalizeSettings(null),
    templates: [],

    init: (data) => {
      setTemplateRegistry(data.templates);
      set({ ...data, invoices: sortInvoices(data.invoices), hydrated: true });
    },

    refresh: async () => {
      const res = await refreshAppDataAction();
      if (res.ok) get().init(res.data);
      else if (/sesi/i.test(res.error)) window.location.href = "/login";
    },

    saveInvoice: async (invoice) => {
      const saved = unwrap(await saveInvoiceAction(invoice));
      const exists = get().invoices.some((i) => i.id === saved.id);
      set({
        invoices: sortInvoices(exists ? get().invoices.map((i) => (i.id === saved.id ? saved : i)) : [...get().invoices, saved]),
      });
      return saved;
    },

    deleteInvoice: (id) => {
      const target = get().invoices.find((i) => i.id === id);
      set({ invoices: get().invoices.filter((i) => i.id !== id) });
      deleteInvoiceAction(id)
        .then(unwrap)
        .catch((e: Error) => {
          if (target) set({ invoices: sortInvoices([...get().invoices, target]) });
          toast.error(`Gagal menghapus: ${e.message}`);
        });
      return target;
    },

    restoreInvoice: (invoice) => {
      if (get().invoices.some((i) => i.id === invoice.id)) return;
      set({ invoices: sortInvoices([...get().invoices, invoice]) });
      saveInvoiceAction(invoice)
        .then(unwrap)
        .catch((e: Error) => toast.error(`Gagal memulihkan: ${e.message}`));
    },

    setStatus: (id, status) => optimistic(id, { status }),
    setTheme: (id, theme) => optimistic(id, { theme }),

    saveSettings: async (settings) => {
      try {
        const saved = unwrap(await saveSettingsAction(settings));
        set({ settings: saved });
        return true;
      } catch (e) {
        toast.error((e as Error).message);
        return false;
      }
    },

    setTemplates: (templates) => {
      setTemplateRegistry(templates);
      set({ templates });
    },

    exportData: () =>
      JSON.stringify(
        { app: "widitech-invoice", version: 3, exportedAt: new Date().toISOString(), invoices: get().invoices, settings: get().settings },
        null,
        2
      ),

    importData: async (payload) => {
      const result = unwrap(await importDataAction(payload));
      await get().refresh();
      return result;
    },

    clearAll: async () => {
      const settings = unwrap(await clearMyDataAction());
      set({ invoices: [], settings });
    },
  };
});

/** Templates users can pick (active ones, in admin-defined order). */
export function useActiveTemplates(): TemplateConfig[] {
  const templates = useInvoiceStore((s) => s.templates);
  return templates.filter((t) => t.isActive);
}

// --- unsaved "new invoice" draft: crash recovery on this device only, never the source of truth ---

const draftKey = () => `widitech-draft-${useInvoiceStore.getState().user?.id ?? "anon"}`;

export function loadNewDraft(): Invoice | null {
  try {
    const raw = localStorage.getItem(draftKey());
    return raw ? normalizeInvoice(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveNewDraft(invoice: Invoice): void {
  try {
    localStorage.setItem(draftKey(), JSON.stringify(invoice));
  } catch {
    /* best effort */
  }
}

export function clearNewDraft(): void {
  try {
    localStorage.removeItem(draftKey());
  } catch {
    /* ignore */
  }
}

export { isProfileComplete } from "@/lib/normalize";
