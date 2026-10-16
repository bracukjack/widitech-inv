"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Eraser, ImagePlus, Loader2, PenLine, Pipette, Trash2, X } from "lucide-react";
import type { Invoice, InvoiceBranding } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, Switch } from "@/components/ui/form";
import { ScaledPreview, TemplateThumb } from "@/components/invoice-ui";
import { sampleInvoice } from "@/components/landing/sample";
import { resizeImageFile } from "@/lib/image-resize";
import { applyBranding, DECORATION_LABEL, DECORATIONS, FONT_LABEL, getTemplate, type FontKey } from "@/lib/themes";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = ["#0D7377", "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0891B2", "#111827"];

/**
 * Brand settings applied to every invoice: colour, font, ornament, logo
 * watermark, signature + stamp and closing line — with a live preview.
 */
export default function BrandingEditor({
  value,
  onChange,
  logo,
  templateId,
  previewInvoice,
}: {
  value: InvoiceBranding;
  onChange: (patch: Partial<InvoiceBranding>) => void;
  logo: string;
  templateId: string;
  previewInvoice?: Invoice;
}) {
  const [padOpen, setPadOpen] = useState(false);
  const [busy, setBusy] = useState<"signature" | "stamp" | null>(null);
  const sigInput = useRef<HTMLInputElement>(null);
  const stampInput = useRef<HTMLInputElement>(null);

  const invoice = useMemo(() => previewInvoice ?? { ...sampleInvoice("Sent"), theme: templateId }, [previewInvoice, templateId]);
  const baseTemplate = getTemplate(invoice.theme || templateId);

  const upload = async (file: File | undefined, key: "signature" | "stamp") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Pilih file gambar");
    setBusy(key);
    try {
      const size = key === "signature" ? { width: 600, height: 240 } : { width: 320, height: 320 };
      onChange({ [key]: await resizeImageFile(file, { ...size, mode: "contain", type: "image/png" }) });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pickFromLogo = async () => {
    const color = await dominantColor(logo);
    if (color) {
      onChange({ color });
      toast.success(`Warna ${color} diambil dari logo`);
    } else toast.error("Tidak menemukan warna yang jelas di logo");
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        {/* colour */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-foreground/80">Warna brand</p>
            <Switch
              checked={Boolean(value.color)}
              onChange={(on) => onChange({ color: on ? baseTemplate.colors.accent : "" })}
              label={<span className="text-xs text-muted-foreground">{value.color ? "Dipakai" : "Ikuti template"}</span>}
            />
          </div>
          {value.color && (
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => onChange({ color: c })}
                  className={cn(
                    "size-8 rounded-full ring-offset-2 ring-offset-background transition hover:scale-110",
                    value.color.toUpperCase() === c && "ring-2 ring-foreground"
                  )}
                  style={{ background: c }}
                />
              ))}
              <label className="flex items-center gap-1.5 rounded-xl border border-border p-1 pr-2">
                <input
                  type="color"
                  value={value.color}
                  onChange={(e) => onChange({ color: e.target.value.toUpperCase() })}
                  className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  aria-label="Pilih warna sendiri"
                />
                <span className="font-mono text-xs uppercase">{value.color}</span>
              </label>
              {logo && (
                <Button type="button" variant="outline" size="sm" onClick={pickFromLogo}>
                  <Pipette className="size-3.5" /> Ambil dari logo
                </Button>
              )}
            </div>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">Warna ini menggantikan warna template mana pun yang Anda pilih.</p>
        </div>

        {/* ornament */}
        <div>
          <p className="mb-2 text-[13px] font-medium text-foreground/80">Ornamen halaman</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {(["", ...DECORATIONS] as const).map((d) => {
              const active = value.decoration === d;
              const preview = applyBranding(baseTemplate, { ...value, decoration: d || baseTemplate.decoration });
              return (
                <button
                  key={d || "template"}
                  type="button"
                  onClick={() => onChange({ decoration: d })}
                  className={cn(
                    "rounded-xl border bg-card p-1 text-left transition-all",
                    active ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-foreground/25"
                  )}
                >
                  <TemplateThumb template={preview} />
                  <span className="mt-1 block truncate px-0.5 text-[11px] font-medium">{d ? DECORATION_LABEL[d] : "Ikuti template"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Huruf">
            <NativeSelect value={value.font} onChange={(e) => onChange({ font: e.target.value })}>
              <option value="">Ikuti template</option>
              {(Object.keys(FONT_LABEL) as FontKey[]).map((f) => (
                <option key={f} value={f}>
                  {FONT_LABEL[f]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Watermark logo" hint={logo ? "Logo samar di tengah halaman" : "Unggah logo dulu di Profil bisnis"}>
            <div className="flex h-11 items-center md:h-10">
              <Switch checked={value.watermark && !!logo} onChange={(v) => logo && onChange({ watermark: v })} label={value.watermark && logo ? "Aktif" : "Nonaktif"} />
            </div>
          </Field>
        </div>

        {/* signature & stamp */}
        <div className="grid gap-3 sm:grid-cols-2">
          <AssetBox
            label="Tanda tangan"
            image={value.signature}
            busy={busy === "signature"}
            onRemove={() => onChange({ signature: "" })}
            actions={
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => setPadOpen(true)}>
                  <PenLine className="size-3.5" /> Gambar
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => sigInput.current?.click()}>
                  <ImagePlus className="size-3.5" /> Unggah
                </Button>
              </>
            }
          />
          <AssetBox
            label="Stempel / cap"
            image={value.stamp}
            busy={busy === "stamp"}
            onRemove={() => onChange({ stamp: "" })}
            actions={
              <Button type="button" size="sm" variant="outline" onClick={() => stampInput.current?.click()}>
                <ImagePlus className="size-3.5" /> Unggah
              </Button>
            }
          />
          <input ref={sigInput} type="file" accept="image/*" className="hidden" onChange={(e) => (upload(e.target.files?.[0], "signature"), (e.target.value = ""))} />
          <input ref={stampInput} type="file" accept="image/*" className="hidden" onChange={(e) => (upload(e.target.files?.[0], "stamp"), (e.target.value = ""))} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama penanda tangan">
            <Input value={value.signatureName} maxLength={120} onChange={(e) => onChange({ signatureName: e.target.value })} placeholder="Andi Pratama" />
          </Field>
          <Field label="Jabatan">
            <Input value={value.signatureTitle} maxLength={120} onChange={(e) => onChange({ signatureTitle: e.target.value })} placeholder="Owner" />
          </Field>
        </div>
        <Field label="Teks penutup" hint="Kosongkan untuk memakai “Terima kasih atas kepercayaan Anda”.">
          <Input value={value.footerText} maxLength={200} onChange={(e) => onChange({ footerText: e.target.value })} placeholder="Terima kasih telah mempercayakan proyek Anda kepada kami 🙏" />
        </Field>
      </div>

      {/* live preview */}
      <div className="lg:sticky lg:top-20">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
        <ScaledPreview invoice={invoice} logo={logo} branding={value} />
      </div>

      {padOpen && (
        <SignaturePad
          onClose={() => setPadOpen(false)}
          onSave={(dataUrl) => {
            onChange({ signature: dataUrl });
            setPadOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AssetBox({
  label,
  image,
  busy,
  actions,
  onRemove,
}: {
  label: string;
  image: string;
  busy: boolean;
  actions: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 text-[13px] font-medium text-foreground/80">{label}</p>
      <div className="mb-2 grid h-24 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-white">
        {busy ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={label} className="max-h-20 max-w-[90%] object-contain" />
        ) : (
          <span className="text-xs text-zinc-400">Belum ada</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {actions}
        {image && (
          <Button type="button" size="sm" variant="ghost" onClick={onRemove} aria-label={`Hapus ${label}`} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Draw-your-signature pad (mouse, pen or finger). Saves a trimmed transparent PNG. */
function SignaturePad({ onClose, onSave }: { onClose: () => void; onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [ink, setInk] = useState("#1E3A8A");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(e);
    ctx.strokeStyle = ink;
    ctx.lineWidth = e.pressure && e.pointerType === "pen" ? 1.5 + e.pressure * 3 : 2.6;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  };
  const up = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  };

  const save = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let [minX, minY, maxX, maxY] = [width, height, 0, 0];
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
    if (maxX <= minX) return;
    const pad = 8;
    const out = document.createElement("canvas");
    out.width = maxX - minX + pad * 2;
    out.height = maxY - minY + pad * 2;
    out.getContext("2d")!.drawImage(c, minX - pad, minY - pad, out.width, out.height, 0, 0, out.width, out.height);
    // Keep it small: cap the width at 600px.
    const scale = Math.min(1, 600 / out.width);
    const final = document.createElement("canvas");
    final.width = Math.round(out.width * scale);
    final.height = Math.round(out.height * scale);
    final.getContext("2d")!.drawImage(out, 0, 0, final.width, final.height);
    onSave(final.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gambar tanda tangan"
        onClick={(e) => e.stopPropagation()}
        className="pb-safe w-full max-w-lg rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Gambar tanda tangan</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-8 place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="h-48 w-full touch-none rounded-xl border-2 border-dashed border-border bg-white"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["#1E3A8A", "#111111", "#0F766E"].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Tinta ${c}`}
              onClick={() => setInk(c)}
              className={cn("size-7 rounded-full ring-offset-2 ring-offset-card", ink === c && "ring-2 ring-foreground")}
              style={{ background: c }}
            />
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="ml-auto">
            <Eraser className="size-3.5" /> Hapus
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={empty}>
            Pakai tanda tangan
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Most common saturated colour in an image (ignores white, black, grey and transparent pixels). */
function dominantColor(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 128 || Math.max(r, g, b) - Math.min(r, g, b) < 40 || Math.max(r, g, b) < 40) continue;
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
        const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        bucket.n++;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        buckets.set(key, bucket);
      }
      const best = [...buckets.values()].sort((x, y) => y.n - x.n)[0];
      if (!best) return resolve(null);
      const hex = [best.r, best.g, best.b].map((v) => Math.round(v / best.n).toString(16).padStart(2, "0")).join("");
      resolve(`#${hex}`.toUpperCase());
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
