"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/projectStore";
import { useClientStore } from "@/lib/clientStore";
import { useTimeStore } from "@/lib/timeStore";
import { seedAllData } from "@/lib/seedData";
import { STATUS_CONFIG, CATEGORY_CONFIG, PROJECT_STATUSES, formatIDR } from "@/lib/constants";
import { ProjectStatus, Task } from "@/types";
import { differenceInDays, format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Pin,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { showCreated, showDeleted } from "@/lib/toasts";
import Breadcrumb from "@/components/layout/Breadcrumb";
import ActivityTimeline from "@/components/ActivityTimeline";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "overview" | "tasks" | "finance" | "time" | "files" | "activity";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);
  const addTask = useProjectStore((s) => s.addTask);
  const toggleTask = useProjectStore((s) => s.toggleTask);
  const softDeleteTask = useProjectStore((s) => s.softDeleteTask);
  const restoreTask = useProjectStore((s) => s.restoreTask);
  const togglePin = useProjectStore((s) => s.togglePin);
  const clients = useClientStore((s) => s.clients);
  const timeLogs = useTimeStore((s) => s.timeLogs);

  useEffect(() => {
    seedAllData();
    useProjectStore.persist.rehydrate();
    useClientStore.persist.rehydrate();
    useTimeStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Link href="/projects"><Button variant="outline" className="mt-4">Back to Projects</Button></Link>
      </div>
    );
  }

  const client = clients.find((c) => c.id === project.clientId);
  const daysLeft = differenceInDays(new Date(project.deadline), new Date());
  const status = STATUS_CONFIG[project.status];
  const category = CATEGORY_CONFIG[project.category];
  const projectTimeLogs = timeLogs.filter((t) => t.projectId === project.id && !t.isDeleted);
  const totalHours = projectTimeLogs.reduce((sum, t) => sum + t.duration, 0) / 60;
  const billableAmount = projectTimeLogs.filter((t) => t.billable).reduce((sum, t) => sum + t.billableAmount, 0);
  const activeTasks = project.tasks.filter((t) => !t.isDeleted);
  const completedActiveTasks = activeTasks.filter((t) => t.completed).length;
  const totalTasks = activeTasks.length;
  const completedTasks = completedActiveTasks;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus });
  };

  const handleProgressChange = (progress: number) => {
    updateProject(project.id, { progress });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(project.id, {
      title: newTaskTitle.trim(),
      completed: false,
      priority: "medium",
    });
    setNewTaskTitle("");
    showCreated("Task");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks (${totalTasks})` },
    { id: "finance", label: "Finance" },
    { id: "time", label: "Time Logs" },
    { id: "files", label: "Files" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: project.name },
      ]} />

      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">{client?.name || "Unknown client"}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{category.label}</span>
              <span className={`text-xs ${daysLeft < 7 && daysLeft >= 0 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePin(project.id)}
              title={project.isPinned ? "Unpin project" : "Pin project"}
              className="shrink-0"
            >
              <Pin
                className={`size-4 transition-colors ${
                  project.isPinned
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium"
              style={{ color: status.text }}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm font-mono text-muted-foreground">{project.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={project.progress}
          onChange={(e) => handleProgressChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        {totalTasks > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{completedTasks} of {totalTasks} tasks completed</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Details</h3>
              {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Start Date</span><p className="font-medium mt-0.5">{format(new Date(project.startDate), 'MMM dd, yyyy')}</p></div>
                <div><span className="text-muted-foreground">Deadline</span><p className="font-medium mt-0.5">{format(new Date(project.deadline), 'MMM dd, yyyy')}</p></div>
                {project.deliveredDate && <div><span className="text-muted-foreground">Delivered</span><p className="font-medium mt-0.5">{format(new Date(project.deliveredDate), 'MMM dd, yyyy')}</p></div>}
              </div>
            </div>
            {project.notes && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{project.notes}</p>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Contract Value</span><span className="font-mono font-medium">{formatIDR(project.contractValue)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Down Payment</span><span className="font-mono font-medium">{formatIDR(project.dpAmount)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">DP Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${project.dpPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {project.dpPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Final Payment</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${project.finalPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {project.finalPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-medium">Remaining</span>
                <span className="font-mono font-bold">
                  {formatIDR(project.contractValue - (project.dpPaid ? project.dpAmount : 0) - (project.finalPaid ? project.contractValue - project.dpAmount : 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>
          {project.tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No tasks yet</p>
              <p className="text-sm mt-1">Add tasks to track your project progress</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <button onClick={() => toggleTask(project.id, task.id)} className="shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                  <button onClick={() => { softDeleteTask(project.id, task.id); showDeleted('Task', () => restoreTask(project.id, task.id)); }} className="text-muted-foreground hover:text-red-600 transition-colors">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "finance" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Contract Value</p>
              <p className="text-lg font-bold font-mono">{formatIDR(project.contractValue)}</p>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Down Payment</p>
              <p className="text-lg font-bold font-mono">{formatIDR(project.dpAmount)}</p>
              <span className={`text-xs ${project.dpPaid ? 'text-green-600' : 'text-red-600'}`}>{project.dpPaid ? '✓ Paid' : '✗ Unpaid'}</span>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Final Payment</p>
              <p className="text-lg font-bold font-mono">{formatIDR(project.contractValue - project.dpAmount)}</p>
              <span className={`text-xs ${project.finalPaid ? 'text-green-600' : 'text-red-600'}`}>{project.finalPaid ? '✓ Paid' : '✗ Unpaid'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "time" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
              <p className="text-xl font-bold font-mono">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Billable Amount</p>
              <p className="text-xl font-bold font-mono">{formatIDR(billableAmount)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl">
            {projectTimeLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="size-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">No time logs yet</p>
                <Link href="/time-tracker"><Button size="sm" variant="outline" className="mt-3"><Clock className="size-3.5 mr-1" />Start Timer</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {projectTimeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(log.startTime), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">{(log.duration / 60).toFixed(1)}h</p>
                      {log.billable && <p className="text-xs text-green-600 font-mono">{formatIDR(log.billableAmount)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="bg-card border border-border rounded-xl">
          {project.attachments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No files attached</p>
              <p className="text-sm mt-1">File tracking for this project</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{file}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Project Activity</h3>
          <ActivityTimeline projectId={project.id} />
        </div>
      )}
    </div>
  );
}
