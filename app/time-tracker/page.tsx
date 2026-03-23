"use client";

import { useEffect, useState, useRef } from "react";
import { useTimeStore } from "@/lib/timeStore";
import { useProjectStore } from "@/lib/projectStore";
import { seedAllData } from "@/lib/seedData";
import { formatIDR } from "@/lib/constants";
import { TimeLog } from "@/types";
import { TimeLogFormData } from "@/lib/schemas";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import {
  Play,
  Square,
  Clock,
  Trash2,
  Plus,
  Timer,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TimeLogForm from "@/components/TimeLogForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { showCreated, showUpdated, showDeleted } from "@/lib/toasts";

export default function TimeTrackerPage() {
  const [mounted, setMounted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerDesc, setTimerDesc] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [editLog, setEditLog] = useState<TimeLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeLog | null>(null);

  const timeLogs = useTimeStore((s) => s.timeLogs).filter((l) => !l.isDeleted);
  const activeTimer = useTimeStore((s) => s.activeTimer);
  const startTimer = useTimeStore((s) => s.startTimer);
  const stopTimer = useTimeStore((s) => s.stopTimer);
  const addManualLog = useTimeStore((s) => s.addManualLog);
  const updateTimeLog = useTimeStore((s) => s.updateTimeLog);
  const softDelete = useTimeStore((s) => s.softDelete);
  const restore = useTimeStore((s) => s.restore);
  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    seedAllData();
    useTimeStore.persist.rehydrate();
    useProjectStore.persist.rehydrate();
    setMounted(true);
  }, []);

  // Timer tick
  useEffect(() => {
    if (activeTimer) {
      const tick = () => {
        const start = new Date(activeTimer.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      setElapsed(0);
    }
  }, [activeTimer]);

  if (!mounted) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name || "Unknown";

  const handleStart = () => {
    if (!timerProject) return;
    startTimer(timerProject, timerDesc || "Working...");
    setTimerDesc("");
  };

  const handleStop = () => {
    const project = projects.find((p) => p.id === activeTimer?.projectId);
    stopTimer(project?.hourlyRate || 100000, true);
    showCreated("Time entry");
  };

  const handleManualAdd = (data: TimeLogFormData) => {
    const dateStr = data.date + 'T09:00:00Z';
    const billableAmount = data.billable ? (data.duration / 60) * data.hourlyRate : 0;
    addManualLog({
      projectId: data.projectId,
      description: data.description,
      startTime: dateStr,
      endTime: new Date(new Date(dateStr).getTime() + data.duration * 60000).toISOString(),
      duration: data.duration,
      billable: data.billable,
      hourlyRate: data.hourlyRate,
      billableAmount,
    });
    showCreated("Time entry");
  };

  const handleEdit = (data: TimeLogFormData) => {
    if (!editLog) return;
    const dateStr = data.date + 'T09:00:00Z';
    const billableAmount = data.billable ? (data.duration / 60) * data.hourlyRate : 0;
    updateTimeLog(editLog.id, {
      projectId: data.projectId,
      description: data.description,
      duration: data.duration,
      hourlyRate: data.hourlyRate,
      billable: data.billable,
      billableAmount,
      startTime: dateStr,
      endTime: new Date(new Date(dateStr).getTime() + data.duration * 60000).toISOString(),
    });
    showUpdated("Time entry");
    setEditLog(null);
  };

  const handleDelete = (log: TimeLog) => {
    softDelete(log.id);
    showDeleted("Time entry", () => restore(log.id));
    setDeleteTarget(null);
  };

  // Group logs
  const sortedLogs = [...timeLogs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const grouped: Record<string, typeof timeLogs> = {};
  sortedLogs.forEach((log) => {
    const d = new Date(log.startTime);
    let label = format(d, 'MMM dd, yyyy');
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else if (isThisWeek(d)) label = 'This Week';
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(log);
  });

  // Stats
  const todayMinutes = timeLogs.filter((l) => isToday(new Date(l.startTime))).reduce((sum, l) => sum + l.duration, 0);
  const weekMinutes = timeLogs.filter((l) => isThisWeek(new Date(l.startTime))).reduce((sum, l) => sum + l.duration, 0);
  const now = new Date();
  const monthMinutes = timeLogs.filter((l) => { const d = new Date(l.startTime); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, l) => sum + l.duration, 0);
  const monthBillable = timeLogs.filter((l) => { const d = new Date(l.startTime); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && l.billable; }).reduce((sum, l) => sum + l.billableAmount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Time Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your working hours</p>
      </div>

      {/* Active Timer */}
      <div className="bg-card border border-border rounded-xl p-6">
        {activeTimer ? (
          <div className="text-center space-y-4">
            <p className="text-5xl font-mono font-bold text-foreground tracking-wider">{formatTime(elapsed)}</p>
            <p className="text-sm text-muted-foreground">{getProjectName(activeTimer.projectId)} — {activeTimer.description}</p>
            <Button onClick={handleStop} variant="destructive" size="lg">
              <Square className="size-4 mr-2" /> Stop Timer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-mono font-bold text-muted-foreground/30 tracking-wider">00:00:00</p>
            </div>
            <div className="flex items-center gap-2 max-w-xl mx-auto">
              <select
                value={timerProject}
                onChange={(e) => setTimerProject(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm flex-1"
              >
                <option value="">Select project...</option>
                {projects.filter((p) => !['done', 'cancelled'].includes(p.status)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Input
                placeholder="What are you working on?"
                value={timerDesc}
                onChange={(e) => setTimerDesc(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
              <Button onClick={handleStart} disabled={!timerProject} size="lg">
                <Play className="size-4 mr-2" /> Start
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Today</p>
          <p className="text-lg font-bold font-mono">{(todayMinutes / 60).toFixed(1)}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">This Week</p>
          <p className="text-lg font-bold font-mono">{(weekMinutes / 60).toFixed(1)}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">This Month</p>
          <p className="text-lg font-bold font-mono">{(monthMinutes / 60).toFixed(1)}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Billable (Month)</p>
          <p className="text-lg font-bold font-mono text-green-600">{formatIDR(monthBillable)}</p>
        </div>
      </div>

      {/* Time Logs */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Time Logs</h2>
          <Button size="sm" variant="outline" onClick={() => setShowManual(true)}>
            <Plus className="size-3.5 mr-1" /> Manual Entry
          </Button>
        </div>



        {Object.keys(grouped).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Timer className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">No time logs yet</p>
            <p className="text-sm mt-1">Start the timer or add a manual entry</p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, logs]) => (
            <div key={label}>
              <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground">{getProjectName(log.projectId)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-medium">{(log.duration / 60).toFixed(1)}h</span>
                      {log.billable && <span className="text-xs font-mono text-green-600">{formatIDR(log.billableAmount)}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${log.billable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {log.billable ? 'Billable' : 'Non-billable'}
                      </span>
                      <button onClick={() => setEditLog(log)} className="text-muted-foreground hover:text-blue-600 transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(log)} className="text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Create dialog */}
      <TimeLogForm
        open={showManual}
        onOpenChange={setShowManual}
        onSubmit={handleManualAdd}
        mode="create"
      />

      {/* Edit dialog */}
      {editLog && (
        <TimeLogForm
          open={!!editLog}
          onOpenChange={(open) => { if (!open) setEditLog(null); }}
          onSubmit={handleEdit}
          mode="edit"
          defaultValues={{
            projectId: editLog.projectId,
            description: editLog.description,
            duration: editLog.duration,
            hourlyRate: editLog.hourlyRate,
            billable: editLog.billable,
            date: format(new Date(editLog.startTime), 'yyyy-MM-dd'),
          }}
        />
      )}

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete this time entry?"
        description="It will be moved to trash. You can restore it later."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}
