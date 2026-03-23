"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { seedAllData } from "@/lib/seedData";
import { STATUS_CONFIG, CATEGORY_CONFIG, PROJECT_STATUSES, formatIDR } from "@/lib/constants";
import { Project, ProjectStatus, ProjectCategory } from "@/types";
import { ProjectFormData } from "@/lib/schemas";
import { differenceInDays, format } from "date-fns";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Globe,
  Smartphone,
  Code2,
  Camera,
  ImageIcon,
  FolderKanban,
  Trash2,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectForm from "@/components/ProjectForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { showCreated, showUpdated, showDeleted } from "@/lib/toasts";

const CATEGORY_ICONS: Record<ProjectCategory, React.ReactNode> = {
  web_dev: <Globe className="size-3" />,
  mobile_app: <Smartphone className="size-3" />,
  software: <Code2 className="size-3" />,
  photography: <Camera className="size-3" />,
  photo_editing: <ImageIcon className="size-3" />,
};

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);
  const clients = useClientStore((s) => s.clients);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const softDelete = useProjectStore((s) => s.softDelete);
  const restore = useProjectStore((s) => s.restore);

  useEffect(() => {
    seedAllData();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name || "Unknown";

  const filtered = projects.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !getClientName(p.clientId).toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    return true;
  });

  const now = new Date();

  const handleCreate = (data: ProjectFormData) => {
    addProject({
      ...data,
      progress: 0,
      tasks: [],
      attachments: [],
      deliveredDate: undefined,
    });
    showCreated("Project");
  };

  const handleEdit = (data: ProjectFormData) => {
    if (!editProject) return;
    updateProject(editProject.id, data);
    showUpdated("Project");
    setEditProject(null);
  };

  const handleDelete = (project: Project) => {
    softDelete(project.id);
    showDeleted("Project", () => restore(project.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} total projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="size-4 mr-1" /> New Project
          </Button>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-sm ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <LayoutGrid className="size-4" />
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | "all")}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ProjectCategory | "all")}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Categories</option>
          {(Object.keys(CATEGORY_CONFIG) as ProjectCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PROJECT_STATUSES.map((status) => {
            const statusProjects = filtered.filter((p) => p.status === status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="min-w-[260px] max-w-[260px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: cfg.text }} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{statusProjects.length}</span>
                </div>
                <div className="space-y-2">
                  {statusProjects.map((project) => {
                    const daysLeft = differenceInDays(new Date(project.deadline), now);
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between mb-1.5">
                            <p className="text-sm font-medium text-foreground leading-tight">{project.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{getClientName(project.clientId)}</p>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {CATEGORY_ICONS[project.category]}
                              {CATEGORY_CONFIG[project.category].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{project.progress}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-muted-foreground">{formatIDR(project.contractValue)}</span>
                            <span className={`text-[10px] ${daysLeft < 7 && daysLeft >= 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {statusProjects.length === 0 && (
                    <div className="border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Progress</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Deadline</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Value</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((project) => {
                const status = STATUS_CONFIG[project.status];
                const daysLeft = differenceInDays(new Date(project.deadline), now);
                return (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="text-sm font-medium text-foreground hover:text-primary">{project.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{getClientName(project.clientId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {CATEGORY_ICONS[project.category]}
                        {CATEGORY_CONFIG[project.category].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.text }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${daysLeft < 7 && daysLeft >= 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {format(new Date(project.deadline), 'MMM dd, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-mono text-foreground">{formatIDR(project.contractValue)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === project.id ? null : project.id); }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {actionMenu === project.id && (
                          <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 w-32">
                            <button
                              onClick={() => { setEditProject(project); setActionMenu(null); }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Pencil className="size-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(project); setActionMenu(null); }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <FolderKanban className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No projects found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Create Project Form */}
      <ProjectForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Project Form */}
      {editProject && (
        <ProjectForm
          open={!!editProject}
          onOpenChange={(open) => { if (!open) setEditProject(null); }}
          onSubmit={handleEdit}
          defaultValues={{
            name: editProject.name,
            clientId: editProject.clientId,
            category: editProject.category,
            status: editProject.status,
            description: editProject.description,
            contractValue: editProject.contractValue,
            dpAmount: editProject.dpAmount,
            dpPaid: editProject.dpPaid,
            dpPaidDate: editProject.dpPaidDate,
            finalPaid: editProject.finalPaid,
            finalPaidDate: editProject.finalPaidDate,
            startDate: editProject.startDate,
            deadline: editProject.deadline,
            hourlyRate: editProject.hourlyRate,
            estimatedHours: editProject.estimatedHours,
            notes: editProject.notes,
          }}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This project will be moved to trash. You can restore it later."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}
