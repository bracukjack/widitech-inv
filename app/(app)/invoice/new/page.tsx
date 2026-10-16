"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { Invoice } from "@/types/invoice";
import InvoiceEditor from "@/components/InvoiceEditor";
import { PageLoader } from "@/components/invoice-ui";
import { clearNewDraft, loadNewDraft, useInvoiceStore } from "@/lib/store";
import { createInvoice, duplicateInvoice } from "@/lib/invoice";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NewInvoice />
    </Suspense>
  );
}

function NewInvoice() {
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const duplicateId = useSearchParams().get("duplicate");
  if (!hydrated) return <PageLoader />;
  return <NewInvoiceEditor key={duplicateId ?? "new"} duplicateId={duplicateId} />;
}

function startingPoint(duplicateId: string | null): { invoice: Invoice; resumedDraft: boolean } {
  const { invoices, settings } = useInvoiceStore.getState();
  const source = duplicateId ? invoices.find((i) => i.id === duplicateId) : undefined;
  if (source) return { invoice: duplicateInvoice(source, settings, invoices), resumedDraft: false };

  const draft = loadNewDraft();
  if (draft && !invoices.some((i) => i.id === draft.id)) return { invoice: draft, resumedDraft: true };

  return { invoice: createInvoice(settings, invoices), resumedDraft: false };
}

function NewInvoiceEditor({ duplicateId }: { duplicateId: string | null }) {
  const router = useRouter();
  const saveInvoice = useInvoiceStore((s) => s.saveInvoice);
  const [start, setStart] = useState(() => startingPoint(duplicateId));

  useEffect(() => {
    if (!start.resumedDraft) return;
    toast("Melanjutkan draft yang belum disimpan", {
      id: "draft-resumed",
      action: {
        label: "Mulai baru",
        onClick: () => {
          clearNewDraft();
          const { invoices, settings } = useInvoiceStore.getState();
          setStart({ invoice: createInvoice(settings, invoices), resumedDraft: false });
        },
      },
    });
  }, [start.resumedDraft]);

  return (
    <InvoiceEditor
      key={start.invoice.id}
      initial={start.invoice}
      title={duplicateId ? "Duplikat invoice" : "Invoice baru"}
      keepDraft={!duplicateId}
      onCancel={() => {
        clearNewDraft();
        router.push(duplicateId ? `/invoice/${duplicateId}` : "/");
      }}
      onSave={async (inv) => {
        const saved = await saveInvoice(inv);
        clearNewDraft();
        toast.success("Invoice tersimpan");
        router.replace(`/invoice/${saved.id}`);
      }}
    />
  );
}
