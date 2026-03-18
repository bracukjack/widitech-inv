"use client";

import { useEffect, useState } from "react";
import { getInvoices, ensureSampleData } from "@/lib/invoiceStore";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import { calculateTotals } from "@/components/InvoicePreview";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  FilePlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ensureSampleData();
    setInvoices(getInvoices());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const pendingInvoices = invoices.filter((i) => i.status === "Sent");

  const totalBilled = invoices.reduce((sum, inv) => {
    const { total } = calculateTotals(inv);
    if (inv.currency === "IDR") return sum + total / 15500;
    if (inv.currency === "EUR") return sum + total * 1.1;
    return sum + total;
  }, 0);

  const recentInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your invoicing activity
          </p>
        </div>
        <Link href="/invoice/new">
          <Button>
            <FilePlus className="size-4 mr-1.5" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalInvoices}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Total Billed (USD)
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${totalBilled.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Pending
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {pendingInvoices.length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Paid
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {paidInvoices.length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Invoices</h2>
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No invoices yet. Create your first one!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentInvoices.map((inv) => {
              const { total } = calculateTotals(inv);
              return (
                <Link
                  key={inv.id}
                  href={`/invoice/${inv.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inv.clientName || "No client"}
                        {inv.clientCompany ? ` · ${inv.clientCompany}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(total, inv.currency)}
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        inv.status === "Paid"
                          ? "text-green-600"
                          : inv.status === "Sent"
                            ? "text-blue-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
