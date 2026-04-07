"use client";

import { TimelinePhase } from "@/types";
import { PHASE_STATUS_CONFIG } from "@/lib/constants";
import { format } from "date-fns";
import { getPhaseDurationDays } from "@/lib/gantt";

interface GanttTooltipProps {
  phase: TimelinePhase;
  linkedTasksTotal: number;
  linkedTasksDone: number;
  barWidthPx: number;
}

export default function GanttTooltip({
  phase,
  linkedTasksTotal,
  linkedTasksDone,
  barWidthPx,
}: GanttTooltipProps) {
  const statusCfg = PHASE_STATUS_CONFIG[phase.status];
  const duration  = getPhaseDurationDays(phase);

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
      }}
    >
      <div className="bg-card border border-border rounded-lg p-3 shadow-md text-xs space-y-1.5 min-w-[180px]">
        <p className="font-semibold text-foreground">{phase.name}</p>
        <p className="text-muted-foreground font-mono">
          {format(new Date(phase.startDate), "MMM d")} →{" "}
          {format(new Date(phase.endDate), "MMM d, yyyy")}{" "}
          <span className="text-foreground">{`(${duration} day${duration !== 1 ? "s" : ""})`}</span>
        </p>
        <p className="text-muted-foreground">
          Progress:{" "}
          <span className="font-mono text-foreground">{phase.progress}%</span>
        </p>
        <p>
          Status:{" "}
          <span
            className="font-medium"
            style={{ color: statusCfg.text }}
          >
            {statusCfg.label}
          </span>
        </p>
        {linkedTasksTotal > 0 && (
          <p className="text-muted-foreground">
            Tasks:{" "}
            <span className="text-foreground font-mono">
              {linkedTasksDone}/{linkedTasksTotal} completed
            </span>
          </p>
        )}
      </div>
      {/* Arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid var(--border)",
        }}
      />
    </div>
  );
}
