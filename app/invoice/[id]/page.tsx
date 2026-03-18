"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import InvoicePreview from "@/components/InvoicePreview";
import PDFExport from "@/components/PDFExport";
import { Invoice } from "@/types/invoice";
import {
  getInvoiceById,
  saveInvoice,
  deleteInvoice,
  duplicateInvoice,
} from "@/lib/invoiceStore";
import {
  FileWarning,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const found = getInvoiceById(id);
    if (found) {
      setInvoice(found);
    } else {
      setNotFound(true);
    }
  }, [id]);

  const handleStatusChange = useCallback(
    (status: string) => {
      if (!invoice) return;
      const updated = {
        ...invoice,
        status: status as Invoice["status"],
        updatedAt: new Date().toISOString(),
      };
      saveInvoice(updated);
      setInvoice(updated);
    },
    [invoice]
  );

  const handleDuplicate = useCallback(() => {
    if (!invoice) return;
    const dup = duplicateInvoice(invoice);
    saveInvoice(dup);
    router.push(`/invoice/${dup.id}/edit`);
  }, [invoice, router]);

  const handleDelete = useCallback(() => {
    if (!invoice) return;
    deleteInvoice(invoice.id);
    router.push("/invoices");
  }, [invoice, router]);

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

  const statusColor =
    invoice.status === "Paid"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : invoice.status === "Sent"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.clientName}
              {invoice.clientCompany ? ` · ${invoice.clientCompany}` : ""}
            </p>
          </div>
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-auto border-0 p-0 h-auto shadow-none">
              <Badge className={`${statusColor} border-0 cursor-pointer`}>
                {invoice.status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/invoice/${invoice.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="size-4 mr-1.5" />
              Edit Invoice
            </Button>
          </Link>
          <PDFExport invoice={invoice} />
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="size-4 mr-1.5" />
            Duplicate
          </Button>
          {!confirmDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-white"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview (read-only) */}
      <InvoicePreview invoice={invoice} />
    </div>
  );
}
