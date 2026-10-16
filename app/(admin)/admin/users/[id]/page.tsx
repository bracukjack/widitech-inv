import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { getUserWithInvoices } from "@/lib/admin-data";
import { requireAdminPage } from "@/lib/auth";
import UserActions from "@/components/admin/UserActions";
import { CopyEmail } from "@/components/admin/AdminUsers";
import { calculateTotals, displayStatus, formatCurrency, formatDate } from "@/lib/invoice";
import { StatusBadge } from "@/components/invoice-ui";

export const metadata = { title: "Detail pengguna — Admin" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const result = await getUserWithInvoices(id);
  if (!result) notFound();
  const { user, invoices } = result;

  return (
    <div className="space-y-4">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Semua pengguna
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold">{user.name || "Tanpa nama"}</p>
            <CopyEmail email={user.email} />
          </div>
          {user.id !== admin.id && <UserActions user={user} />}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label="Peran" value={user.role === "admin" ? "Admin" : "Pengguna"} />
          <Info label="Status" value={user.disabled ? "Nonaktif" : "Aktif"} />
          <Info label="Bergabung" value={formatDate(user.createdAt.slice(0, 10))} />
          <Info label="Login terakhir" value={user.lastLoginAt ? formatDate(user.lastLoginAt.slice(0, 10)) : "—"} />
        </dl>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold">{invoices.length} invoice</p>
        {invoices.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada invoice.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{inv.clientName || "Tanpa nama"}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    #{inv.invoiceNumber} · {formatDate(inv.invoiceDate)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{formatCurrency(calculateTotals(inv).total, inv.currency)}</span>
                  <StatusBadge status={displayStatus(inv)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
