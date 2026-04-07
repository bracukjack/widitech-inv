"use client";

interface GanttTodayProps {
  leftPx: number;
  totalHeight: number;
}

export default function GanttToday({ leftPx, totalHeight }: GanttTodayProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: leftPx,
        top: 0,
        height: totalHeight,
        zIndex: 20,
      }}
    >
      {/* Label */}
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium px-1 rounded"
        style={{
          color: "var(--color-blue-600, #2563eb)",
          background: "var(--color-background, #fff)",
        }}
      >
        Today
      </div>
      {/* Line */}
      <div
        style={{
          width: 1,
          height: "100%",
          borderLeft: "1px dashed #2563eb",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
