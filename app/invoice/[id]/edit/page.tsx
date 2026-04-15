"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import LivePreviewPanel from "@/components/LivePreviewPanel";
import PDFExport from "@/components/PDFExport";
import { Invoice } from "@/types/invoice";
import { getInvoiceById, saveInvoice } from "@/lib/invoiceStore";
import { useInvoiceDraftStore } from "@/lib/invoiceDraftStore";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [notFound, setNotFound] = useState(false);
  const savedRef = useRef(false);
  const resetDraft = useInvoiceDraftStore((s) => s.resetDraft);
  const draft = useInvoiceDraftStore((s) => s.draft);

  useEffect(() => {
    const found = getInvoiceById(id);
    if (found) {
      setInvoice(found);
    } else {
      setNotFound(true);
    }
  }, [id]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!savedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => resetDraft();
  }, [resetDraft]);

  const handleSave = useCallback(
    (data: Invoice) => {
      savedRef.current = true;
      saveInvoice(data);
      router.push(`/invoice/${id}`);
    },
    [router, id]
  );

  const handleCancel = useCallback(() => {
    router.push(`/invoice/${id}`);
  }, [router, id]);

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileWarning className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Invoice not found
        </h2>
        <p className="text-muted-foreground">
          The invoice you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/invoices">
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="p-6 lg:p-8 w-full mx-auto">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Invoices", href: "/invoices" },
        { label: `Invoice ${invoice.invoiceNumber}`, href: `/invoice/${id}` },
        { label: "Edit" },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {invoice.invoiceNumber}
          </p>
        </div>
        {draft && <PDFExport invoice={draft} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="bg-card border border-border rounded-xl p-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <InvoiceForm
            invoice={invoice}
            onSave={handleSave}
            saveLabel="Save Changes"
            onCancel={handleCancel}
          />
        </div>
        <LivePreviewPanel />
      </div>
    </div>
  );
}
