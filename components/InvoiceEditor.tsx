"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  FileText,
  Landmark,
  LayoutTemplate,
  Loader2,
  Percent,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { Invoice, LineItem, PaymentStage } from "@/types/invoice";
import { CURRENCIES, PAYMENT_METHODS } from "@/types/invoice";
import {
  addDaysISO,
  calculateTotals,
  CURRENCY_LABEL,
  CURRENCY_LOCALE,
  currencyDecimals,
  currencySymbol,
  emptyLineItem,
  formatCurrency,
  formatDate,
  lineTotal,
  stageAmount,
  uid,
} from "@/lib/invoice";
import { saveNewDraft, useInvoiceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect, NumberInput, Segmented, Switch } from "@/components/ui/form";
import { ScaledPreview, TemplatePicker } from "@/components/invoice-ui";
import { getTemplate } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface InvoiceEditorProps {
  initial: Invoice;
  title: string;
  /** May be async; while it runs the save buttons show a spinner. Throw to keep the editor open. */
  onSave: (invoice: Invoice) => Promise<void> | void;
  onCancel: () => void;
  /** Persist unsaved work of a brand-new invoice so it survives refresh/navigation. */
  keepDraft?: boolean;
}

type Errors = Partial<Record<"clientName" | "items", string>>;

const SECTION_KEYS = ["client", "items", "totals", "details", "template", "payment", "from"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const METHOD_LABEL: Record<(typeof PAYMENT_METHODS)[number], string> = {
  "Bank Transfer": "Transfer bank",
  QRIS: "QRIS",
  "E-Wallet": "E-Wallet",
  PayPal: "PayPal",
  Wise: "Wise",
  Cash: "Tunai",
  Other: "Lainnya",
};

export default function InvoiceEditor({ initial, title, onSave, onCancel, keepDraft }: InvoiceEditorProps) {
  const [inv, setInv] = useState<Invoice>(initial);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const allInvoices = useInvoiceStore((s) => s.invoices);
  const logo = useInvoiceStore((s) => s.settings.profile.logo);

  // Sections the user has collapsed. "Dari" starts closed once the profile fills it in.
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(initial.freelancerName ? ["from"] : [])
  );
  const sectionProps = (key: SectionKey) => ({
    open: !collapsed.has(key),
    onToggle: () =>
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
  });
  const allCollapsed = collapsed.size === SECTION_KEYS.length;

  const patch = useCallback((p: Partial<Invoice>) => {
    setInv((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }, []);

  const totals = calculateTotals(inv);
  const money = (n: number) => formatCurrency(n, inv.currency);
  const decimals = currencyDecimals(inv.currency);
  const locale = CURRENCY_LOCALE[inv.currency];
  const symbol = currencySymbol(inv.currency);

  // --- history-based suggestions (makes repeat invoices fast) ---
  const others = useMemo(() => allInvoices.filter((i) => i.id !== inv.id), [allInvoices, inv.id]);

  const clientHistory = useMemo(() => {
    const map = new Map<string, Invoice>();
    [...others]
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .forEach((i) => i.clientName && map.set(i.clientName.trim().toLowerCase(), i));
    return map;
  }, [others]);

  const itemHistory = useMemo(() => {
    const map = new Map<string, { description: string; unitPrice: number; count: number }>();
    [...others]
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .forEach((i) =>
        i.lineItems.forEach((li) => {
          const key = li.description.trim().toLowerCase();
          if (!key) return;
          const prev = map.get(key);
          map.set(key, { description: li.description.trim(), unitPrice: li.unitPrice, count: (prev?.count ?? 0) + 1 });
        })
      );
    return map;
  }, [others]);

  const quickItems = useMemo(() => {
    const current = new Set(inv.lineItems.map((li) => li.description.trim().toLowerCase()));
    return [...itemHistory.values()]
      .filter((h) => !current.has(h.description.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [itemHistory, inv.lineItems]);

  const duplicateNumber = others.some((i) => i.invoiceNumber.trim() === inv.invoiceNumber.trim());

  // --- client ---
  const setClientName = (name: string) => {
    const match = clientHistory.get(name.trim().toLowerCase());
    const blank = !inv.clientCompany && !inv.clientEmail && !inv.clientPhone && !inv.clientAddress;
    if (match && blank) {
      patch({
        clientName: match.clientName,
        clientCompany: match.clientCompany,
        clientEmail: match.clientEmail,
        clientPhone: match.clientPhone,
        clientAddress: match.clientAddress,
        clientCountry: match.clientCountry,
      });
      toast.success("Data klien diisi otomatis dari invoice sebelumnya");
    } else {
      patch({ clientName: name });
    }
    if (errors.clientName && name.trim()) setErrors((e) => ({ ...e, clientName: undefined }));
  };

  // --- items ---
  const setItem = (id: string, p: Partial<LineItem>) => {
    patch({ lineItems: inv.lineItems.map((li) => (li.id === id ? { ...li, ...p } : li)) });
    if (errors.items) setErrors((e) => ({ ...e, items: undefined }));
  };

  const setItemDescription = (item: LineItem, description: string) => {
    const match = itemHistory.get(description.trim().toLowerCase());
    setItem(item.id, match && !item.unitPrice ? { description, unitPrice: match.unitPrice } : { description });
  };

  const addItem = (preset?: Partial<LineItem>) => {
    const next = { ...emptyLineItem(), ...preset };
    const last = inv.lineItems[inv.lineItems.length - 1];
    const lastIsBlank = last && !last.description.trim() && !last.unitPrice;
    patch({ lineItems: preset && lastIsBlank ? [...inv.lineItems.slice(0, -1), next] : [...inv.lineItems, next] });
  };

  const removeItem = (id: string) => {
    const rest = inv.lineItems.filter((li) => li.id !== id);
    patch({ lineItems: rest.length ? rest : [emptyLineItem()] });
  };

  // --- payment stages ---
  const setStage = (id: string, p: Partial<PaymentStage>) =>
    patch({ paymentStages: inv.paymentStages.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  const applyStagePreset = (parts: [string, number][]) =>
    patch({
      paymentScheduleType: "scheduled",
      paymentStages: parts.map(([name, value], i) => ({
        id: uid(),
        name,
        type: "percentage",
        value,
        dueDate: i === 0 ? inv.invoiceDate : i === parts.length - 1 ? inv.dueDate : "",
        isPaid: false,
      })),
    });

  const percentAllocated = inv.paymentStages.every((s) => s.type === "percentage")
    ? inv.paymentStages.reduce((sum, s) => sum + (s.value || 0), 0)
    : null;

  // --- save ---
  const handleSave = useCallback(async () => {
    if (saving) return;
    const items = inv.lineItems.filter((li) => li.description.trim() || li.unitPrice);
    const next: Errors = {};
    if (!inv.clientName.trim()) next.clientName = "Nama klien wajib diisi";
    if (!items.length) next.items = "Tambahkan minimal satu item";
    else if (items.some((li) => !li.description.trim())) next.items = "Setiap item perlu nama/deskripsi";
    setErrors(next);

    if (Object.keys(next).length) {
      const first = next.clientName ? "section-client" : "section-items";
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPreviewOpen(false);
      toast.error(next.clientName ?? next.items);
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...inv, invoiceNumber: inv.invoiceNumber.trim(), lineItems: items });
      setDirty(false);
    } catch (e) {
      toast.error(`Gagal menyimpan: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [inv, onSave, saving]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!keepDraft || !dirty) return;
    const t = setTimeout(() => saveNewDraft(inv), 400);
    return () => clearTimeout(t);
  }, [inv, dirty, keepDraft]);

  const cancel = () => {
    if (dirty && !confirm("Buang perubahan yang belum disimpan?")) return;
    onCancel();
  };

  const hasClientDetails = Boolean(
    inv.clientCompany || inv.clientEmail || inv.clientPhone || inv.clientAddress || inv.clientCountry
  );

  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:pt-6">
        {/* Title bar */}
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={cancel} aria-label="Kembali" className="-ml-2">
            <X className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              #{inv.invoiceNumber} {dirty && "· belum disimpan"}
            </p>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="outline" onClick={cancel}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <SaveIcon saving={saving} /> Simpan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          {/* ---------- form ---------- */}
          <div className="space-y-4 pb-32 lg:pb-10">
            <div className="-mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(SECTION_KEYS))}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronsUpDown className="size-3.5" />
                {allCollapsed ? "Buka semua" : "Tutup semua"}
              </button>
            </div>
            <Section
              {...sectionProps("client")}
              id="section-client"
              icon={UserRound}
              title="Ditagihkan kepada"
              summary={[inv.clientName, inv.clientCompany].filter(Boolean).join(" · ") || "Belum diisi"}
              forceOpen={!!errors.clientName}
            >
              <Field label="Nama klien" htmlFor="clientName" error={errors.clientName}>
                <Input
                  id="clientName"
                  list="client-history"
                  value={inv.clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="mis. Budi Santoso"
                  aria-invalid={!!errors.clientName}
                  autoComplete="off"
                  autoFocus={!inv.clientName}
                />
                <datalist id="client-history">
                  {[...clientHistory.values()].map((c) => (
                    <option key={c.id} value={c.clientName}>
                      {c.clientCompany}
                    </option>
                  ))}
                </datalist>
              </Field>
              <Collapsible label="Detail klien (perusahaan, email, alamat)" forceOpen={hasClientDetails}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Perusahaan">
                    <Input value={inv.clientCompany} onChange={(e) => patch({ clientCompany: e.target.value })} placeholder="PT Contoh Jaya" />
                  </Field>
                  <Field label="Email">
                    <Input type="email" inputMode="email" value={inv.clientEmail} onChange={(e) => patch({ clientEmail: e.target.value })} placeholder="klien@email.com" />
                  </Field>
                  <Field label="Telepon / WhatsApp">
                    <Input type="tel" inputMode="tel" value={inv.clientPhone} onChange={(e) => patch({ clientPhone: e.target.value })} placeholder="+62 812…" />
                  </Field>
                  <Field label="Negara">
                    <Input value={inv.clientCountry} onChange={(e) => patch({ clientCountry: e.target.value })} placeholder="Indonesia" />
                  </Field>
                  <Field label="Alamat" className="sm:col-span-2">
                    <Textarea rows={2} className="min-h-0" value={inv.clientAddress} onChange={(e) => patch({ clientAddress: e.target.value })} placeholder="Jalan, kota, kode pos" />
                  </Field>
                </div>
              </Collapsible>
            </Section>

            <Section
              {...sectionProps("items")}
              id="section-items"
              icon={FileText}
              title="Item & layanan"
              summary={`${inv.lineItems.filter((li) => li.description.trim()).length} item`}
              forceOpen={!!errors.items}
              aside={<span className="text-sm font-semibold tabular-nums">{money(totals.subtotal)}</span>}
            >
              {errors.items && <p className="-mt-1 text-xs font-medium text-destructive">{errors.items}</p>}
              <datalist id="item-history">
                {[...itemHistory.values()].map((h) => (
                  <option key={h.description} value={h.description} />
                ))}
              </datalist>

              <div className="space-y-3">
                {inv.lineItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    canRemove={inv.lineItems.length > 1 || !!item.description || !!item.unitPrice}
                    amount={money(lineTotal(item))}
                    symbol={symbol}
                    decimals={decimals}
                    locale={locale}
                    onDescription={(v) => setItemDescription(item, v)}
                    onChange={(p) => setItem(item.id, p)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => addItem()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Plus className="size-4" /> Tambah item
              </button>

              {quickItems.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Sering dipakai:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickItems.map((q) => (
                      <button
                        key={q.description}
                        type="button"
                        onClick={() => addItem({ description: q.description, unitPrice: q.unitPrice })}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        <Plus className="size-3" /> {q.description}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section
              {...sectionProps("totals")}
              icon={Percent}
              title="Diskon & pajak"
              summary={`Total ${money(totals.total)}`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Diskon">
                  <div className="flex gap-2">
                    <NumberInput
                      value={inv.discountValue}
                      onChange={(v) => patch({ discountValue: v })}
                      decimals={inv.discountType === "percentage" ? 2 : decimals}
                      locale={locale}
                      placeholder="0"
                    />
                    <Segmented
                      value={inv.discountType}
                      onChange={(v) => patch({ discountType: v })}
                      options={[
                        { value: "percentage", label: "%" },
                        { value: "fixed", label: symbol },
                      ]}
                    />
                  </div>
                </Field>
                <Field label="Pajak">
                  <div className="flex gap-2">
                    <NumberInput
                      value={inv.taxRate}
                      onChange={(v) => patch({ taxRate: v })}
                      decimals={inv.taxType === "percentage" ? 2 : decimals}
                      locale={locale}
                      placeholder="0"
                    />
                    <Segmented
                      value={inv.taxType}
                      onChange={(v) => patch({ taxType: v })}
                      options={[
                        { value: "percentage", label: "%" },
                        { value: "fixed", label: symbol },
                      ]}
                    />
                  </div>
                </Field>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Tanpa pajak", rate: 0 },
                  { label: "PPN 11%", rate: 11 },
                  { label: "PPN 12%", rate: 12 },
                ].map((p) => (
                  <Chip
                    key={p.label}
                    active={inv.taxType === "percentage" && inv.taxRate === p.rate}
                    onClick={() => patch({ taxType: "percentage", taxRate: p.rate })}
                  >
                    {p.label}
                  </Chip>
                ))}
              </div>

              <div className="space-y-1.5 rounded-xl bg-muted/60 p-4 text-sm">
                <SummaryRow label="Subtotal" value={money(totals.subtotal)} />
                {totals.discount > 0 && <SummaryRow label="Diskon" value={`−${money(totals.discount)}`} />}
                {totals.tax > 0 && <SummaryRow label="Pajak" value={money(totals.tax)} />}
                <div className="flex items-baseline justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary tabular-nums">{money(totals.total)}</span>
                </div>
              </div>
            </Section>

            <Section
              {...sectionProps("details")}
              icon={CalendarDays}
              title="Detail invoice"
              summary={`#${inv.invoiceNumber} · jatuh tempo ${formatDate(inv.dueDate)}`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nomor invoice"
                  htmlFor="invoiceNumber"
                  error={duplicateNumber ? "Nomor ini sudah dipakai invoice lain" : undefined}
                >
                  <Input id="invoiceNumber" value={inv.invoiceNumber} onChange={(e) => patch({ invoiceNumber: e.target.value })} />
                </Field>
                <Field label="Mata uang">
                  <NativeSelect value={inv.currency} onChange={(e) => patch({ currency: e.target.value as Invoice["currency"] })}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_LABEL[c]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Tanggal invoice">
                  <Input type="date" value={inv.invoiceDate} onChange={(e) => patch({ invoiceDate: e.target.value })} />
                </Field>
                <Field label="Jatuh tempo">
                  <Input type="date" value={inv.dueDate} min={inv.invoiceDate} onChange={(e) => patch({ dueDate: e.target.value })} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">Jatuh tempo:</span>
                {[0, 7, 14, 30].map((d) => (
                  <Chip
                    key={d}
                    active={inv.dueDate === addDaysISO(inv.invoiceDate, d)}
                    onClick={() => patch({ dueDate: addDaysISO(inv.invoiceDate, d) })}
                  >
                    {d === 0 ? "Hari ini" : `${d} hari`}
                  </Chip>
                ))}
              </div>
              <Field label="Bahasa dokumen">
                <Segmented
                  value={inv.language}
                  onChange={(v) => patch({ language: v })}
                  options={[
                    { value: "id", label: "Indonesia" },
                    { value: "en", label: "English" },
                  ]}
                />
              </Field>
            </Section>

            <Section
              {...sectionProps("template")}
              icon={LayoutTemplate}
              title="Template"
              className="lg:hidden"
              summary={getTemplate(inv.theme).name}
            >
              <TemplatePicker value={inv.theme} onChange={(theme) => patch({ theme })} />
            </Section>

            <Section
              {...sectionProps("payment")}
              icon={Landmark}
              title="Pembayaran & catatan"
              summary={[METHOD_LABEL[inv.paymentMethod], inv.freelancerBankName].filter(Boolean).join(" · ")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Metode pembayaran">
                  <NativeSelect value={inv.paymentMethod} onChange={(e) => patch({ paymentMethod: e.target.value as Invoice["paymentMethod"] })}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABEL[m]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Nama bank / e-wallet">
                  <Input value={inv.freelancerBankName} onChange={(e) => patch({ freelancerBankName: e.target.value })} placeholder="BCA" />
                </Field>
                <Field label="No. rekening">
                  <Input inputMode="numeric" value={inv.freelancerBankAccount} onChange={(e) => patch({ freelancerBankAccount: e.target.value })} placeholder="1234567890" />
                </Field>
                <Field label="Atas nama">
                  <Input value={inv.freelancerBankAccountName} onChange={(e) => patch({ freelancerBankAccountName: e.target.value })} placeholder="Nama pemilik rekening" />
                </Field>
              </div>
              <Field label="Catatan">
                <Textarea rows={3} value={inv.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Syarat pembayaran, ucapan terima kasih…" />
              </Field>

              <div className="rounded-xl border border-border p-3">
                <Switch
                  checked={inv.paymentScheduleType === "scheduled"}
                  onChange={(on) =>
                    on
                      ? inv.paymentStages.length
                        ? patch({ paymentScheduleType: "scheduled" })
                        : applyStagePreset([["DP", 50], ["Pelunasan", 50]])
                      : patch({ paymentScheduleType: "full" })
                  }
                  label="Bayar bertahap (DP / termin)"
                />
                {inv.paymentScheduleType === "scheduled" && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip onClick={() => applyStagePreset([["DP", 50], ["Pelunasan", 50]])}>50 / 50</Chip>
                      <Chip onClick={() => applyStagePreset([["DP", 30], ["Pelunasan", 70]])}>30 / 70</Chip>
                      <Chip onClick={() => applyStagePreset([["DP", 40], ["Termin 2", 30], ["Pelunasan", 30]])}>3 termin</Chip>
                    </div>
                    {inv.paymentStages.map((s, i) => (
                      <div key={s.id} className="space-y-2 rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={s.name}
                            onChange={(e) => setStage(s.id, { name: e.target.value })}
                            placeholder={`Termin ${i + 1}`}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setStage(s.id, { isPaid: !s.isPaid })}
                            className={cn(
                              "h-11 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors md:h-10",
                              s.isPaid
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-background text-muted-foreground ring-1 ring-border"
                            )}
                          >
                            {s.isPaid ? "✓ Lunas" : "Belum"}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Hapus termin"
                            onClick={() => patch({ paymentStages: inv.paymentStages.filter((x) => x.id !== s.id) })}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto_1fr]">
                          <NumberInput
                            value={s.value}
                            onChange={(v) => setStage(s.id, { value: v })}
                            decimals={s.type === "percentage" ? 2 : decimals}
                            locale={locale}
                            suffix={s.type === "percentage" ? `= ${money(stageAmount(s, totals.total))}` : undefined}
                          />
                          <Segmented
                            value={s.type}
                            onChange={(v) => setStage(s.id, { type: v })}
                            options={[
                              { value: "percentage", label: "%" },
                              { value: "fixed", label: symbol },
                            ]}
                          />
                          <Input
                            type="date"
                            value={s.dueDate}
                            onChange={(e) => setStage(s.id, { dueDate: e.target.value })}
                            className="col-span-2 sm:col-span-1"
                            aria-label="Tanggal jatuh tempo termin"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          patch({
                            paymentStages: [
                              ...inv.paymentStages,
                              { id: uid(), name: "", type: "percentage", value: 0, dueDate: "", isPaid: false },
                            ],
                          })
                        }
                      >
                        <Plus className="size-3.5" /> Tambah termin
                      </Button>
                      {percentAllocated !== null && (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            Math.abs(percentAllocated - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {percentAllocated}% dari 100%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section
              {...sectionProps("from")}
              icon={Building2}
              title="Dari (bisnis Anda)"
              summary={inv.freelancerName || "Belum diisi"}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama / bisnis">
                  <Input value={inv.freelancerName} onChange={(e) => patch({ freelancerName: e.target.value })} placeholder="Nama Anda atau bisnis" />
                </Field>
                <Field label="Email">
                  <Input type="email" inputMode="email" value={inv.freelancerEmail} onChange={(e) => patch({ freelancerEmail: e.target.value })} placeholder="anda@email.com" />
                </Field>
                <Field label="Telepon">
                  <Input type="tel" inputMode="tel" value={inv.freelancerPhone} onChange={(e) => patch({ freelancerPhone: e.target.value })} />
                </Field>
                <Field label="Alamat">
                  <Input value={inv.freelancerAddress} onChange={(e) => patch({ freelancerAddress: e.target.value })} />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Hanya untuk invoice ini. Ubah data default & logo di{" "}
                <Link href="/settings" className="font-medium text-primary hover:underline">
                  Pengaturan
                </Link>
                .
              </p>
            </Section>
          </div>

          {/* ---------- desktop live preview ---------- */}
          <aside className="sticky top-18 hidden max-h-[calc(100vh-88px)] space-y-3 overflow-y-auto pb-6 lg:block">
            <TemplatePicker value={inv.theme} onChange={(theme) => patch({ theme })} />
            <ScaledPreview invoice={inv} logo={logo} />
          </aside>
        </div>
      </div>

      {/* ---------- mobile action bar ---------- */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Total</p>
            <p className="truncate text-lg font-bold tabular-nums">{money(totals.total)}</p>
          </div>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Lihat
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <SaveIcon saving={saving} /> Simpan
          </Button>
        </div>
      </div>

      {/* ---------- mobile preview sheet ---------- */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setPreviewOpen(false)} aria-label="Tutup" className="-ml-2">
              <X className="size-5" />
            </Button>
            <p className="flex-1 font-semibold">Preview</p>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <SaveIcon saving={saving} /> Simpan
            </Button>
          </div>
          <div className="border-b border-border px-4 py-3">
            <TemplatePicker value={inv.theme} onChange={(theme) => patch({ theme })} />
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/50 p-4">
            <ScaledPreview invoice={inv} logo={logo} />
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function SaveIcon({ saving }: { saving: boolean }) {
  return saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />;
}

function ItemCard({
  item,
  index,
  canRemove,
  amount,
  symbol,
  decimals,
  locale,
  onDescription,
  onChange,
  onRemove,
}: {
  item: LineItem;
  index: number;
  canRemove: boolean;
  amount: string;
  symbol: string;
  decimals: number;
  locale: string;
  onDescription: (v: string) => void;
  onChange: (p: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  const [showNotes, setShowNotes] = useState(Boolean(item.notes));

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-background p-3">
      <div className="flex items-start gap-2">
        <span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {index + 1}
        </span>
        <Input
          list="item-history"
          value={item.description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Nama item / layanan"
          aria-label={`Deskripsi item ${index + 1}`}
          autoComplete="off"
          className="flex-1"
        />
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Hapus item"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {showNotes ? (
        <Textarea
          rows={2}
          className="min-h-0"
          value={item.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Keterangan tambahan (opsional)"
          autoFocus={!item.notes}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="ml-8 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          + Keterangan
        </button>
      )}

      <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-2 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-end">
        <Field label="Qty">
          <NumberInput value={item.quantity} onChange={(v) => onChange({ quantity: v })} decimals={2} locale={locale} placeholder="1" />
        </Field>
        <Field label="Harga satuan">
          <NumberInput
            value={item.unitPrice}
            onChange={(v) => onChange({ unitPrice: v })}
            decimals={decimals}
            locale={locale}
            prefix={symbol}
            placeholder="0"
          />
        </Field>
        <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 sm:col-span-1 sm:block sm:bg-transparent sm:px-1 sm:py-0 sm:text-right">
          <span className="text-xs text-muted-foreground sm:block">Jumlah</span>
          <span className="font-semibold tabular-nums sm:block sm:leading-10">{amount}</span>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  aside,
  summary,
  open,
  forceOpen,
  onToggle,
  className,
  children,
}: {
  id?: string;
  icon: typeof FileText;
  title: string;
  aside?: React.ReactNode;
  /** One-line recap shown while the section is collapsed. */
  summary?: React.ReactNode;
  open: boolean;
  /** Keeps the section open regardless of the toggle, e.g. while it holds a validation error. */
  forceOpen?: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const expanded = open || !!forceOpen;
  return (
    <section id={id} className={cn("scroll-mt-20 rounded-2xl border border-border bg-card shadow-xs", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 rounded-2xl p-4 text-left sm:px-5"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{title}</span>
          {!expanded && summary && <span className="block truncate text-xs text-muted-foreground">{summary}</span>}
        </span>
        {aside}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>}
    </section>
  );
}

/** Stays open once opened by the user, and opens by itself while `forceOpen` is true (e.g. autofilled data). */
function Collapsible({ label, forceOpen, children }: { label: string; forceOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open || forceOpen) return <>{children}</>;
  return (
    <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-primary hover:underline">
      + {label}
    </button>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground/80 hover:border-foreground/30"
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}
