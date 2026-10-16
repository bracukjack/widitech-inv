"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/form";
import { setUserDisabledAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/invoice";
import type { AdminUserRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const dateOnly = (iso: string | null) => (iso ? formatDate(iso.slice(0, 10)) : "—");

export default function AdminUsers({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const stats = useMemo(
    () => [
      { label: "Total pengguna", value: users.length },
      { label: "Aktif", value: users.filter((u) => !u.disabled).length },
      { label: "Total invoice", value: users.reduce((s, u) => s + u.invoiceCount, 0) },
    ],
    [users]
  );

  const q = query.trim().toLowerCase();
  const filtered = users.filter((u) => !q || u.email.includes(q) || u.name.toLowerCase().includes(q));

  const toggle = (id: string, disabled: boolean) =>
    startTransition(async () => {
      const res = await setUserDisabledAction(id, disabled);
      if (!res.ok) return void toast.error(res.error);
      toast.success(disabled ? "Pengguna dinonaktifkan dan dikeluarkan dari semua perangkat" : "Pengguna diaktifkan");
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau email…" className="pl-10" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="hidden grid-cols-[minmax(0,2fr)_100px_130px_130px_110px_24px] gap-4 border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
          <span>Pengguna</span>
          <span className="text-right">Invoice</span>
          <span>Bergabung</span>
          <span>Login terakhir</span>
          <span>Aktif</span>
          <span />
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <li
                key={u.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_100px_130px_130px_110px_24px]",
                  u.disabled && "opacity-60"
                )}
              >
                <Link href={`/admin/users/${u.id}`} className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold uppercase">
                    {(u.name || u.email).charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      {u.name || "Tanpa nama"}
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <ShieldCheck className="size-3" /> ADMIN
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                  </span>
                </Link>
                <span className="text-right text-sm tabular-nums md:block">
                  <span className="font-semibold">{u.invoiceCount}</span>
                  <span className="text-muted-foreground md:hidden"> invoice</span>
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">{dateOnly(u.createdAt)}</span>
                <span className="hidden text-sm text-muted-foreground md:block">{dateOnly(u.lastLoginAt)}</span>
                <span className="col-span-2 flex items-center justify-between md:col-span-1 md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Login terakhir {dateOnly(u.lastLoginAt)}</span>
                  {isMe ? (
                    <span className="text-xs text-muted-foreground">Anda</span>
                  ) : (
                    <Switch checked={!u.disabled} onChange={(on) => !pending && toggle(u.id, !on)} />
                  )}
                </span>
                <Link href={`/admin/users/${u.id}`} aria-label="Detail" className="hidden text-muted-foreground md:block">
                  <ChevronRight className="size-4" />
                </Link>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Tidak ada pengguna.</li>}
        </ul>
      </div>
    </div>
  );
}
