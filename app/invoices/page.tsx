"use client";

import { useEffect, useState } from "react";
import {
  getInvoices,
  softDeleteInvoice,
  restoreInvoice,
  ensureSampleData,
} from "@/lib/invoiceStore";
import { Invoice } from "@/types/invoice";
import SavedInvoiceCard from "@/components/SavedInvoiceCard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { FileText, FilePlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showDeleted } from "@/lib/toasts";
import InvoiceListSkeleton from "@/components/skeletons/InvoiceListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const router = useRouter();

  useEffect(() => {
    ensureSampleData();
    setInvoices(getInvoices());
    setMounted(true);
  }, []);

  const handleDelete = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    softDeleteInvoice(id);
    setInvoices(getInvoices());
    showDeleted("Invoice", () => {
      restoreInvoice(id);
      setInvoices(getInvoices());
    });
    setDeleteTarget(null);
  };

  if (!mounted) return <InvoiceListSkeleton />;

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      search === "" ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientCompany.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">My Invoices</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/invoice/new">
          <Button>
            <FilePlus className="size-4 mr-1.5" />
            New Invoice
          </Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start billing clients"
          action={{ label: "Create Invoice", onClick: () => router.push("/invoice/new") }}
        />
      ) : (<>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["all", "Draft", "Sent", "Paid"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Invoice Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No invoices found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <SavedInvoiceCard
              key={inv.id}
              invoice={inv}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      </>)}
    </div>
  );
}
