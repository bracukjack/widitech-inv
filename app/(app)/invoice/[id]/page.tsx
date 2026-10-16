"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, Loader2, Mail, MessageCircle, Pencil, Share2, Trash2, ClipboardCopy } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/form";
import { NotFound, PageLoader, ScaledPreview, StatusBadge, TemplatePicker } from "@/components/invoice-ui";
import { useInvoiceStore } from "@/lib/store";
import { calculateTotals, displayStatus, formatCurrency, formatDate, invoiceShareText } from "@/lib/invoice";
import { canShareFiles, downloadPdf, makePdfFile, shareFile } from "@/lib/pdfGenerator";

function whatsappUrl(invoice: Invoice, text: string) {
  let phone = invoice.clientPhone.replace(/\D/g, "");
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function mailtoUrl(invoice: Invoice, text: string) {
  const subject = `Invoice ${invoice.invoiceNumber}`;
  return `mailto:${encodeURIComponent(invoice.clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === id));
  const logo = useInvoiceStore((s) => s.settings.profile.logo);
  const { setStatus, setTheme, deleteInvoice, restoreInvoice } = useInvoiceStore.getState();
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);

  if (!hydrated) return <PageLoader />;
  if (!invoice) return <NotFound />;

  const totals = calculateTotals(invoice);
  const status = displayStatus(invoice);
  const money = (n: number) => formatCurrency(n, invoice.currency);
  const shareText = invoiceShareText(invoice);

  const markSent = () => {
    if (invoice.status === "Draft") {
      setStatus(invoice.id, "Sent");
      toast.success("Status diubah ke Terkirim");
    }
  };

  const handleDownload = async () => {
    setBusy("pdf");
    try {
      await downloadPdf(invoice, logo);
    } catch {
      toast.error("Gagal membuat PDF. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      const file = await makePdfFile(invoice, logo);
      const result = await shareFile(file, invoice.invoiceNumber, shareText);
      if (result === "needs-gesture") {
        toast("PDF siap dibagikan", {
          duration: 10000,
          action: { label: "Bagikan", onClick: () => void shareFile(file, invoice.invoiceNumber, shareText).then(markSent) },
        });
      } else {
        markSent();
      }
    } catch {
      toast.error("Tidak bisa membagikan PDF di browser ini — gunakan Download.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = () => {
    const removed = deleteInvoice(invoice.id);
    router.push("/invoices");
    toast(`Invoice ${invoice.invoiceNumber} dihapus`, {
      duration: 6000,
      action: removed ? { label: "Batalkan", onClick: () => restoreInvoice(removed) } : undefined,
    });
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Teks tagihan disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <div className="px-4 pt-4 pb-32 sm:px-6 lg:pt-6 lg:pb-12">
      <Link href="/invoices" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Semua invoice
      </Link>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* ---------- side panel ---------- */}
        <div className="space-y-4 lg:sticky lg:top-18">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">#{invoice.invoiceNumber}</p>
                <h1 className="truncate text-xl font-semibold tracking-tight">{invoice.clientName || "Tanpa nama"}</h1>
                {invoice.clientCompany && <p className="truncate text-sm text-muted-foreground">{invoice.clientCompany}</p>}
              </div>
              <StatusBadge status={status} />
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{money(totals.total)}</p>
            {totals.paid > 0 && invoice.status !== "Paid" && (
              <p className="mt-1 text-sm text-muted-foreground">
                Sisa tagihan <span className="font-semibold text-foreground">{money(totals.balance)}</span>
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Tanggal</dt>
                <dd className="font-medium">{formatDate(invoice.invoiceDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Jatuh tempo</dt>
                <dd className={status === "Overdue" ? "font-semibold text-amber-600" : "font-medium"}>
                  {formatDate(invoice.dueDate)}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Status</p>
              <Segmented<InvoiceStatus>
                className="w-full"
                value={invoice.status}
                onChange={(s) => {
                  setStatus(invoice.id, s);
                  if (s === "Paid") toast.success("Ditandai lunas 🎉");
                }}
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "Sent", label: "Terkirim" },
                  { value: "Paid", label: "Lunas" },
                ]}
              />
            </div>

            <div className="mt-5 hidden gap-2 lg:grid lg:grid-cols-2">
              <Button onClick={handleDownload} disabled={busy !== null} className="col-span-2">
                {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Download PDF
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/invoice/${invoice.id}/edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/invoice/new?duplicate=${invoice.id}`}>
                  <Copy className="size-4" /> Duplikat
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <p className="mb-3 text-sm font-semibold">Kirim ke klien</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <a href={whatsappUrl(invoice, shareText)} target="_blank" rel="noreferrer" onClick={markSent}>
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={mailtoUrl(invoice, shareText)} onClick={markSent}>
                  <Mail className="size-4" /> Email
                </a>
              </Button>
              <Button variant="outline" onClick={copyText}>
                <ClipboardCopy className="size-4" /> Salin teks
              </Button>
              {canShareFiles() ? (
                <Button variant="outline" onClick={handleShare} disabled={busy !== null}>
                  {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                  Bagikan PDF
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDownload} disabled={busy !== null}>
                  <Download className="size-4" /> PDF
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tips: download PDF lalu lampirkan di chat/email. Teks tagihan berisi nominal & rekening.
            </p>
          </div>

          <div className="flex gap-2 lg:hidden">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/invoice/new?duplicate=${invoice.id}`}>
                <Copy className="size-4" /> Duplikat
              </Link>
            </Button>
            <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="size-4" /> Hapus
            </Button>
          </div>
          <Button
            variant="ghost"
            className="hidden w-full text-muted-foreground hover:text-destructive lg:inline-flex"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" /> Hapus invoice
          </Button>
        </div>

        {/* ---------- document ---------- */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Ganti template</p>
            <TemplatePicker value={invoice.theme} onChange={(t) => setTheme(invoice.id, t)} />
          </div>
          <ScaledPreview invoice={invoice} logo={logo} />
        </div>
      </div>

      {/* ---------- mobile action bar ---------- */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/invoice/${invoice.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
          <Button onClick={handleDownload} disabled={busy !== null} className="flex-2">
            {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
