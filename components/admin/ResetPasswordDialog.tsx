"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Segmented } from "@/components/ui/form";
import { resetUserPasswordAction } from "@/lib/actions/admin";

interface Target {
  id: string;
  email: string;
  name: string;
}

/** Lets the admin set or generate a new password for a user, then shows it once to copy. */
export default function ResetPasswordDialog({ user, onClose }: { user: Target | null; onClose: () => void }) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<"password" | "message" | null>(null);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, busy, onClose]);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await resetUserPasswordAction(user.id, mode === "auto" ? null : manual);
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    setResult(res.data.password);
    toast.success("Password berhasil direset");
  };

  const copy = async (what: "password" | "message") => {
    const text =
      what === "password"
        ? result!
        : `Halo ${user.name || ""},\n\nPassword akun Anda sudah direset.\nEmail: ${user.email}\nPassword baru: ${result}\n\nSilakan login lalu ganti password di menu Pengaturan.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        onClick={(e) => e.stopPropagation()}
        className="pb-safe w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="reset-title" className="font-semibold">
              Reset password
            </h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Tutup" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/40">
              <p className="text-xs text-muted-foreground">Password baru</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-semibold tracking-wide break-all">{result}</code>
                <Button type="button" size="icon-sm" variant="outline" onClick={() => copy("password")} aria-label="Salin password">
                  {copied === "password" ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Password hanya ditampilkan sekali. Pengguna sudah dikeluarkan dari semua perangkat dan harus login dengan password ini.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => copy("message")}>
                {copied === "message" ? <Check className="size-4" /> : <Copy className="size-4" />} Salin pesan untuk user
              </Button>
              <Button type="button" className="flex-1" onClick={onClose}>
                Selesai
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Segmented
              className="w-full"
              value={mode}
              onChange={setMode}
              options={[
                { value: "auto", label: "Buat otomatis" },
                { value: "manual", label: "Tentukan sendiri" },
              ]}
            />
            {mode === "manual" ? (
              <Field label="Password baru" hint="Minimal 8 karakter">
                <Input type="text" autoComplete="off" value={manual} onChange={(e) => setManual(e.target.value)} minLength={8} autoFocus />
              </Field>
            ) : (
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                Sistem membuat password acak 12 karakter yang mudah dibaca. Anda bisa menyalinnya setelah reset.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={busy || (mode === "manual" && manual.length < 8)}>
                {busy && <Loader2 className="size-4 animate-spin" />} Reset password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
