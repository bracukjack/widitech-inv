"use client";

import { useEffect, useRef } from "react";
import { Project, Timeline, TimelinePhase, Task } from "@/types";
import { useGantt, useGanttScroll } from "@/hooks/useGantt";
import { getBarLeft, getBarWidth } from "@/lib/gantt";
import { PHASE_STATUS_CONFIG } from "@/lib/constants";
import GanttHeader from "./GanttHeader";
import GanttBar from "./GanttBar";
import GanttMilestone from "./GanttMilestone";
import GanttToday from "./GanttToday";

interface GanttViewProps {
  project: Project;
  timeline: Timeline;
  activePhases: TimelinePhase[];
  allTasks: Task[];
  onEditPhase?: (phase: TimelinePhase) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const ROW_HEIGHT        = 48;
const HEADER_HEIGHT     = 56;
const MILESTONE_ROW_H   = 40;

export default function GanttView({
  project,
  timeline,
  activePhases,
  allTasks,
  onEditPhase,
  scrollRef,
}: GanttViewProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const chartRef    = (scrollRef ?? internalRef) as React.RefObject<HTMLDivElement>;

  const layout = useGantt(project, timeline);
  const { scrollToToday } = useGanttScroll(layout.displayStart, layout.columnUnit);

  useEffect(() => {
    scrollToToday(chartRef.current ?? null);
  }, []);

  const {
    displayStart,
    totalWidth,
    columnUnit,
    monthHeaders,
    subHeaders,
    todayVisible,
    todayLeftPx,
    deadlineLeftPx,
  } = layout;

  const projectMilestones = timeline.milestones.filter((m) => !m.isDeleted);
  const hasProjectMs       = projectMilestones.length > 0;

  const totalRows   = activePhases.length + (hasProjectMs ? 1 : 0);
  const bodyHeight  = Math.max(totalRows * ROW_HEIGHT, ROW_HEIGHT);

  return (
    <div className="flex border border-border rounded-xl overflow-hidden">
      {/* ── Left sticky column ── */}
      <div className="flex-none" style={{ width: 200 }}>
        {/* Header */}
        <div
          className="h-14 border-b border-r border-border bg-muted/40 flex items-end px-3 pb-2"
          style={{ height: HEADER_HEIGHT }}
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Phase
          </span>
        </div>

        {/* Phase label rows */}
        {activePhases.length === 0 ? (
          <div
            className="border-b border-r border-border flex items-center justify-center text-muted-foreground text-xs border-dashed"
            style={{ height: ROW_HEIGHT }}
          >
            No phases
          </div>
        ) : (
          activePhases.map((phase) => {
            const statusCfg = PHASE_STATUS_CONFIG[phase.status];
            return (
              <div
                key={phase.id}
                className="flex flex-col justify-center gap-1 px-3 border-b border-r border-border hover:bg-muted/30 transition-colors cursor-pointer"
                style={{ height: ROW_HEIGHT }}
                onClick={() => onEditPhase?.(phase)}
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
                <div className="w-full h-[3px] bg-muted rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${phase.progress}%`, backgroundColor: phase.color }}
                  />
                </div>
              </div>
            );
          })
        )}

        {/* Project milestones row label */}
        {hasProjectMs && (
          <div
            className="border-b border-r border-border flex items-center px-3"
            style={{ height: MILESTONE_ROW_H }}
          >
            <span className="text-[11px] text-muted-foreground">Milestones</span>
          </div>
        )}
      </div>

      {/* ── Scrollable chart area ── */}
      <div
        ref={chartRef}
        className="flex-1 overflow-x-auto overflow-y-visible relative"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-border, #e5e7eb) transparent",
        }}
      >
        <div style={{ minWidth: totalWidth, position: "relative" }}>
          {/* Date header */}
          <GanttHeader
            monthHeaders={monthHeaders}
            subHeaders={subHeaders}
            columnUnit={columnUnit}
            todayVisible={todayVisible}
            todayLeftPx={todayLeftPx}
            totalWidth={totalWidth}
          />

          {/* Phase rows */}
          {activePhases.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm border-b border-dashed border-border"
              style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
            >
              Add your first phase →
            </div>
          )}

          {activePhases.map((phase) => {
            const leftPx  = getBarLeft(new Date(phase.startDate), displayStart, columnUnit);
            const widthPx = getBarWidth(new Date(phase.startDate), new Date(phase.endDate), columnUnit);
            const linkedTasks = allTasks.filter(
              (t) => phase.taskIds.includes(t.id) && !t.isDeleted
            );
            const doneCount   = linkedTasks.filter((t) => t.completed).length;
            const phaseMilestones = phase.milestones.filter((m) => !m.isDeleted);

            return (
              <div
                key={phase.id}
                className="relative border-b border-border"
                style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
              >
                <GanttBar
                  phase={phase}
                  leftPx={leftPx}
                  widthPx={widthPx}
                  linkedTasksTotal={linkedTasks.length}
                  linkedTasksDone={doneCount}
                />
                {phaseMilestones.map((m) => (
                  <GanttMilestone
                    key={m.id}
                    milestone={m}
                    displayStart={displayStart}
                    columnUnit={columnUnit}
                  />
                ))}
              </div>
            );
          })}

          {/* Project-level milestones row */}
          {hasProjectMs && (
            <div
              className="relative border-b border-border"
              style={{ height: MILESTONE_ROW_H, minWidth: totalWidth }}
            >
              {projectMilestones.map((m) => (
                <GanttMilestone
                  key={m.id}
                  milestone={m}
                  displayStart={displayStart}
                  columnUnit={columnUnit}
                  rowHeight={MILESTONE_ROW_H}
                />
              ))}
            </div>
          )}

          {/* Today vertical line */}
          {todayVisible && (
            <GanttToday
              leftPx={todayLeftPx}
              totalHeight={bodyHeight}
            />
          )}

          {/* Deadline line */}
          {deadlineLeftPx >= 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: deadlineLeftPx,
                top: 0,
                bottom: 0,
                zIndex: 15,
              }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-red-500 whitespace-nowrap bg-background px-1 rounded">
                Deadline
              </div>
              <div
                style={{
                  width: 1,
                  height: "100%",
                  borderLeft: "1px dashed #ef4444",
                  opacity: 0.7,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

