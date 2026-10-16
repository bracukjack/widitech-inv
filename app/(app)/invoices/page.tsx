"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, FilePlus2, Search, Sparkles } from "lucide-react";
import type { Currency, DisplayStatus, Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader, StatusBadge, TemplateThumb } from "@/components/invoice-ui";
import { isProfileComplete, useActiveTemplates, useInvoiceStore } from "@/lib/store";
import { calculateTotals, displayStatus, formatCurrency, formatDate, STATUS_LABEL } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import LegacyImportBanner from "@/components/LegacyImport";

type Filter = "all" | DisplayStatus;
const FILTERS: Filter[] = ["all", "Draft", "Sent", "Overdue", "Paid"];

/** Sums amounts per currency and renders "Rp 1.000.000 + $200". */
function sumByCurrency(rows: { currency: Currency; amount: number }[]): string {
  const map = new Map<Currency, number>();
  rows.forEach((r) => map.set(r.currency, (map.get(r.currency) ?? 0) + r.amount));
  if (!map.size) return formatCurrency(0, "IDR");
  return [...map.entries()].map(([c, n]) => formatCurrency(n, c)).join(" + ");
}

export default function HomePage() {
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const invoices = useInvoiceStore((s) => s.invoices);
  const profile = useInvoiceStore((s) => s.settings.profile);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      invoices
        .map((inv) => ({ inv, status: displayStatus(inv), totals: calculateTotals(inv) }))
        .sort(
          (a, b) =>
            b.inv.invoiceDate.localeCompare(a.inv.invoiceDate) || b.inv.createdAt.localeCompare(a.inv.createdAt)
        ),
    [invoices]
  );

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const unpaid = rows.filter((r) => r.status === "Sent" || r.status === "Overdue");
    const overdue = rows.filter((r) => r.status === "Overdue");
    const paidThisMonth = rows.filter((r) => r.status === "Paid" && (r.inv.paidAt ?? r.inv.updatedAt).startsWith(month));
    const toRow = (r: (typeof rows)[number], field: "balance" | "total") => ({
      currency: r.inv.currency,
      amount: r.totals[field],
    });
    return [
      { label: "Belum dibayar", value: sumByCurrency(unpaid.map((r) => toRow(r, "balance"))), sub: `${unpaid.length} invoice`, tone: "text-blue-600 dark:text-blue-400" },
      { label: "Lewat jatuh tempo", value: sumByCurrency(overdue.map((r) => toRow(r, "balance"))), sub: `${overdue.length} invoice`, tone: "text-amber-600 dark:text-amber-400" },
      { label: "Lunas bulan ini", value: sumByCurrency(paidThisMonth.map((r) => toRow(r, "total"))), sub: `${paidThisMonth.length} invoice`, tone: "text-emerald-600 dark:text-emerald-400" },
    ];
  }, [rows]);

  if (!hydrated) return <PageLoader />;

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    ({ inv, status }) =>
      (filter === "all" || status === filter) &&
      (!q || [inv.invoiceNumber, inv.clientName, inv.clientCompany].some((s) => s.toLowerCase().includes(q)))
  );
  const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

  return (
    <div className="space-y-6 px-4 pt-5 sm:px-6 lg:pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length ? `${invoices.length} invoice tersimpan di perangkat ini` : "Buat invoice pertama Anda dalam 1 menit"}
          </p>
        </div>
        {invoices.length > 0 && (
          <Button asChild className="hidden sm:inline-flex md:hidden">
            <Link href="/invoice/new">
              <FilePlus2 className="size-4" /> Buat invoice
            </Link>
          </Button>
        )}
      </div>

      <LegacyImportBanner />

      {!isProfileComplete(profile) && (
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Lengkapi profil bisnis Anda</span>
            <span className="block text-xs text-muted-foreground">
              Nama, logo & rekening bank akan terisi otomatis di setiap invoice.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="scrollbar-hide -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className="w-[78%] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 shadow-xs sm:w-auto"
              >
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className={cn("mt-1 truncate text-xl font-bold tracking-tight tabular-nums", s.tone)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari klien atau nomor invoice…"
                className="pl-10"
              />
            </div>
            <div className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    filter === f ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                  )}
                >
                  {f === "all" ? "Semua" : STATUS_LABEL[f]}
                  <span className="ml-1.5 opacity-60">{f === "all" ? rows.length : counts[f] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Tidak ada invoice yang cocok.</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              {filtered.map(({ inv, status, totals }) => (
                <InvoiceRow key={inv.id} invoice={inv} status={status} total={totals.total} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function InvoiceRow({ invoice, status, total }: { invoice: Invoice; status: DisplayStatus; total: number }) {
  return (
    <li>
      <Link href={`/invoice/${invoice.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground uppercase">
          {(invoice.clientName || "?").trim().charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{invoice.clientName || "Tanpa nama"}</span>
          <span className="block truncate text-xs text-muted-foreground">
            #{invoice.invoiceNumber} · {formatDate(invoice.invoiceDate)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold tabular-nums">{formatCurrency(total, invoice.currency)}</span>
          <StatusBadge status={status} />
        </span>
      </Link>
    </li>
  );
}

function EmptyState() {
  const templates = useActiveTemplates();
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-xs sm:p-10">
      <div className="mx-auto mb-6 grid max-w-sm grid-cols-3 gap-3">
        {templates.slice(0, 3).map((t, i) => (
          <div key={t.id} className={cn("rounded-lg p-1 shadow-sm ring-1 ring-border", i === 1 && "-translate-y-2 scale-105")}>
            <TemplateThumb template={t} />
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold">Belum ada invoice</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Pilih dari {templates.length} template, isi klien & item, lalu download PDF atau kirim lewat WhatsApp.
      </p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/invoice/new">
          Buat invoice pertama <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
