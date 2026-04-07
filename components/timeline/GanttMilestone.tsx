"use client";

import { Milestone } from "@/types";
import { format } from "date-fns";
import { getBarLeft } from "@/lib/gantt";
import { useState, useRef } from "react";

interface GanttMilestoneProps {
  milestone: Milestone;
  displayStart: Date;
  columnUnit: "day" | "week";
  rowHeight?: number;
}

export default function GanttMilestone({
  milestone,
  displayStart,
  columnUnit,
  rowHeight = 48,
}: GanttMilestoneProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leftPx = getBarLeft(new Date(milestone.date), displayStart, columnUnit);
  const color  = milestone.color ?? "#2563eb";

  const showTip = () => {
    timerRef.current = setTimeout(() => setShow(true), 200);
  };
  const hideTip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  return (
    <div
      className="absolute"
      style={{
        left: leftPx - 6,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10,
      }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {/* Diamond shape */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          transform: "rotate(45deg)",
          backgroundColor: milestone.isCompleted ? color : "transparent",
          border: `2px solid ${color}`,
          opacity: milestone.isCompleted ? 0.6 : 1,
          cursor: "pointer",
          transition: "opacity 120ms ease",
        }}
      />

      {/* Tooltip */}
      {show && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs space-y-1 min-w-[140px]">
            <p className="font-semibold text-foreground">◆ {milestone.title}</p>
            <p className="text-muted-foreground font-mono">
              {format(new Date(milestone.date), "MMMM d, yyyy")}
            </p>
            <p className={milestone.isCompleted ? "text-green-600" : "text-muted-foreground"}>
              {milestone.isCompleted ? "✓ Completed" : "Pending"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
