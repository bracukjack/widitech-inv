"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Switch } from "@/components/ui/form";
import Brand from "@/components/Brand";
import { saveSiteAssetAction, saveSiteSettingsAction } from "@/lib/actions/admin";
import { resizeImageFile } from "@/lib/image-resize";
import { contrastText, siteAssetUrl, type SiteAssetKey, type SiteAssetVersions, type SiteSettings } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = ["#0D7377", "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#16A34A", "#0891B2", "#111827"];

const ASSET_SPEC: Record<SiteAssetKey, { label: string; hint: string; resize: Parameters<typeof resizeImageFile>[1] }> = {
  logo: {
    label: "Logo",
    hint: "PNG transparan disarankan. Tampil di header, halaman login dan landing page.",
    resize: { width: 512, height: 512, mode: "contain", type: "image/png" },
  },
  favicon: {
    label: "Favicon",
    hint: "Ikon di tab browser. Gambar persegi, otomatis dipotong 192×192.",
    resize: { width: 192, height: 192, mode: "cover", type: "image/png" },
  },
  og: {
    label: "Gambar share (meta image)",
    hint: "Muncul saat link dibagikan di WhatsApp, Facebook, X. Otomatis dipotong 1200×630.",
    resize: { width: 1200, height: 630, mode: "cover", type: "image/jpeg", quality: 0.85 },
  },
};

export default function SiteSettingsForm({
  initial,
  assets: initialAssets,
  origin,
}: {
  initial: SiteSettings;
  assets: SiteAssetVersions;
  origin: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [assets, setAssets] = useState(initialAssets);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (p: Partial<SiteSettings>) => {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const res = await saveSiteSettingsAction(form);
    setSaving(false);
    if (!res.ok) return void toast.error(res.error);
    setForm(res.data);
    setBaseline(res.data);
    setDirty(false);
    toast.success("Pengaturan situs disimpan");
    router.refresh();
  };

  const onAsset = (key: SiteAssetKey, version: number | null) => {
    setAssets((a) => {
      const next = { ...a };
      if (version) next[key] = version;
      else delete next[key];
      return next;
    });
    router.refresh();
  };

  const displayUrl = (form.siteUrl || origin).replace(/^https?:\/\//, "");
  const title = form.metaTitle || form.siteName;
  const ogUrl = siteAssetUrl("og", assets) ?? `/site-asset/og?preview=${encodeURIComponent(form.primaryColor)}`;

  return (
    <div className="max-w-3xl space-y-4 pb-28">
      <Card title="Identitas">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama website">
            <Input value={form.siteName} maxLength={60} onChange={(e) => set({ siteName: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AssetUpload assetKey="logo" version={assets.logo} onChange={onAsset} />
          <AssetUpload assetKey="favicon" version={assets.favicon} onChange={onAsset} />
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Tampilan di header</p>
          <Brand name={form.siteName || "Nama website"} logo={siteAssetUrl("logo", assets)} />
        </div>
      </Card>

      <Card title="Warna utama">
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => set({ primaryColor: c })}
              className={cn(
                "size-9 rounded-full ring-offset-2 ring-offset-background transition",
                form.primaryColor.toUpperCase() === c && "ring-2 ring-foreground"
              )}
              style={{ background: c }}
            />
          ))}
          <label className="ml-1 flex items-center gap-2 rounded-xl border border-border p-1 pr-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(form.primaryColor) ? form.primaryColor : "#000000"}
              onChange={(e) => set({ primaryColor: e.target.value.toUpperCase() })}
              className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              aria-label="Pilih warna"
            />
            <input
              value={form.primaryColor}
              maxLength={7}
              onChange={(e) => set({ primaryColor: e.target.value })}
              className="w-20 rounded-md bg-muted px-1.5 py-1 font-mono text-xs uppercase outline-none"
              spellCheck={false}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium shadow-sm"
            style={{ background: form.primaryColor, color: contrastText(form.primaryColor) }}
          >
            Contoh tombol
          </span>
          <span className="text-xs text-muted-foreground">Dipakai untuk tombol, link dan aksen di seluruh website.</span>
        </div>
      </Card>

      <Card title="SEO & metadata">
        <Field label="Meta title" hint={<Counter value={form.metaTitle} ideal={60} />}>
          <Input value={form.metaTitle} maxLength={120} onChange={(e) => set({ metaTitle: e.target.value })} />
        </Field>
        <Field label="Meta description" hint={<Counter value={form.metaDescription} ideal={160} />}>
          <Textarea rows={3} value={form.metaDescription} maxLength={320} onChange={(e) => set({ metaDescription: e.target.value })} />
        </Field>
        <Field label="Keywords" hint="Pisahkan dengan koma">
          <Input value={form.keywords} maxLength={500} onChange={(e) => set({ keywords: e.target.value })} />
        </Field>
        <Field
          label="URL situs"
          hint={`Untuk link kanonik & preview share. Kosongkan untuk memakai domain saat ini (${origin}).`}
        >
          <Input
            type="url"
            inputMode="url"
            value={form.siteUrl}
            placeholder="https://invoice.domainanda.com"
            onChange={(e) => set({ siteUrl: e.target.value.trim() })}
          />
        </Field>
        <div className="rounded-xl border border-border p-3">
          <Switch checked={form.allowIndexing} onChange={(v) => set({ allowIndexing: v })} label="Izinkan Google mengindeks website" />
          {!form.allowIndexing && (
            <p className="mt-2 text-xs text-amber-600">Website tidak akan muncul di hasil pencarian (noindex).</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-foreground/80">Preview di Google</p>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="truncate text-xs text-muted-foreground">{displayUrl}</p>
            <p className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{title}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{form.metaDescription}</p>
          </div>
        </div>

        <AssetUpload assetKey="og" version={assets.og} onChange={onAsset} />
        <div>
          <p className="mb-2 text-[13px] font-medium text-foreground/80">Preview saat dibagikan</p>
          <div className="max-w-md overflow-hidden rounded-xl border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogUrl} alt="" className="aspect-[1200/630] w-full bg-muted object-cover" />
            <div className="p-3">
              <p className="text-xs text-muted-foreground uppercase">{displayUrl}</p>
              <p className="line-clamp-1 font-semibold">{title}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{form.metaDescription}</p>
            </div>
          </div>
          {!assets.og && (
            <p className="mt-2 text-xs text-muted-foreground">
              Belum ada gambar share — dibuat otomatis dari nama website, judul hero landing page dan warna.
            </p>
          )}
        </div>
      </Card>

      <div
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-lg transition-transform duration-200",
          dirty ? "visible translate-y-0" : "pointer-events-none invisible translate-y-full"
        )}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="flex-1 text-sm text-muted-foreground">Ada perubahan yang belum disimpan</p>
          <Button
            variant="ghost"
            onClick={() => {
              setForm(baseline);
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

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Counter({ value, ideal }: { value: string; ideal: number }) {
  return (
    <span className={value.length > ideal ? "text-amber-600" : undefined}>
      {value.length}/{ideal} karakter{value.length > ideal ? " — bisa terpotong di Google" : ""}
    </span>
  );
}

function AssetUpload({
  assetKey,
  version,
  onChange,
}: {
  assetKey: SiteAssetKey;
  version?: number;
  onChange: (key: SiteAssetKey, version: number | null) => void;
}) {
  const spec = ASSET_SPEC[assetKey];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = version ? `/site-asset/${assetKey}?v=${version}` : null;

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Pilih file gambar");
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, spec.resize);
      const res = await saveSiteAssetAction(assetKey, dataUrl);
      if (!res.ok) throw new Error(res.error);
      onChange(assetKey, res.data);
      toast.success(`${spec.label} diperbarui`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await saveSiteAssetAction(assetKey, null);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    onChange(assetKey, null);
    toast.success(`${spec.label} dihapus`);
  };

  const wide = assetKey === "og";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-primary",
          wide ? "aspect-[1200/630] w-28" : "size-14"
        )}
        aria-label={`Unggah ${spec.label}`}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className={cn("size-full", wide ? "object-cover" : "object-contain")} />
        ) : (
          <ImagePlus className="size-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{spec.label}</p>
        <p className="text-xs text-muted-foreground">{spec.hint}</p>
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            {url ? "Ganti" : "Unggah"}
          </Button>
          {url && (
            <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
