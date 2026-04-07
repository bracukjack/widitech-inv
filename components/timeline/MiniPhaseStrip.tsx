"use client";

import { Timeline, TimelinePhase } from "@/types";
import { differenceInDays } from "date-fns";
import { useState } from "react";

interface MiniPhaseStripProps {
  timeline: Timeline;
  projectStartDate: string;
  projectDeadline: string;
}

const PHASE_OPACITY: Record<string, number> = {
  not_started: 0.4,
  in_progress: 1,
  completed:   0.6,
  on_hold:     0.5,
  cancelled:   0.3,
};

export default function MiniPhaseStrip({
  timeline,
  projectStartDate,
  projectDeadline,
}: MiniPhaseStripProps) {
  const [tooltip, setTooltip] = useState<{ phase: TimelinePhase; x: number } | null>(null);

  const activePhases = timeline.phases
    .filter((p) => !p.isDeleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activePhases.length === 0) return null;

  const totalDays = differenceInDays(new Date(projectDeadline), new Date(projectStartDate)) || 1;
  const maxShow   = 6;
  const displayed = activePhases.slice(0, maxShow - 1);
  const extra     = activePhases.length > maxShow - 1 ? activePhases.length - (maxShow - 1) : 0;

  return (
    <div className="relative">
      <div className="flex gap-0.5 items-center h-1.5 mt-2">
        {displayed.map((phase) => {
          const phaseStart   = new Date(phase.startDate);
          const phaseEnd     = new Date(phase.endDate);
          const projectStart = new Date(projectStartDate);

          const rawDays  = differenceInDays(phaseEnd, phaseStart) + 1;
          const widthPct = Math.min((rawDays / totalDays) * 100, 100);

          return (
            <div
              key={phase.id}
              className="h-1.5 rounded-full flex-shrink-0 cursor-pointer relative"
              style={{
                width: `${widthPct}%`,
                minWidth: 4,
                backgroundColor: phase.color,
                opacity: PHASE_OPACITY[phase.status] ?? 0.7,
              }}
              title={`${phase.name}: ${phase.progress}% · ${phase.status}`}
            />
          );
        })}
        {extra > 0 && (
          <span className="text-[9px] text-muted-foreground font-medium ml-0.5">
            +{extra}
          </span>
        )}
      </div>
    </div>
  );
}
