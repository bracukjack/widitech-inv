"use client";

import { useEffect, useState, useMemo } from "react";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useFinanceStore } from "@/lib/financeStore";
import { useTimeStore } from "@/lib/timeStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR, STATUS_CONFIG, CATEGORY_CONFIG } from "@/lib/constants";
import { ProjectCategory, ProjectStatus } from "@/types";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfQuarter, endOfQuarter } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/layout/Breadcrumb";

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#ec4899', '#06b6d4', '#f43f5e', '#8b5cf6'];

type DateRange = 'this-month' | 'last-month' | 'this-quarter' | 'this-year';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('this-year');

  const projects = useProjectStore((s) => s.projects);
  const clients = useClientStore((s) => s.clients);
  const expenses = useFinanceStore((s) => s.expenses);
  const timeLogs = useTimeStore((s) => s.timeLogs);

  useEffect(() => {
    seedAllData();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    useFinanceStore.persist.rehydrate();
    useTimeStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'this-month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this-quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'this-year': return { start: startOfYear(now), end: endOfYear(now) };
    }
  }, [dateRange]);

  if (!mounted) return null;

  const currentYear = new Date().getFullYear();

  // Financial report
  const totalRevenue = projects.reduce((sum, p) => {
    let rev = 0;
    if (p.dpPaid && p.dpPaidDate) {
      const d = new Date(p.dpPaidDate);
      if (d >= dateFilter.start && d <= dateFilter.end) rev += p.dpAmount;
    }
    if (p.finalPaid && p.finalPaidDate) {
      const d = new Date(p.finalPaidDate);
      if (d >= dateFilter.start && d <= dateFilter.end) rev += p.contractValue - p.dpAmount;
    }
    return sum + rev;
  }, 0);

  const totalExpenses = expenses
    .filter((e) => { const d = new Date(e.date); return d >= dateFilter.start && d <= dateFilter.end; })
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((month, i) => {
    const rev = projects.reduce((sum, p) => {
      let r = 0;
      if (p.dpPaid && p.dpPaidDate) {
        const d = new Date(p.dpPaidDate);
        if (d.getFullYear() === currentYear && d.getMonth() === i) r += p.dpAmount;
      }
      if (p.finalPaid && p.finalPaidDate) {
        const d = new Date(p.finalPaidDate);
        if (d.getFullYear() === currentYear && d.getMonth() === i) r += p.contractValue - p.dpAmount;
      }
      return sum + r;
    }, 0);
    const exp = expenses
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === currentYear && d.getMonth() === i; })
      .reduce((sum, e) => sum + e.amount, 0);
    return { month, revenue: rev, expenses: exp, profit: rev - exp };
  });

  // Project report
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPieData = Object.entries(statusCounts).map(([key, value]) => ({
    name: STATUS_CONFIG[key as ProjectStatus]?.label || key,
    value,
  }));

  const avgProjectValue = projects.length > 0
    ? projects.reduce((sum, p) => sum + p.contractValue, 0) / projects.length
    : 0;

  const doneProjects = projects.filter((p) => p.status === 'done');
  const onTimeDelivery = doneProjects.length > 0
    ? (doneProjects.filter((p) => p.deliveredDate && new Date(p.deliveredDate) <= new Date(p.deadline)).length / doneProjects.length) * 100
    : 0;

  // Category profitability
  const categoryData = (Object.keys(CATEGORY_CONFIG) as ProjectCategory[]).map((cat) => {
    const catProjects = projects.filter((p) => p.category === cat);
    const catRevenue = catProjects.reduce((sum, p) => sum + p.contractValue, 0);
    return { name: CATEGORY_CONFIG[cat].label, value: catRevenue };
  }).filter((d) => d.value > 0);

  // Client report
  const clientRevenue = clients.map((c) => {
    const cProjects = projects.filter((p) => p.clientId === c.id);
    const rev = cProjects.reduce((sum, p) => {
      return sum + (p.dpPaid ? p.dpAmount : 0) + (p.finalPaid ? p.contractValue - p.dpAmount : 0);
    }, 0);
    return { name: c.name, revenue: rev };
  }).sort((a, b) => b.revenue - a.revenue);

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Reports" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Business analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="this-year">This Year</option>
          </select>
        </div>
      </div>

      {/* Financial Report */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Financial Report</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="text-lg font-bold font-mono text-green-600">{formatIDR(totalRevenue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-bold font-mono text-red-600">{formatIDR(totalExpenses)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
            <p className={`text-lg font-bold font-mono ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIDR(netProfit)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Profit Margin</p>
            <p className={`text-lg font-bold font-mono ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Month-by-Month Breakdown</h3>
            <Button size="sm" variant="outline" onClick={() => exportCSV(monthlyData.map((m) => ({ ...m })), 'financial-report')}>
              <Download className="size-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => formatIDR(Number(value))} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
          {/* Monthly table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-2">Month</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-2">Revenue</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-2">Expenses</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-2">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyData.filter((m) => m.revenue > 0 || m.expenses > 0).map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 text-foreground">{m.month}</td>
                    <td className="py-2 text-right font-mono text-green-600">{formatIDR(m.revenue)}</td>
                    <td className="py-2 text-right font-mono text-red-600">{formatIDR(m.expenses)}</td>
                    <td className={`py-2 text-right font-mono font-medium ${m.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIDR(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Report */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Project Report</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Projects by Status</h3>
            {statusPieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No project data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Project Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Projects</span>
                <span className="font-bold">{projects.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Project Value</span>
                <span className="font-mono font-medium">{formatIDR(avgProjectValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">On-Time Delivery Rate</span>
                <span className="font-mono font-medium">{onTimeDelivery.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed Projects</span>
                <span className="font-bold">{doneProjects.length}</span>
              </div>
            </div>
            {categoryData.length > 0 && (
              <>
                <h4 className="font-medium text-foreground text-sm pt-2 border-t border-border">Revenue by Category</h4>
                <div className="space-y-2">
                  {categoryData.map((c) => (
                    <div key={c.name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="font-mono font-medium">{formatIDR(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Client Report */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Client Report</h2>
          <Button size="sm" variant="outline" onClick={() => exportCSV(
            projects.map((p) => ({
              name: p.name,
              client: clients.find((c) => c.id === p.clientId)?.name || 'Unknown',
              category: p.category,
              status: p.status,
              value: p.contractValue,
              progress: p.progress,
              deadline: p.deadline,
            })),
            'project-report'
          )}>
            <Download className="size-3.5 mr-1" /> Export Projects CSV
          </Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Clients by Revenue</h3>
          {clientRevenue.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No client data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clientRevenue.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={120} />
                <Tooltip formatter={(value) => formatIDR(Number(value))} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
