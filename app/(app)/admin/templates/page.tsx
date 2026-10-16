"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, Segmented, Switch } from "@/components/ui/form";
import { PageLoader, ScaledPreview, TemplateThumb } from "@/components/invoice-ui";
import { useInvoiceStore } from "@/lib/store";
import { addDaysISO, todayISO } from "@/lib/invoice";
import {
  COLOR_KEYS,
  DEFAULT_TEMPLATE_ID,
  FONT_LABEL,
  HEADER_LAYOUTS,
  TABLE_STYLES,
  TOTAL_STYLES,
  type ColorKey,
  type FontKey,
  type TemplateConfig,
} from "@/lib/themes";
import { deleteTemplateAction, moveTemplateAction, saveTemplateAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

const LAYOUT_LABEL: Record<TemplateConfig["layout"], string> = {
  band: "Header penuh",
  minimal: "Minimal",
  accent: "Garis aksen",
  split: "Terbelah",
  centered: "Rata tengah",
};
const TABLE_LABEL: Record<TemplateConfig["table"], string> = { filled: "Header berwarna", lines: "Garis", striped: "Belang" };
const TOTAL_LABEL: Record<TemplateConfig["totalStyle"], string> = { line: "Garis", box: "Kotak" };
const COLOR_LABEL: Record<ColorKey, string> = {
  accent: "Aksen",
  headerBg: "Latar header",
  headerText: "Teks header",
  pageBg: "Latar halaman",
  text: "Teks utama",
  muted: "Teks sekunder",
  border: "Garis",
  soft: "Latar kotak",
  tableHeaderBg: "Latar header tabel",
  tableHeaderText: "Teks header tabel",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

interface Draft {
  template: TemplateConfig;
  /** null while creating a new template */
  originalId: string | null;
}

export default function AdminTemplatesPage() {
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const templates = useInvoiceStore((s) => s.templates);
  const profile = useInvoiceStore((s) => s.settings.profile);
  const setTemplates = useInvoiceStore((s) => s.setTemplates);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "delete" | "move" | null>(null);

  const sample = useMemo<Invoice>(
    () => ({
      id: "preview",
      invoiceNumber: "INV-2026-042",
      invoiceDate: todayISO(),
      dueDate: addDaysISO(todayISO(), 14),
      currency: "IDR",
      status: "Sent",
      language: "id",
      freelancerName: profile.name || "Studio Andi",
      freelancerEmail: profile.email || "halo@studioandi.id",
      freelancerPhone: profile.phone || "+62 812 3456 7890",
      freelancerAddress: profile.address || "Jakarta",
      freelancerBankName: profile.bankName || "BCA",
      freelancerBankAccount: profile.bankAccount || "1234567890",
      freelancerBankAccountName: profile.bankAccountName || "Andi Pratama",
      clientName: "Budi Santoso",
      clientCompany: "PT Nusantara Digital",
      clientEmail: "budi@nusantara.co.id",
      clientPhone: "",
      clientAddress: "Jl. Gatot Subroto Kav. 21, Jakarta",
      clientCountry: "",
      lineItems: [
        { id: "a", description: "Desain UI/UX aplikasi", notes: "12 layar, 2x revisi", quantity: 1, unitPrice: 7_500_000 },
        { id: "b", description: "Pengembangan frontend", quantity: 1, unitPrice: 12_000_000 },
        { id: "c", description: "Maintenance bulanan", quantity: 3, unitPrice: 1_500_000 },
      ],
      discountType: "percentage",
      discountValue: 5,
      taxType: "percentage",
      taxRate: 11,
      paymentScheduleType: "full",
      paymentStages: [],
      notes: "Terima kasih atas kerja samanya.",
      paymentMethod: "Bank Transfer",
      theme: "",
      createdAt: "",
      updatedAt: "",
    }),
    [profile]
  );

  if (!hydrated) return <PageLoader />;

  const current: Draft = draft ?? { template: templates[0], originalId: templates[0]?.id ?? null };
  const t = current.template;
  const isNew = current.originalId === null;

  const confirmDiscard = () => !dirty || confirm("Buang perubahan yang belum disimpan?");

  const select = (tpl: TemplateConfig) => {
    if (tpl.id === current.originalId || !confirmDiscard()) return;
    setDraft({ template: tpl, originalId: tpl.id });
    setDirty(false);
  };

  const edit = (p: Partial<TemplateConfig>) => {
    setDraft({ ...current, template: { ...t, ...p } });
    setDirty(true);
  };
  const editColor = (key: ColorKey, value: string) => edit({ colors: { ...t.colors, [key]: value } });

  const startNew = (from: TemplateConfig) => {
    if (!confirmDiscard()) return;
    const name = isNew ? from.name : `${from.name} (salinan)`;
    let id = slugify(name);
    for (let i = 2; templates.some((x) => x.id === id); i++) id = `${slugify(name)}-${i}`;
    setDraft({
      template: { ...from, id, name, isActive: true, sortOrder: templates.length },
      originalId: null,
    });
    setDirty(true);
  };

  const save = async () => {
    setBusy("save");
    const res = await saveTemplateAction(t, current.originalId);
    setBusy(null);
    if (!res.ok) return void toast.error(res.error);
    const saved = res.data;
    setTemplates(isNew ? [...templates, saved] : templates.map((x) => (x.id === saved.id ? saved : x)));
    setDraft({ template: saved, originalId: saved.id });
    setDirty(false);
    toast.success(isNew ? "Template dibuat" : "Template disimpan");
  };

  const remove = async () => {
    if (isNew) {
      setDraft(null);
      setDirty(false);
      return;
    }
    if (!confirm(`Hapus template "${t.name}"? Invoice yang memakainya akan tampil dengan template default.`)) return;
    setBusy("delete");
    const res = await deleteTemplateAction(t.id);
    setBusy(null);
    if (!res.ok) return void toast.error(res.error);
    setTemplates(templates.filter((x) => x.id !== t.id));
    setDraft(null);
    setDirty(false);
    toast.success("Template dihapus");
  };

  const move = async (id: string, dir: -1 | 1) => {
    setBusy("move");
    const res = await moveTemplateAction(id, dir);
    setBusy(null);
    if (!res.ok) return void toast.error(res.error);
    setTemplates(res.data);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* ---------- list ---------- */}
      <div className="space-y-2 lg:sticky lg:top-18">
        <Button variant="outline" className="w-full" onClick={() => startNew(t)}>
          <Plus className="size-4" /> Template baru
        </Button>
        <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100vh-180px)] lg:flex-col lg:overflow-y-auto">
          {templates.map((tpl, i) => {
            const active = tpl.id === current.originalId;
            return (
              <li key={tpl.id} className="shrink-0">
                <div
                  className={cn(
                    "flex w-56 items-center gap-2.5 rounded-xl border bg-card p-2 transition-colors lg:w-full",
                    active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/25"
                  )}
                >
                  <button type="button" onClick={() => select(tpl)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span className="w-10 shrink-0">
                      <TemplateThumb template={tpl} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{tpl.name}</span>
                      <span className={cn("block text-[11px]", tpl.isActive ? "text-emerald-600" : "text-muted-foreground")}>
                        {tpl.isActive ? "Aktif" : "Nonaktif"}
                        {tpl.id === DEFAULT_TEMPLATE_ID && " · default"}
                      </span>
                    </span>
                  </button>
                  <span className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Naikkan"
                      disabled={i === 0 || busy !== null}
                      onClick={() => move(tpl.id, -1)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Turunkan"
                      disabled={i === templates.length - 1 || busy !== null}
                      onClick={() => move(tpl.id, 1)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ---------- editor ---------- */}
      {t && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{isNew ? "Template baru" : `Edit: ${t.name}`}</h2>
            <Switch
              checked={t.isActive}
              onChange={(v) => edit({ isActive: v })}
              label={<span className="text-xs">{t.isActive ? "Aktif" : "Nonaktif"}</span>}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama">
              <Input
                value={t.name}
                maxLength={40}
                onChange={(e) => edit(isNew ? { name: e.target.value, id: slugify(e.target.value) } : { name: e.target.value })}
              />
            </Field>
            <Field label="ID" hint={isNew ? "Huruf kecil, angka, tanda -. Tidak bisa diubah setelah dibuat." : "Tidak bisa diubah"}>
              <Input value={t.id} disabled={!isNew} onChange={(e) => edit({ id: slugify(e.target.value) })} />
            </Field>
            <Field label="Deskripsi" className="sm:col-span-2">
              <Input value={t.description} maxLength={120} onChange={(e) => edit({ description: e.target.value })} />
            </Field>
          </div>

          <Field label="Layout header">
            <NativeSelect value={t.layout} onChange={(e) => edit({ layout: e.target.value as TemplateConfig["layout"] })}>
              {HEADER_LAYOUTS.map((l) => (
                <option key={l} value={l}>
                  {LAYOUT_LABEL[l]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Gaya tabel" className="sm:col-span-2">
              <Segmented
                className="w-full"
                value={t.table}
                onChange={(v) => edit({ table: v })}
                options={TABLE_STYLES.map((v) => ({ value: v, label: TABLE_LABEL[v] }))}
                size="sm"
              />
            </Field>
            <Field label="Gaya total" className="sm:col-span-2">
              <Segmented
                className="w-full"
                value={t.totalStyle}
                onChange={(v) => edit({ totalStyle: v })}
                options={TOTAL_STYLES.map((v) => ({ value: v, label: TOTAL_LABEL[v] }))}
                size="sm"
              />
            </Field>
            <Field label="Huruf">
              <NativeSelect value={t.font} onChange={(e) => edit({ font: e.target.value as FontKey })}>
                {(Object.keys(FONT_LABEL) as FontKey[]).map((f) => (
                  <option key={f} value={f}>
                    {FONT_LABEL[f]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Ketebalan judul">
              <NativeSelect value={t.headingWeight} onChange={(e) => edit({ headingWeight: Number(e.target.value) })}>
                {[500, 600, 700, 800].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground/80">Warna</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {COLOR_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-border p-1.5 pr-2">
                  <input
                    type="color"
                    value={t.colors[key]}
                    onChange={(e) => editColor(key, e.target.value.toUpperCase())}
                    className="size-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    aria-label={COLOR_LABEL[key]}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">{COLOR_LABEL[key]}</span>
                  <input
                    value={t.colors[key]}
                    onChange={(e) => editColor(key, e.target.value)}
                    className="w-20 rounded-md bg-muted px-1.5 py-1 font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-ring/30"
                    maxLength={7}
                    spellCheck={false}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={save} disabled={busy !== null || (!dirty && !isNew)}>
              {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isNew ? "Buat template" : "Simpan"}
            </Button>
            {!isNew && (
              <Button variant="outline" onClick={() => startNew(t)} disabled={busy !== null}>
                <Copy className="size-4" /> Duplikat
              </Button>
            )}
            {t.id !== DEFAULT_TEMPLATE_ID && (
              <Button
                variant="ghost"
                className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={remove}
                disabled={busy !== null}
              >
                <Trash2 className="size-4" /> {isNew ? "Batal" : "Hapus"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ---------- live preview ---------- */}
      {t && (
        <div className="space-y-2 lg:sticky lg:top-18">
          <p className="text-xs font-medium text-muted-foreground">Preview (data contoh)</p>
          <ScaledPreview invoice={sample} logo={profile.logo} template={t} />
        </div>
      )}
    </div>
  );
}
