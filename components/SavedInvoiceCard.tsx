"use client";

import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { calculateTotals } from "@/components/InvoicePreview";
import { format } from "date-fns";

interface SavedInvoiceCardProps {
  invoice: Invoice;
  onDelete: (id: string) => void;
}

export default function SavedInvoiceCard({
  invoice,
  onDelete,
}: SavedInvoiceCardProps) {
  const { total } = calculateTotals(invoice);

  const statusColor =
    invoice.status === "Paid"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : invoice.status === "Sent"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">
            {invoice.invoiceNumber}
          </p>
          <p className="text-sm text-muted-foreground">
            {invoice.clientName || "No client"}{" "}
            {invoice.clientCompany ? `· ${invoice.clientCompany}` : ""}
          </p>
        </div>
        <Badge className={`${statusColor} border-0`}>{invoice.status}</Badge>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(total, invoice.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {invoice.invoiceDate
              ? format(new Date(invoice.invoiceDate), "MMM dd, yyyy")
              : "-"}
          </p>
        </div>
        <div className="flex gap-1">
          <Link href={`/invoice/${invoice.id}`}>
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(invoice.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
