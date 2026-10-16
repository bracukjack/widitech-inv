"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileCog,
  ImagePlus,
  KeyRound,
  Palette,
  Landmark,
  Loader2,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Settings } from "@/types/invoice";
import { CURRENCIES, PAYMENT_METHODS } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect, NumberInput, Segmented } from "@/components/ui/form";
import { PageLoader, TemplatePicker } from "@/components/invoice-ui";
import { useInvoiceStore } from "@/lib/store";
import { normalizeInvoice, normalizeSettings, type Loose } from "@/lib/normalize";
import { changePasswordAction, logoutAction } from "@/lib/actions/auth";
import LegacyImportBanner from "@/components/LegacyImport";
import BrandingEditor from "@/components/BrandingEditor";
import { CURRENCY_LABEL } from "@/lib/invoice";
import { cn } from "@/lib/utils";

const LOGO_MAX_PX = 360;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const METHOD_LABEL: Record<(typeof PAYMENT_METHODS)[number], string> = {
  "Bank Transfer": "Transfer bank",
  QRIS: "QRIS",
  "E-Wallet": "E-Wallet",
  PayPal: "PayPal",
  Wise: "Wise",
  Cash: "Tunai",
  Other: "Lainnya",
};

/** Downscales the logo to a small PNG so it fits comfortably in localStorage. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, LOGO_MAX_PX / Math.max(img.width || LOGO_MAX_PX, img.height || LOGO_MAX_PX));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round((img.width || LOGO_MAX_PX) * ratio);
      canvas.height = Math.round((img.height || LOGO_MAX_PX) * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca"));
    };
    img.src = url;
  });
}

export default function SettingsPage() {
  const hydrated = useInvoiceStore((s) => s.hydrated);
  const stored = useInvoiceStore((s) => s.settings);
  const invoiceCount = useInvoiceStore((s) => s.invoices.length);
  const latestInvoice = useInvoiceStore((s) => s.invoices[0]);
  const { saveSettings, exportData, importData, clearAll } = useInvoiceStore.getState();
  const [form, setForm] = useState<Settings>(stored);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = useInvoiceStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Pick up stored settings once loaded (or changed in another tab) unless the user is mid-edit.
  useEffect(() => {
    if (!dirty) setForm(stored);
  }, [stored, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (!hydrated) return <PageLoader />;

  const setProfile = (p: Partial<Settings["profile"]>) => {
    setForm((f) => ({ ...f, profile: { ...f.profile, ...p } }));
    setDirty(true);
  };
  const setBranding = (p: Partial<Settings["branding"]>) => {
    setForm((f) => ({ ...f, branding: { ...f.branding, ...p } }));
    setDirty(true);
  };
  const setDefaults = (p: Partial<Settings["defaults"]>) => {
    setForm((f) => ({ ...f, defaults: { ...f.defaults, ...p } }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const ok = await saveSettings(form);
    setSaving(false);
    if (ok) {
      setDirty(false);
      toast.success("Pengaturan tersimpan");
    }
  };

  const onLogo = async (file?: File) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return toast.error("Gunakan file PNG, JPG, WEBP atau SVG");
    try {
      setProfile({ logo: await resizeImage(file) });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `widitech-invoice-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    let data: { invoices?: unknown; settings?: unknown };
    try {
      data = JSON.parse(await file.text());
      if (!Array.isArray(data.invoices)) throw new Error();
    } catch {
      return toast.error("File backup tidak valid");
    }
    try {
      const { invoices } = await importData({
        invoices: (data.invoices as Loose[]).map(normalizeInvoice),
        settings: data.settings ? normalizeSettings(data.settings as Loose) : undefined,
      });
      setDirty(false);
      toast.success(`${invoices} invoice dipulihkan dari backup`);
    } catch (e) {
      toast.error(`Import gagal: ${(e as Error).message}`);
    }
  };

  const onClear = async () => {
    if (!confirm(`Hapus semua data? ${invoiceCount} invoice, profil dan pengaturan di akun Anda akan dihapus permanen.`)) return;
    try {
      await clearAll();
      setDirty(false);
      toast.success("Semua data dihapus");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const { profile, defaults } = form;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 pt-5 pb-32 sm:px-6 lg:pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Diisi sekali, otomatis dipakai di setiap invoice baru.</p>
      </div>

      <Card icon={Building2} title="Profil bisnis">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onLogo(e.dataTransfer.files[0]);
              }}
              className={cn(
                "grid size-20 place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
                profile.logo ? "border-transparent bg-white" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              )}
              aria-label="Unggah logo"
            >
              {profile.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo} alt="Logo" className="size-full object-contain" />
              ) : (
                <ImagePlus className="size-6" />
              )}
            </button>
            {profile.logo && (
              <button
                type="button"
                onClick={() => setProfile({ logo: "" })}
                className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-foreground text-background shadow"
                aria-label="Hapus logo"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">Logo</p>
            <p className="text-xs text-muted-foreground">Ketuk untuk unggah · PNG, JPG, SVG</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              onLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama / bisnis">
            <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Andi Pratama / Studio Andi" />
          </Field>
          <Field label="Email">
            <Input type="email" inputMode="email" value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} placeholder="anda@email.com" />
          </Field>
          <Field label="Telepon / WhatsApp">
            <Input type="tel" inputMode="tel" value={profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} placeholder="+62 812…" />
          </Field>
          <Field label="Alamat">
            <Input value={profile.address} onChange={(e) => setProfile({ address: e.target.value })} placeholder="Kota, provinsi" />
          </Field>
        </div>
      </Card>

      <Card icon={Palette} title="Branding invoice">
        <p className="-mt-1 text-sm text-muted-foreground">
          Ciri khas bisnis Anda — warna, ornamen, tanda tangan dan stempel — dipakai di semua invoice, template apa pun yang dipilih.
        </p>
        <BrandingEditor
          value={form.branding}
          onChange={setBranding}
          logo={profile.logo}
          templateId={defaults.theme}
          previewInvoice={latestInvoice}
        />
      </Card>

      <Card icon={Landmark} title="Rekening pembayaran">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Bank / e-wallet">
            <Input value={profile.bankName} onChange={(e) => setProfile({ bankName: e.target.value })} placeholder="BCA" />
          </Field>
          <Field label="No. rekening">
            <Input inputMode="numeric" value={profile.bankAccount} onChange={(e) => setProfile({ bankAccount: e.target.value })} placeholder="1234567890" />
          </Field>
          <Field label="Atas nama">
            <Input value={profile.bankAccountName} onChange={(e) => setProfile({ bankAccountName: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card icon={FileCog} title="Default invoice baru">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Awalan nomor" hint={`Contoh: ${defaults.prefix || "INV"}-${new Date().getFullYear()}-001`}>
            <Input value={defaults.prefix} onChange={(e) => setDefaults({ prefix: e.target.value.replace(/\s/g, "") })} />
          </Field>
          <Field label="Mata uang">
            <NativeSelect value={defaults.currency} onChange={(e) => setDefaults({ currency: e.target.value as Settings["defaults"]["currency"] })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABEL[c]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Pajak default">
            <NumberInput value={defaults.taxRate} onChange={(v) => setDefaults({ taxRate: v })} suffix="%" placeholder="0" />
          </Field>
          <Field label="Jatuh tempo">
            <NumberInput value={defaults.paymentTermsDays} onChange={(v) => setDefaults({ paymentTermsDays: v })} decimals={0} suffix="hari" />
          </Field>
          <Field label="Metode pembayaran">
            <NativeSelect value={defaults.paymentMethod} onChange={(e) => setDefaults({ paymentMethod: e.target.value as Settings["defaults"]["paymentMethod"] })}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Bahasa dokumen">
            <Segmented
              className="w-full"
              value={defaults.language}
              onChange={(v) => setDefaults({ language: v })}
              options={[
                { value: "id", label: "Indonesia" },
                { value: "en", label: "English" },
              ]}
            />
          </Field>
        </div>
        <Field label="Template default">
          <TemplatePicker value={defaults.theme} onChange={(theme) => setDefaults({ theme })} layout="grid" />
        </Field>
        <Field label="Catatan default">
          <Textarea rows={3} value={defaults.notes} onChange={(e) => setDefaults({ notes: e.target.value })} />
        </Field>
      </Card>

      <Card icon={Database} title="Data & backup">
        <p className="text-sm text-muted-foreground">
          Data tersimpan di server dan bisa diakses dari perangkat mana pun setelah login. Export untuk menyimpan salinan
          cadangan.
        </p>
        <LegacyImportBanner />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="size-4" /> Export backup
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            <Upload className="size-4" /> Import backup
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              onImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onClear}>
            <Trash2 className="size-4" /> Hapus semua data
          </Button>
        </div>
      </Card>

      <Card icon={KeyRound} title="Akun & keamanan">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{user?.name}</p>
            <p className="truncate text-muted-foreground">{user?.email}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-3.5" /> Keluar
            </Button>
          </form>
        </div>
        <ChangePasswordForm />
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted/60"
          >
            <ShieldCheck className="size-5 text-primary" />
            <span className="flex-1">
              <span className="block font-medium">Panel admin</span>
              <span className="block text-xs text-muted-foreground">Kelola user dan template invoice</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </Card>

      {/* Sticky save bar — only while there are unsaved changes */}
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
              setForm(stored);
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

function Card({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl border border-border bg-card shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl p-4 text-left sm:px-5"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="flex-1 text-[15px] font-semibold">{title}</h2>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>}
    </section>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await changePasswordAction({ current, next });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    setCurrent("");
    setNext("");
    toast.success("Password diganti. Perangkat lain otomatis keluar.");
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Password lama">
        <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </Field>
      <Field label="Password baru">
        <Input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
      </Field>
      <Button type="submit" variant="outline" disabled={busy || !current || next.length < 8}>
        {busy && <Loader2 className="size-4 animate-spin" />} Ganti password
      </Button>
    </form>
  );
}
