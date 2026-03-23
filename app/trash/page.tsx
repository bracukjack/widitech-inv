"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useFinanceStore } from "@/lib/financeStore";
import { useTimeStore } from "@/lib/timeStore";
import {
  getDeletedInvoices,
  restoreInvoice,
  permanentDeleteInvoice,
} from "@/lib/invoiceStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR } from "@/lib/constants";
import { Invoice } from "@/types/invoice";
import { format } from "date-fns";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FolderKanban,
  Users,
  DollarSign,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { showRestored, showPermanentlyDeleted } from "@/lib/toasts";

type TabId = "projects" | "clients" | "expenses" | "timelogs" | "invoices";

export default function TrashPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [permanentTarget, setPermanentTarget] = useState<{ type: TabId; id: string; label: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Project store
  const deletedProjects = useProjectStore((s) => s.getDeleted)();
  const restoreProject = useProjectStore((s) => s.restore);
  const permanentDeleteProject = useProjectStore((s) => s.permanentDelete);

  // Client store
  const deletedClients = useClientStore((s) => s.getDeleted)();
  const restoreClient = useClientStore((s) => s.restore);
  const permanentDeleteClient = useClientStore((s) => s.permanentDelete);

  // Finance store
  const deletedExpenses = useFinanceStore((s) => s.getDeletedExpenses)();
  const restoreExpense = useFinanceStore((s) => s.restoreExpense);
  const permanentDeleteExpense = useFinanceStore((s) => s.permanentDeleteExpense);

  // Time store
  const deletedTimeLogs = useTimeStore((s) => s.getDeleted)();
  const restoreTimeLog = useTimeStore((s) => s.restore);
  const permanentDeleteTimeLog = useTimeStore((s) => s.permanentDelete);

  useEffect(() => {
    seedAllData();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    useFinanceStore.persist.rehydrate();
    useTimeStore.persist.rehydrate();
    setInvoices(getDeletedInvoices());
    setMounted(true);
  }, []);

  const refreshInvoices = () => setInvoices(getDeletedInvoices());

  if (!mounted) return null;

  const tabs: { id: TabId; label: string; icon: typeof Trash2; count: number }[] = [
    { id: "projects", label: "Projects", icon: FolderKanban, count: deletedProjects.length },
    { id: "clients", label: "Clients", icon: Users, count: deletedClients.length },
    { id: "expenses", label: "Expenses", icon: DollarSign, count: deletedExpenses.length },
    { id: "timelogs", label: "Time Logs", icon: Clock, count: deletedTimeLogs.length },
    { id: "invoices", label: "Invoices", icon: FileText, count: invoices.length },
  ];

  const totalDeleted = tabs.reduce((sum, t) => sum + t.count, 0);

  const handleRestore = (type: TabId, id: string, label: string) => {
    switch (type) {
      case "projects": restoreProject(id); break;
      case "clients": restoreClient(id); break;
      case "expenses": restoreExpense(id); break;
      case "timelogs": restoreTimeLog(id); break;
      case "invoices": restoreInvoice(id); refreshInvoices(); break;
    }
    showRestored(label);
  };

  const handlePermanentDelete = () => {
    if (!permanentTarget) return;
    const { type, id, label } = permanentTarget;
    switch (type) {
      case "projects": permanentDeleteProject(id); break;
      case "clients": permanentDeleteClient(id); break;
      case "expenses": permanentDeleteExpense(id); break;
      case "timelogs": permanentDeleteTimeLog(id); break;
      case "invoices": permanentDeleteInvoice(id); refreshInvoices(); break;
    }
    showPermanentlyDeleted(label);
    setPermanentTarget(null);
  };

  const formatDeletedDate = (deletedAt: string | null) =>
    deletedAt ? format(new Date(deletedAt), "MMM dd, yyyy HH:mm") : "—";

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Trash</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {totalDeleted} deleted item{totalDeleted !== 1 ? "s" : ""}. Restore or permanently remove items here.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
            {tab.count > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl">
        {/* Projects */}
        {activeTab === "projects" && (
          deletedProjects.length === 0 ? (
            <EmptyTrash label="projects" />
          ) : (
            <div className="divide-y divide-border">
              {deletedProjects.map((p) => (
                <TrashRow
                  key={p.id}
                  title={p.name}
                  subtitle={`Deleted ${formatDeletedDate(p.deletedAt)}`}
                  onRestore={() => handleRestore("projects", p.id, "Project")}
                  onDelete={() => setPermanentTarget({ type: "projects", id: p.id, label: "Project" })}
                />
              ))}
            </div>
          )
        )}

        {/* Clients */}
        {activeTab === "clients" && (
          deletedClients.length === 0 ? (
            <EmptyTrash label="clients" />
          ) : (
            <div className="divide-y divide-border">
              {deletedClients.map((c) => (
                <TrashRow
                  key={c.id}
                  title={c.name}
                  subtitle={`${c.company || "No company"} · Deleted ${formatDeletedDate(c.deletedAt)}`}
                  onRestore={() => handleRestore("clients", c.id, "Client")}
                  onDelete={() => setPermanentTarget({ type: "clients", id: c.id, label: "Client" })}
                />
              ))}
            </div>
          )
        )}

        {/* Expenses */}
        {activeTab === "expenses" && (
          deletedExpenses.length === 0 ? (
            <EmptyTrash label="expenses" />
          ) : (
            <div className="divide-y divide-border">
              {deletedExpenses.map((e) => (
                <TrashRow
                  key={e.id}
                  title={e.description}
                  subtitle={`${formatIDR(e.amount)} · Deleted ${formatDeletedDate(e.deletedAt)}`}
                  onRestore={() => handleRestore("expenses", e.id, "Expense")}
                  onDelete={() => setPermanentTarget({ type: "expenses", id: e.id, label: "Expense" })}
                />
              ))}
            </div>
          )
        )}

        {/* Time Logs */}
        {activeTab === "timelogs" && (
          deletedTimeLogs.length === 0 ? (
            <EmptyTrash label="time logs" />
          ) : (
            <div className="divide-y divide-border">
              {deletedTimeLogs.map((l) => (
                <TrashRow
                  key={l.id}
                  title={l.description}
                  subtitle={`${(l.duration / 60).toFixed(1)}h · Deleted ${formatDeletedDate(l.deletedAt)}`}
                  onRestore={() => handleRestore("timelogs", l.id, "Time log")}
                  onDelete={() => setPermanentTarget({ type: "timelogs", id: l.id, label: "Time log" })}
                />
              ))}
            </div>
          )
        )}

        {/* Invoices */}
        {activeTab === "invoices" && (
          invoices.length === 0 ? (
            <EmptyTrash label="invoices" />
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <TrashRow
                  key={inv.id}
                  title={inv.invoiceNumber}
                  subtitle={`${inv.clientName || "No client"} · Deleted ${formatDeletedDate(inv.deletedAt)}`}
                  onRestore={() => handleRestore("invoices", inv.id, "Invoice")}
                  onDelete={() => setPermanentTarget({ type: "invoices", id: inv.id, label: "Invoice" })}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Permanent delete confirm */}
      <DeleteConfirmDialog
        open={!!permanentTarget}
        onOpenChange={(open) => { if (!open) setPermanentTarget(null); }}
        title="Permanently delete?"
        description="This action cannot be undone. The item will be removed forever."
        onConfirm={handlePermanentDelete}
        destructive
      />
    </div>
  );
}

function EmptyTrash({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-muted-foreground">
      <Trash2 className="size-10 mx-auto mb-3 text-muted-foreground/30" />
      <p className="font-medium">No deleted {label}</p>
      <p className="text-sm mt-1">Items you delete will appear here</p>
    </div>
  );
}

function TrashRow({
  title,
  subtitle,
  onRestore,
  onDelete,
}: {
  title: string;
  subtitle: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-4">
        <Button size="sm" variant="outline" onClick={onRestore}>
          <RotateCcw className="size-3.5 mr-1" /> Restore
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
