"use client";

interface GanttHeaderProps {
  monthHeaders: { label: string; leftPx: number; widthPx: number }[];
  subHeaders: { label: string; leftPx: number; isToday?: boolean }[];
  columnUnit: "day" | "week";
  todayVisible: boolean;
  todayLeftPx: number;
  totalWidth: number;
}

export default function GanttHeader({
  monthHeaders,
  subHeaders,
  columnUnit,
  todayVisible,
  todayLeftPx,
  totalWidth,
}: GanttHeaderProps) {
  const WEEK_WIDTH = 40;
  const DAY_WIDTH  = 20;
  const colWidth   = columnUnit === "week" ? WEEK_WIDTH : DAY_WIDTH;

  return (
    <div
      className="sticky top-0 bg-muted/40 border-b border-border select-none"
      style={{ minWidth: totalWidth, height: 56, position: "relative" }}
    >
      {/* Today highlight column */}
      {todayVisible && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: todayLeftPx,
            width: colWidth,
            backgroundColor: "rgba(37,99,235,0.05)",
          }}
        />
      )}

      {/* Row 1 — months */}
      <div className="absolute inset-x-0 top-0" style={{ height: 28 }}>
        {monthHeaders.map((m) => (
          <div
            key={`${m.label}-${m.leftPx}`}
            className="absolute top-0 flex items-center overflow-hidden"
            style={{
              left: m.leftPx,
              width: m.widthPx,
              height: 28,
              paddingLeft: 8,
            }}
          >
            <span className="text-[11px] font-medium text-foreground truncate">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Row 2 — weeks or days */}
      <div
        className="absolute inset-x-0 bottom-0 flex"
        style={{ height: 28, top: 28 }}
      >
        {subHeaders.map((h, i) => (
          <div
            key={i}
            className="absolute top-0 flex items-center justify-center border-l border-border/40"
            style={{
              left: h.leftPx,
              width: colWidth,
              height: 28,
            }}
          >
            <span
              className={`text-[10px] ${
                h.isToday
                  ? "text-blue-600 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {h.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
