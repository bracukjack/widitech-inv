import { create } from "zustand";
import { Invoice } from "@/types/invoice";

interface InvoiceDraftState {
  draft: Invoice | null;
  setDraft: (invoice: Invoice) => void;
  updateDraft: (partial: Partial<Invoice>) => void;
  resetDraft: () => void;
}

export const useInvoiceDraftStore = create<InvoiceDraftState>((set) => ({
  draft: null,
  setDraft: (invoice) => set({ draft: invoice }),
  updateDraft: (partial) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...partial } : null,
    })),
  resetDraft: () => set({ draft: null }),
}));
