"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Copy, KeyRound, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import { setUserDisabledAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/invoice";
import type { AdminUserRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "disabled" | "admin";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "disabled", label: "Nonaktif" },
  { value: "admin", label: "Admin" },
];

const dateOnly = (iso: string | null) => (iso ? formatDate(iso.slice(0, 10)) : "Belum pernah");

export default function AdminUsers({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [pending, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      (filter === "all" ||
        (filter === "active" && !u.disabled) ||
        (filter === "disabled" && u.disabled) ||
        (filter === "admin" && u.role === "admin")) &&
      (!q || u.email.includes(q) || u.name.toLowerCase().includes(q))
  );
  const counts: Record<Filter, number> = {
    all: users.length,
    active: users.filter((u) => !u.disabled).length,
    disabled: users.filter((u) => u.disabled).length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const toggle = (u: AdminUserRow, active: boolean) =>
    startTransition(async () => {
      const res = await setUserDisabledAction(u.id, !active);
      if (!res.ok) return void toast.error(res.error);
      toast.success(active ? `${u.email} diaktifkan` : `${u.email} dinonaktifkan dan dikeluarkan dari semua perangkat`);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau email…" className="pl-10" />
        </div>
        <div className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
              )}
            >
              {f.label} <span className="ml-1 opacity-60">{counts[f.value]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_80px_120px_120px_minmax(0,1.4fr)] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:grid">
          <span>Pengguna</span>
          <span className="text-right">Invoice</span>
          <span>Bergabung</span>
          <span>Login terakhir</span>
          <span className="text-right">Aksi</span>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <li
                key={u.id}
                className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,2.2fr)_80px_120px_120px_minmax(0,1.4fr)] lg:items-center lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold uppercase",
                      u.disabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}
                  >
                    {(u.name || u.email).charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      <span className="truncate">{u.name || "Tanpa nama"}</span>
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <ShieldCheck className="size-3" /> ADMIN
                        </span>
                      )}
                      {u.disabled && (
                        <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">NONAKTIF</span>
                      )}
                    </p>
                    <CopyEmail email={u.email} />
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground lg:contents">
                  <span className="lg:text-right lg:text-sm">
                    <span className="font-semibold text-foreground tabular-nums">{u.invoiceCount}</span>
                    <span className="lg:hidden"> invoice</span>
                  </span>
                  <span className="lg:text-sm">
                    <span className="lg:hidden">Gabung </span>
                    {dateOnly(u.createdAt)}
                  </span>
                  <span className="lg:text-sm">
                    <span className="lg:hidden">Login </span>
                    {dateOnly(u.lastLoginAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  {isMe ? (
                    <span className="text-xs text-muted-foreground">Akun Anda</span>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setResetTarget(u)}>
                        <KeyRound className="size-3.5" /> Reset password
                      </Button>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground" title={u.disabled ? "Aktifkan" : "Nonaktifkan"}>
                        <Switch checked={!u.disabled} onChange={(on) => !pending && toggle(u, on)} />
                      </label>
                    </>
                  )}
                  <Link
                    href={`/admin/users/${u.id}`}
                    aria-label={`Detail ${u.email}`}
                    className="ml-auto grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:ml-0"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</li>}
        </ul>
      </div>

      {resetTarget && <ResetPasswordDialog key={resetTarget.id} user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          toast.error("Gagal menyalin");
        }
      }}
      title="Salin email"
      className="group flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <span className="truncate">{email}</span>
      {copied ? <Check className="size-3.5 shrink-0 text-emerald-500" /> : <Copy className="size-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />}
    </button>
  );
}
