"use client";

import { TimelinePhase, Milestone, Task } from "@/types";
import { PHASE_STATUS_CONFIG } from "@/lib/constants";
import { getBarLeft, getBarWidth } from "@/lib/gantt";
import GanttBar from "./GanttBar";
import GanttMilestone from "./GanttMilestone";

const ROW_HEIGHT = 48;

interface GanttPhaseRowProps {
  phase: TimelinePhase;
  displayStart: Date;
  columnUnit: "day" | "week";
  totalWidth: number;
  allTasks: Task[];
  onEdit?: (phase: TimelinePhase) => void;
}

export default function GanttPhaseRow({
  phase,
  displayStart,
  columnUnit,
  totalWidth,
  allTasks,
  onEdit,
}: GanttPhaseRowProps) {
  const leftPx  = getBarLeft(new Date(phase.startDate), displayStart, columnUnit);
  const widthPx = getBarWidth(
    new Date(phase.startDate),
    new Date(phase.endDate),
    columnUnit
  );

  const linkedTasks = allTasks.filter(
    (t) => phase.taskIds.includes(t.id) && !t.isDeleted
  );
  const doneCount   = linkedTasks.filter((t) => t.completed).length;
  const statusCfg   = PHASE_STATUS_CONFIG[phase.status];

  const activeMilestones = phase.milestones.filter((m) => !m.isDeleted);

  return (
    <div
      className="flex border-b border-border"
      style={{ minHeight: ROW_HEIGHT }}
    >
      {/* Left label column — 200px, sticky */}
      <div
        className="flex-none flex flex-col justify-center gap-1 px-3 border-r border-border bg-background hover:bg-muted/30 transition-colors cursor-pointer"
        style={{ width: 200, minHeight: ROW_HEIGHT }}
        onClick={() => onEdit?.(phase)}
        title="Click to edit phase"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: phase.color }}
          />
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {phase.name}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
          >
            {statusCfg.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-[3px] bg-muted rounded-full">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${phase.progress}%`,
              backgroundColor: phase.color,
            }}
          />
        </div>
      </div>

      {/* Chart area */}
      <div
        className="relative flex-1"
        style={{ minWidth: totalWidth, minHeight: ROW_HEIGHT }}
      >
        {/* Bar */}
        <GanttBar
          phase={phase}
          leftPx={leftPx}
          widthPx={widthPx}
          linkedTasksTotal={linkedTasks.length}
          linkedTasksDone={doneCount}
        />

        {/* Milestones */}
        {activeMilestones.map((m) => (
          <GanttMilestone
            key={m.id}
            milestone={m}
            displayStart={displayStart}
            columnUnit={columnUnit}
            rowHeight={ROW_HEIGHT}
          />
        ))}
      </div>
    </div>
  );
}
