"use client";

import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/financeStore";
import { useProjectStore } from "@/lib/projectStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR, EXPENSE_CATEGORY_CONFIG } from "@/lib/constants";
import { ExpenseCategory, Expense } from "@/types";
import { ExpenseFormData } from "@/lib/schemas";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import ExpenseForm from "@/components/ExpenseForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import FinanceSkeleton from "@/components/skeletons/FinanceSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { showCreated, showUpdated, showDeleted } from "@/lib/toasts";

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#ec4899', '#06b6d4', '#f43f5e', '#8b5cf6'];

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">("all");

  const expenses = useFinanceStore((s) => s.expenses).filter((e) => !e.isDeleted);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const softDeleteExpense = useFinanceStore((s) => s.softDeleteExpense);
  const restoreExpense = useFinanceStore((s) => s.restoreExpense);
  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);

  useEffect(() => {
    seedAllData();
    useFinanceStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return <FinanceSkeleton />;

  const currentYear = new Date().getFullYear();

  // Calculate revenue from projects (DP + final payments)
  const totalRevenueYTD = projects.reduce((sum, p) => {
    let rev = 0;
    if (p.dpPaid && p.dpPaidDate) {
      const d = new Date(p.dpPaidDate);
      if (d.getFullYear() === currentYear) rev += p.dpAmount;
    }
    if (p.finalPaid && p.finalPaidDate) {
      const d = new Date(p.finalPaidDate);
      if (d.getFullYear() === currentYear) rev += p.contractValue - p.dpAmount;
    }
    return sum + rev;
  }, 0);

  const totalExpensesYTD = expenses
    .filter((e) => new Date(e.date).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevenueYTD - totalExpensesYTD;
  const taxEstimate = Math.max(0, netProfit * 0.1);

  // Monthly data for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((month, i) => {
    const monthRevenue = projects.reduce((sum, p) => {
      let rev = 0;
      if (p.dpPaid && p.dpPaidDate) {
        const d = new Date(p.dpPaidDate);
        if (d.getFullYear() === currentYear && d.getMonth() === i) rev += p.dpAmount;
      }
      if (p.finalPaid && p.finalPaidDate) {
        const d = new Date(p.finalPaidDate);
        if (d.getFullYear() === currentYear && d.getMonth() === i) rev += p.contractValue - p.dpAmount;
      }
      return sum + rev;
    }, 0);
    const monthExpenses = expenses
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === currentYear && d.getMonth() === i; })
      .reduce((sum, e) => sum + e.amount, 0);
    return { month, revenue: monthRevenue, expenses: monthExpenses };
  });

  // Revenue by category
  const categoryRevenue = projects.reduce((acc, p) => {
    if (!p.dpPaid && !p.finalPaid) return acc;
    const cat = p.category;
    const rev = (p.dpPaid ? p.dpAmount : 0) + (p.finalPaid ? p.contractValue - p.dpAmount : 0);
    acc[cat] = (acc[cat] || 0) + rev;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryRevenue).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  const filteredExpenses = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const handleCreate = (data: ExpenseFormData) => {
    addExpense(data);
    showCreated("Expense");
  };

  const handleEdit = (data: ExpenseFormData) => {
    if (!editExpense) return;
    updateExpense(editExpense.id, data);
    showUpdated("Expense");
    setEditExpense(null);
  };

  const handleDelete = (expense: Expense) => {
    softDeleteExpense(expense.id);
    showDeleted("Expense", () => restoreExpense(expense.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Finance</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your revenue and expenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="size-4 text-green-600" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Revenue YTD</span>
          </div>
          <p className="text-[26px] font-semibold font-mono tracking-[-0.5px] text-green-600">{formatIDR(totalRevenueYTD)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="size-4 text-red-600" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Expenses YTD</span>
          </div>
          <p className="text-[26px] font-semibold font-mono tracking-[-0.5px] text-red-600">{formatIDR(totalExpensesYTD)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="size-4 text-blue-600" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Net Profit YTD</span>
          </div>
          <p className={`text-[26px] font-semibold font-mono tracking-[-0.5px] ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIDR(netProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-[18px] min-h-[88px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Receipt className="size-4 text-amber-600" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Tax Estimate (10%)</span>
          </div>
          <p className="text-[26px] font-semibold font-mono tracking-[-0.5px] text-amber-600">{formatIDR(taxEstimate)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses ({currentYear})</h3>
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
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue by Category</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No revenue data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatIDR(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Expenses</h2>
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | "all")}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
            >
              <option value="all">All Categories</option>
              {(Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => setShowAddExpense(true)}>
              <Plus className="size-3.5 mr-1" /> Add Expense
            </Button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No expenses recorded"
            description="Start tracking your business expenses"
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-[11px] uppercase tracking-wider font-medium text-muted-foreground px-4 py-2.5">Date</th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-medium text-muted-foreground px-4 py-2.5">Category</th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-medium text-muted-foreground px-4 py-2.5">Description</th>
                  <th className="text-right text-[11px] uppercase tracking-wider font-medium text-muted-foreground px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {EXPENSE_CATEGORY_CONFIG[expense.category].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{expense.description}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-mono font-medium text-red-600">{formatIDR(expense.amount)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditExpense(expense)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(expense)} className="text-muted-foreground hover:text-red-600 transition-colors p-1">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-border flex justify-end">
              <span className="text-sm font-medium">Total: <span className="font-mono text-red-600">{formatIDR(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</span></span>
            </div>
          </>
        )}
      </div>

      {/* Create Expense Form */}
      <ExpenseForm
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Expense Form */}
      {editExpense && (
        <ExpenseForm
          open={!!editExpense}
          onOpenChange={(open) => { if (!open) setEditExpense(null); }}
          onSubmit={handleEdit}
          defaultValues={{
            category: editExpense.category,
            description: editExpense.description,
            amount: editExpense.amount,
            date: editExpense.date,
          }}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete this expense?"
        description="This expense will be moved to trash. You can restore it later."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}
