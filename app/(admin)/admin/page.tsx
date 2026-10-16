import Link from "next/link";
import { ArrowRight, FileText, UserCheck, UserPlus, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { getAdminOverview } from "@/lib/admin-data";
import { calculateTotals, displayStatus, formatCurrency, formatDate } from "@/lib/invoice";
import { StatusBadge } from "@/components/invoice-ui";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Ringkasan — Admin" };

export default async function AdminOverviewPage() {
  const admin = await requireAdminPage();
  const o = await getAdminOverview();

  const stats = [
    { label: "Total pengguna", value: o.users.total, sub: `${o.users.active} aktif`, icon: Users, href: "/admin/users" },
    { label: "Daftar 7 hari terakhir", value: o.users.newThisWeek, sub: "pengguna baru", icon: UserPlus, href: "/admin/users" },
    { label: "Login 7 hari terakhir", value: o.users.activeThisWeek, sub: "pengguna aktif", icon: UserCheck, href: "/admin/users" },
    { label: "Total invoice", value: o.invoices.total, sub: `${o.invoices.thisMonth} bulan ini · ${o.invoices.paid} lunas`, icon: FileText },
  ];

  return (
    <>
      <PageHeader title={`Halo, ${admin.name.split(" ")[0] || "Admin"} 👋`} description="Ringkasan aktivitas website Anda." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{s.value}</p>
              <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title="Pendaftar terbaru" href="/admin/users">
          {o.recentUsers.length === 0 ? (
            <Empty text="Belum ada pengguna." />
          ) : (
            <ul className="divide-y divide-border">
              {o.recentUsers.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold uppercase">
                      {(u.name || u.email).charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{u.name || "Tanpa nama"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(u.createdAt.slice(0, 10))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Invoice terbaru">
          {o.recentInvoices.length === 0 ? (
            <Empty text="Belum ada invoice." />
          ) : (
            <ul className="divide-y divide-border">
              {o.recentInvoices.map(({ invoice: inv, email, userId }) => (
                <li key={inv.id}>
                  <Link href={`/admin/users/${userId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {inv.clientName || "Tanpa nama"} <span className="font-normal text-muted-foreground">· #{inv.invoiceNumber}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">oleh {email}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(calculateTotals(inv).total, inv.currency)}</span>
                      <StatusBadge status={displayStatus(inv)} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Lihat semua <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
