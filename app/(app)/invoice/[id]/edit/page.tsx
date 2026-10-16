"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import InvoiceEditor from "@/components/InvoiceEditor";
import { NotFound, PageLoader } from "@/components/invoice-ui";
import { useInvoiceStore } from "@/lib/store";

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === id));
  const saveInvoice = useInvoiceStore((s) => s.saveInvoice);

  if (!hydrated) return <PageLoader />;
  if (!invoice) return <NotFound />;

  return (
    <InvoiceEditor
      key={invoice.id}
      initial={invoice}
      title="Edit invoice"
      onCancel={() => router.push(`/invoice/${id}`)}
      onSave={async (inv) => {
        await saveInvoice(inv);
        toast.success("Perubahan tersimpan");
        router.push(`/invoice/${id}`);
      }}
    />
  );
}
