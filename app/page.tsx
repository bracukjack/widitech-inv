"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getInvoices, ensureSampleData } from "@/lib/invoiceStore";
import { Invoice as LegacyInvoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import { calculateTotals } from "@/components/InvoicePreview";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useFinanceStore } from "@/lib/financeStore";
import { useTimeStore } from "@/lib/timeStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR } from "@/lib/constants";
import { STATUS_CONFIG } from "@/lib/constants";
import { differenceInDays, format } from "date-fns";
import {
  FileText,
  DollarSign,
  FolderKanban,
  TrendingUp,
  FilePlus,
  Plus,
  Clock,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<LegacyInvoice[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const projects = useProjectStore((s) => s.projects);
  const clients = useClientStore((s) => s.clients);
  const expenses = useFinanceStore((s) => s.expenses);

  useEffect(() => {
    ensureSampleData();
    seedAllData();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    useFinanceStore.persist.rehydrate();
    useTimeStore.persist.rehydrate();
    setInvoices(getInvoices());
    setMounted(true);
  }, []);

  if (!mounted) return <DashboardSkeleton />;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Revenue from paid projects this month
  const paidProjects = projects.filter(
    (p) => p.finalPaid && p.finalPaidDate
  );
  const monthRevenue = paidProjects.reduce((sum, p) => {
    const pd = p.finalPaidDate ? new Date(p.finalPaidDate) : null;
    if (pd && pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
      return sum + p.contractValue;
    }
    return sum;
  }, 0);
  // Add DP payments this month
  const dpThisMonth = projects.reduce((sum, p) => {
    if (p.dpPaid && p.dpPaidDate) {
      const pd = new Date(p.dpPaidDate);
      if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) return sum + p.dpAmount;
    }
    return sum;
  }, 0);
  const totalRevMonth = monthRevenue + dpThisMonth;

  const activeProjects = projects.filter(
    (p) => !['done', 'cancelled', 'lead'].includes(p.status)
  );

  const pinnedProjects = projects.filter((p) => p.isPinned && !p.isDeleted);

  const unpaidInvoices = invoices.filter((i) => i.status !== "Paid");
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => {
    const { total } = calculateTotals(inv);
    return sum + total;
  }, 0);

  const monthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevMonth - monthExpenses;

  // Top 5 active projects sorted by deadline proximity
  const sortedActive = [...activeProjects].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  ).slice(0, 5);

  // Upcoming deadlines (next 30 days)
  const upcoming = projects
    .filter((p) => {
      if (['done', 'cancelled'].includes(p.status)) return false;
      const diff = differenceInDays(new Date(p.deadline), now);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getClientName = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    return c?.name || 'Unknown';
  };

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-8">
      {/* Header + Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overview of your business activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects"><Button variant="outline" size="sm"><Plus className="size-3.5 mr-1" />Project</Button></Link>
          <Link href="/invoice/new"><Button variant="outline" size="sm"><FilePlus className="size-3.5 mr-1" />Invoice</Button></Link>
          <Link href="/time-tracker"><Button variant="outline" size="sm"><Clock className="size-3.5 mr-1" />Log Time</Button></Link>
          <Link href="/finance"><Button variant="outline" size="sm"><Receipt className="size-3.5 mr-1" />Expense</Button></Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Revenue This Month</span>
          </div>
          <p className="text-[26px] font-semibold text-foreground font-mono tracking-[-0.5px]">{formatIDR(totalRevMonth)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FolderKanban className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Active Projects</span>
          </div>
          <p className="text-[26px] font-semibold text-foreground font-mono tracking-[-0.5px]">{activeProjects.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FileText className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Unpaid Invoices</span>
          </div>
          <p className="text-[26px] font-semibold text-foreground font-mono tracking-[-0.5px]">{unpaidInvoices.length}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{formatIDR(unpaidTotal)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Net Profit This Month</span>
          </div>
          <p className={`text-[26px] font-semibold font-mono tracking-[-0.5px] ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatIDR(netProfit)}
          </p>
        </div>
      </div>

      {/* Pinned Projects */}
      {pinnedProjects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            📌 Pinned Projects <span className="text-muted-foreground font-normal">({pinnedProjects.length})</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin">
            {pinnedProjects.map((project) => {
              const status = STATUS_CONFIG[project.status];
              const daysLeft = differenceInDays(new Date(project.deadline), now);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="min-w-[280px] max-w-[320px] shrink-0 snap-start bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {project.category}
                  </span>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{project.progress}%</span>
                  </div>
                  <p className={`text-xs mt-2 ${daysLeft < 7 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Active Projects (60%) */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Active Projects</h2>
            <Link href="/projects"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          {sortedActive.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="Create your first project to get started"
              action={{ label: "Go to Projects", onClick: () => router.push("/projects") }}
              size="sm"
            />
          ) : (
            <div className="divide-y divide-border">
              {sortedActive.map((project) => {
                const daysLeft = differenceInDays(new Date(project.deadline), now);
                const isUrgent = daysLeft < 7;
                const status = STATUS_CONFIG[project.status];
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{getClientName(project.clientId)}</p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{project.progress}%</span>
                      </div>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">{formatIDR(project.contractValue)}</p>
                      <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">Upcoming Deadlines</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No deadlines in the next 30 days</div>
            ) : (
              <div className="divide-y divide-border">
                {upcoming.slice(0, 5).map((p) => {
                  const daysLeft = differenceInDays(new Date(p.deadline), now);
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.deadline), 'MMM dd, yyyy')}</p>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ml-2 ${daysLeft < 7 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {daysLeft}d
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">Recent Invoices</h2>
              <Link href="/invoices"><Button variant="ghost" size="sm" className="text-xs">View All</Button></Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No invoices yet</div>
            ) : (
              <div className="divide-y divide-border">
                {recentInvoices.map((inv) => {
                  const { total } = calculateTotals(inv);
                  return (
                    <Link key={inv.id} href={`/invoice/${inv.id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{inv.clientName || 'No client'}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-mono font-medium text-foreground">{formatCurrency(total, inv.currency)}</p>
                        <span className={`text-xs font-medium ${inv.status === 'Paid' ? 'text-green-600' : inv.status === 'Sent' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {inv.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Alert */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Unpaid Invoices</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  You have {unpaidInvoices.length} unpaid invoice(s) totaling {formatIDR(unpaidTotal)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
