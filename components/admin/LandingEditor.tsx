"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/ui/form";
import { FEATURE_ICON } from "@/components/landing/icons";
import { saveLandingAction } from "@/lib/actions/admin";
import { DEFAULT_LANDING, FEATURE_ICONS, SECTION_LABEL, type LandingContent, type LandingSectionId } from "@/lib/landing";
import { cn } from "@/lib/utils";

type EditableKey = LandingSectionId | "footer";
type ItemField = { key: string; label: string; type: "text" | "textarea" | "icon" };
type FieldSpec =
  | { key: string; label: string; type: "text" | "textarea"; hint?: string }
  | { key: string; label: string; type: "strings"; addLabel: string; max: number }
  | { key: string; label: string; type: "items"; addLabel: string; max: number; fields: ItemField[] };

const HEADING: FieldSpec[] = [
  { key: "eyebrow", label: "Label kecil di atas judul", type: "text" },
  { key: "title", label: "Judul", type: "text" },
];

const SPEC: Record<EditableKey, FieldSpec[]> = {
  hero: [
    { key: "badge", label: "Badge", type: "text" },
    { key: "title", label: "Judul utama", type: "textarea", hint: "Kalimat setelah titik pertama memakai warna utama. Contoh: “Buat invoice profesional. Gratis, tanpa batas.”" },
    { key: "subtitle", label: "Sub judul", type: "textarea" },
    { key: "primaryCta", label: "Tombol utama", type: "text" },
    { key: "secondaryCta", label: "Tombol kedua (ke galeri template)", type: "text" },
    { key: "bullets", label: "Poin keunggulan", type: "strings", addLabel: "Tambah poin", max: 6 },
    { key: "audiences", label: "Daftar “Cocok untuk …” di bawah hero", type: "strings", addLabel: "Tambah target", max: 20 },
  ],
  stats: [
    {
      key: "items",
      label: "Angka",
      type: "items",
      addLabel: "Tambah angka",
      max: 6,
      fields: [
        { key: "value", label: "Nilai", type: "text" },
        { key: "label", label: "Keterangan", type: "text" },
      ],
    },
  ],
  features: [
    ...HEADING,
    { key: "subtitle", label: "Sub judul", type: "textarea" },
    {
      key: "items",
      label: "Kartu fitur",
      type: "items",
      addLabel: "Tambah fitur",
      max: 18,
      fields: [
        { key: "icon", label: "Ikon", type: "icon" },
        { key: "title", label: "Judul", type: "text" },
        { key: "text", label: "Deskripsi", type: "textarea" },
      ],
    },
  ],
  demo: [...HEADING, { key: "subtitle", label: "Sub judul", type: "textarea" }, { key: "buttonLabel", label: "Tombol", type: "text" }],
  templates: [...HEADING, { key: "subtitle", label: "Sub judul", type: "textarea" }, { key: "buttonLabel", label: "Tombol di detail template", type: "text" }],
  steps: [
    ...HEADING,
    {
      key: "items",
      label: "Langkah",
      type: "items",
      addLabel: "Tambah langkah",
      max: 8,
      fields: [
        { key: "title", label: "Judul", type: "text" },
        { key: "text", label: "Deskripsi", type: "textarea" },
      ],
    },
  ],
  pricing: [
    ...HEADING,
    { key: "subtitle", label: "Sub judul", type: "textarea" },
    { key: "planName", label: "Nama paket", type: "text" },
    { key: "badge", label: "Badge paket", type: "text" },
    { key: "price", label: "Harga", type: "text" },
    { key: "period", label: "Periode", type: "text" },
    { key: "features", label: "Isi paket", type: "strings", addLabel: "Tambah baris", max: 16 },
    { key: "buttonLabel", label: "Tombol", type: "text" },
    { key: "note", label: "Catatan di bawah tombol", type: "text" },
  ],
  faq: [
    ...HEADING,
    {
      key: "items",
      label: "Pertanyaan",
      type: "items",
      addLabel: "Tambah pertanyaan",
      max: 20,
      fields: [
        { key: "q", label: "Pertanyaan", type: "text" },
        { key: "a", label: "Jawaban", type: "textarea" },
      ],
    },
  ],
  cta: [
    { key: "title", label: "Judul", type: "text" },
    { key: "subtitle", label: "Sub judul", type: "textarea" },
    { key: "buttonLabel", label: "Tombol", type: "text" },
  ],
  footer: [
    { key: "text", label: "Teks footer", type: "text" },
    { key: "contactEmail", label: "Email kontak", type: "text" },
  ],
};

type Loose = Record<string, unknown>;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export default function LandingEditor({ initial }: { initial: LandingContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [selected, setSelected] = useState<EditableKey>("hero");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = (next: LandingContent) => {
    setContent(next);
    setDirty(true);
  };
  const section = content[selected] as unknown as Loose;
  const setSection = (patch: Loose) => change({ ...content, [selected]: { ...section, ...patch } } as LandingContent);

  const save = async () => {
    setSaving(true);
    const res = await saveLandingAction(content);
    setSaving(false);
    if (!res.ok) return void toast.error(res.error);
    setBaseline(res.data);
    setDirty(false);
    toast.success("Landing page disimpan");
    router.refresh();
  };

  return (
    <div className="pb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landing page</h1>
          <p className="text-sm text-muted-foreground">Edit isi setiap section, sembunyikan, atau ubah urutannya.</p>
        </div>
        <Button asChild variant="outline">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Lihat landing page
          </a>
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ---------- section list ---------- */}
        <div className="space-y-1.5 lg:sticky lg:top-6">
          {content.order.map((id, i) => {
            const enabled = content[id].enabled;
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-1 rounded-xl border bg-card p-1.5 pl-3 transition-colors",
                  selected === id ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <button type="button" onClick={() => setSelected(id)} className="min-w-0 flex-1 py-1.5 text-left">
                  <span className={cn("block truncate text-sm font-medium", !enabled && "text-muted-foreground line-through")}>
                    {i + 1}. {SECTION_LABEL[id]}
                  </span>
                </button>
                <IconBtn
                  label={enabled ? "Sembunyikan" : "Tampilkan"}
                  onClick={() => change({ ...content, [id]: { ...content[id], enabled: !enabled } } as LandingContent)}
                >
                  {enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
                </IconBtn>
                <IconBtn label="Naikkan" disabled={i === 0} onClick={() => change({ ...content, order: move(content.order, i, i - 1) })}>
                  <ArrowUp className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Turunkan"
                  disabled={i === content.order.length - 1}
                  onClick={() => change({ ...content, order: move(content.order, i, i + 1) })}
                >
                  <ArrowDown className="size-3.5" />
                </IconBtn>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setSelected("footer")}
            className={cn(
              "w-full rounded-xl border bg-card px-3 py-3 text-left text-sm font-medium",
              selected === "footer" ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
          >
            Footer
          </button>
          <p className="px-1 pt-2 text-xs text-muted-foreground">
            Tip: tulis <code className="rounded bg-muted px-1">{"{template}"}</code> di teks mana pun untuk menampilkan jumlah template aktif.
          </p>
        </div>

        {/* ---------- section form ---------- */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{selected === "footer" ? "Footer" : SECTION_LABEL[selected]}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirm("Kembalikan isi section ini ke teks bawaan?")) return;
                change({ ...content, [selected]: structuredClone(DEFAULT_LANDING[selected]) } as LandingContent);
              }}
            >
              <RotateCcw className="size-3.5" /> Default
            </Button>
          </div>
          {selected !== "footer" && !(section.enabled as boolean) && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Section ini sedang disembunyikan dari landing page.
            </p>
          )}

          {SPEC[selected].map((f) => (
            <FieldEditor key={`${selected}.${f.key}`} spec={f} value={section[f.key]} onChange={(v) => setSection({ [f.key]: v })} />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg transition-transform duration-200 lg:left-64",
          dirty ? "visible translate-y-0" : "pointer-events-none invisible translate-y-full"
        )}
      >
        <div className="flex max-w-5xl items-center gap-3 lg:px-4">
          <p className="flex-1 text-sm text-muted-foreground">Ada perubahan yang belum disimpan</p>
          <Button
            variant="ghost"
            onClick={() => {
              setContent(baseline);
              setDirty(false);
            }}
          >
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function FieldEditor({ spec, value, onChange }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void }) {
  if (spec.type === "text" || spec.type === "textarea") {
    const v = String(value ?? "");
    return (
      <Field label={spec.label} hint={spec.hint}>
        {spec.type === "text" ? (
          <Input value={v} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Textarea rows={3} className="min-h-0" value={v} onChange={(e) => onChange(e.target.value)} />
        )}
      </Field>
    );
  }

  if (spec.type === "strings") {
    const list = (value as string[]) ?? [];
    return (
      <div>
        <p className="mb-2 text-[13px] font-medium text-foreground/80">{spec.label}</p>
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input value={item} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
              <ListControls index={i} length={list.length} onMove={(to) => onChange(move(list, i, to))} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        {list.length < spec.max && (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => onChange([...list, ""])}>
            <Plus className="size-3.5" /> {spec.addLabel}
          </Button>
        )}
      </div>
    );
  }

  if (spec.type !== "items") return null;
  const items = (value as Loose[]) ?? [];
  const blank = Object.fromEntries(spec.fields.map((f) => [f.key, f.type === "icon" ? "sparkles" : ""]));
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-foreground/80">{spec.label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
              <ListControls index={i} length={items.length} onMove={(to) => onChange(move(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
            <div className="space-y-2">
              {spec.fields.map((f) => {
                const v = String(item[f.key] ?? "");
                const set = (nv: string) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: nv } : x)));
                if (f.type === "icon") {
                  const Icon = FEATURE_ICON[v as keyof typeof FEATURE_ICON] ?? FEATURE_ICON.sparkles;
                  return (
                    <div key={f.key} className="flex items-center gap-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <NativeSelect value={v} onChange={(e) => set(e.target.value)} aria-label={f.label}>
                        {FEATURE_ICONS.map((ic) => (
                          <option key={ic} value={ic}>
                            {ic}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  );
                }
                return f.type === "text" ? (
                  <Input key={f.key} value={v} placeholder={f.label} aria-label={f.label} onChange={(e) => set(e.target.value)} />
                ) : (
                  <Textarea key={f.key} rows={2} className="min-h-0" value={v} placeholder={f.label} aria-label={f.label} onChange={(e) => set(e.target.value)} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {items.length < spec.max && (
        <Button variant="outline" size="sm" className="mt-2" onClick={() => onChange([...items, { ...blank }])}>
          <Plus className="size-3.5" /> {spec.addLabel}
        </Button>
      )}
    </div>
  );
}

function ListControls({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      <IconBtn label="Naikkan" disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp className="size-3.5" />
      </IconBtn>
      <IconBtn label="Turunkan" disabled={index === length - 1} onClick={() => onMove(index + 1)}>
        <ArrowDown className="size-3.5" />
      </IconBtn>
      <IconBtn label="Hapus" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </IconBtn>
    </div>
  );
}
