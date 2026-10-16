"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NumberInput } from "@/components/ui/form";
import { ScaledPreview } from "@/components/invoice-ui";
import { sampleInvoice } from "@/components/landing/sample";
import { calculateTotals, formatCurrency } from "@/lib/invoice";
import type { TemplateConfig } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface Row {
  id: number;
  description: string;
  price: number;
}

/** "Try it" section: type a client and items, see the invoice update live. No account needed. */
export default function LiveDemo({
  templates,
  buttonLabel,
  startHref,
}: {
  templates: TemplateConfig[];
  buttonLabel: string;
  startHref: string;
}) {
  const choices = templates.slice(0, 8);
  const [client, setClient] = useState("PT Maju Bersama");
  const [rows, setRows] = useState<Row[]>([
    { id: 1, description: "Desain feed Instagram (12 post)", price: 1_800_000 },
    { id: 2, description: "Copywriting caption", price: 600_000 },
  ]);
  const [nextId, setNextId] = useState(3);
  const [tax, setTax] = useState(true);
  const [templateId, setTemplateId] = useState(choices[1]?.id ?? choices[0]?.id);
  const template = choices.find((t) => t.id === templateId) ?? choices[0];

  const invoice: Invoice = useMemo(
    () => ({
      ...sampleInvoice("Sent"),
      clientName: client || "Nama klien",
      clientCompany: "",
      clientEmail: "",
      clientAddress: "",
      taxRate: tax ? 11 : 0,
      lineItems: rows.map((r) => ({ id: String(r.id), description: r.description, quantity: 1, unitPrice: r.price })),
    }),
    [client, rows, tax]
  );
  const total = calculateTotals(invoice).total;

  const update = (id: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const addRow = () => {
    setRows((rs) => [...rs, { id: nextId, description: "", price: 0 }]);
    setNextId((n) => n + 1);
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">Invoice baru · demo</span>
        </div>
        <div className="space-y-4">
          <Field label="Ditagihkan kepada">
            <Input value={client} onChange={(e) => setClient(e.target.value)} maxLength={60} placeholder="Nama klien" />
          </Field>
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-foreground/80">Item</p>
            {rows.map((r) => (
              <div key={r.id} className="flex gap-2">
                <Input
                  value={r.description}
                  onChange={(e) => update(r.id, { description: e.target.value })}
                  maxLength={60}
                  placeholder="Layanan"
                  aria-label="Nama layanan"
                  className="flex-3"
                />
                <NumberInput
                  value={r.price}
                  onChange={(v) => update(r.id, { price: v })}
                  decimals={0}
                  prefix="Rp"
                  aria-label="Harga"
                  className="flex-2"
                />
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus item"
                    onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    className="shrink-0 text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {rows.length < 4 && (
              <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <Plus className="size-4" /> Tambah item
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tax} onChange={(e) => setTax(e.target.checked)} className="size-4 accent-primary" />
            Tambah PPN 11%
          </label>
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground/80">Template</p>
            <div className="flex flex-wrap gap-1.5">
              {choices.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    t.id === template?.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-foreground/30"
                  )}
                >
                  <span className="size-2.5 rounded-full" style={{ background: t.colors.accent }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
            <span className="text-sm font-medium">Total tagihan</span>
            <span key={total} className="animate-pop font-display text-xl font-bold text-primary tabular-nums">
              {formatCurrency(total, "IDR")}
            </span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href={startHref}>
              {buttonLabel} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {template && (
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/5">
            <ScaledPreview invoice={invoice} template={template} />
          </div>
        </div>
      )}
    </div>
  );
}
