"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import LivePreviewPanel from "@/components/LivePreviewPanel";
import PDFExport from "@/components/PDFExport";
import { Invoice } from "@/types/invoice";
import {
  createEmptyInvoice,
  saveInvoice,
  getProfile,
} from "@/lib/invoiceStore";
import { useInvoiceDraftStore } from "@/lib/invoiceDraftStore";

export default function NewInvoicePage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const draft = useInvoiceDraftStore((s) => s.draft);
  const resetDraft = useInvoiceDraftStore((s) => s.resetDraft);

  useEffect(() => {
    const profile = getProfile();
    setInvoice(createEmptyInvoice(profile));
  }, []);

  useEffect(() => {
    return () => resetDraft();
  }, [resetDraft]);

  const handleSave = useCallback(
    (data: Invoice) => {
      saveInvoice(data);
      router.push("/invoices");
    },
    [router]
  );

  if (!invoice) return null;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details and preview your invoice in real-time
          </p>
        </div>
        {draft && <PDFExport invoice={draft} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="bg-card border border-border rounded-xl p-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <InvoiceForm
            invoice={invoice}
            onSave={handleSave}
            saveLabel="Save Draft"
          />
        </div>
        <LivePreviewPanel />
      </div>
    </div>
  );
}
