"use client";

import { hexToRgba } from "@/lib/gantt";
import { TimelinePhase } from "@/types";
import { useState, useRef } from "react";
import GanttTooltip from "./GanttTooltip";

interface GanttBarProps {
  phase: TimelinePhase;
  leftPx: number;
  widthPx: number;
  linkedTasksTotal: number;
  linkedTasksDone: number;
}

export default function GanttBar({
  phase,
  leftPx,
  widthPx,
  linkedTasksTotal,
  linkedTasksDone,
}: GanttBarProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timerRef.current = setTimeout(() => setTooltipVisible(true), 300);
  };
  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltipVisible(false);
  };

  const bg30  = hexToRgba(phase.color, 0.3);
  const bg90  = hexToRgba(phase.color, 0.9);
  const isWide = widthPx > 80;
  const progressWidth = Math.round((phase.progress / 100) * widthPx);

  return (
    <div
      className="relative"
      style={{ position: "absolute", left: leftPx, top: "50%", transform: "translateY(-50%)" }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {/* Bar container */}
      <div
        className="relative overflow-hidden transition-all duration-150"
        style={{
          width: widthPx,
          height: 28,
          borderRadius: 4,
          backgroundColor: bg30,
          border: tooltipVisible ? `1px solid ${phase.color}` : "1px solid transparent",
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: progressWidth,
            backgroundColor: bg90,
            borderRadius:
              phase.progress >= 100 ? 4 : "4px 0 0 4px",
            transition: "width 200ms ease",
          }}
        />

        {/* Label inside bar */}
        {isWide && (
          <div
            className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <span
              className="text-[11px] font-medium text-white truncate max-w-[70%]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              {phase.name}
            </span>
            <span
              className="text-[10px] text-white/80 font-mono shrink-0"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              {phase.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltipVisible && (
        <GanttTooltip
          phase={phase}
          linkedTasksTotal={linkedTasksTotal}
          linkedTasksDone={linkedTasksDone}
          barWidthPx={widthPx}
        />
      )}
    </div>
  );
}
