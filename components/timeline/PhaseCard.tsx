"use client";

import { useState } from "react";
import { TimelinePhase, Milestone, Task } from "@/types";
import { PHASE_STATUS_CONFIG } from "@/lib/constants";
import { getPhaseDurationDays, phaseExtendsDeadline } from "@/lib/gantt";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Link2,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PhaseCardProps {
  phase: TimelinePhase;
  allTasks: Task[];
  deadline: string;
  onEdit: (phase: TimelinePhase) => void;
  onLinkTasks: (phase: TimelinePhase) => void;
  onAddMilestone: (phase: TimelinePhase) => void;
  onDeletePhase: (phase: TimelinePhase) => void;
}

export default function PhaseCard({
  phase,
  allTasks,
  deadline,
  onEdit,
  onLinkTasks,
  onAddMilestone,
  onDeletePhase,
}: PhaseCardProps) {
  const [expanded, setExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusCfg = PHASE_STATUS_CONFIG[phase.status];
  const duration  = getPhaseDurationDays(phase);
  const exceedsDeadline = phaseExtendsDeadline(phase, deadline);

  const linkedTasks = allTasks.filter(
    (t) => phase.taskIds.includes(t.id) && !t.isDeleted
  );
  const activeMilestones = phase.milestones.filter((m) => !m.isDeleted);

  const PRIORITY_COLORS: Record<string, string> = {
    high:   "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low:    "bg-gray-100 text-gray-600",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Left color border */}
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: phase.color }} />

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
            >
              <GripVertical className="size-4" />
            </button>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {/* Phase name */}
            <button
              onClick={() => onEdit(phase)}
              className="flex-1 text-left font-semibold text-foreground text-sm hover:text-primary transition-colors truncate"
            >
              {phase.name}
            </button>

            {/* Status badge */}
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Date + progress row */}
          <div className="flex items-center gap-4 px-4 pb-3">
            <span className="text-xs text-muted-foreground font-mono">
              {format(new Date(phase.startDate), "MMM d")} –{" "}
              {format(new Date(phase.endDate), "MMM d, yyyy")} ·{" "}
              {duration} day{duration !== 1 ? "s" : ""}
            </span>

            {exceedsDeadline && (
              <span className="flex items-center gap-1 text-amber-600 text-[11px]">
                <AlertTriangle className="size-3" />
                Extends beyond deadline
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <div className="w-20 h-1.5 bg-muted rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${phase.progress}%`,
                    backgroundColor: phase.color,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {phase.progress}%
              </span>
            </div>
          </div>

          {/* Auto progress hint */}
          {phase.progressMode === "auto" && linkedTasks.length === 0 && (
            <div className="px-4 pb-3">
              <p className="text-[11px] text-blue-600 bg-blue-50 rounded px-2 py-1">
                Link tasks to auto-calculate progress
              </p>
            </div>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="border-t border-border">
              {/* Tasks section */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Linked Tasks
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onLinkTasks(phase)}
                  >
                    <Link2 className="size-3 mr-1" />
                    Link tasks
                  </Button>
                </div>
                {linkedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">
                    No tasks linked to this phase.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {linkedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`flex-1 text-sm ${
                            task.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            PRIORITY_COLORS[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {format(new Date(task.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones section */}
              <div className="px-4 py-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Milestones
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onAddMilestone(phase)}
                  >
                    <Plus className="size-3 mr-1" />
                    Add milestone
                  </Button>
                </div>
                {activeMilestones.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">
                    No milestones for this phase.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {activeMilestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <span
                          className="text-sm"
                          style={{ color: m.color ?? "#6b7280" }}
                        >
                          ◆
                        </span>
                        <span
                          className={`flex-1 text-sm ${
                            m.isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {m.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {format(new Date(m.date), "MMM d")}
                        </span>
                        <span
                          className={`text-[10px] ${
                            m.isCompleted
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {m.isCompleted ? "Done" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
