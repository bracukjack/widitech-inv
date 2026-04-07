import { useMemo, useRef } from 'react';
import { useTimelineStore } from '@/lib/timelineStore';
import {
  getDisplayRange,
  getColumnUnit,
  getTotalWidth,
  getMonthHeaders,
  getWeekHeaders,
  getDayHeaders,
  isTodayVisible,
  getTodayLeftPx,
  getBarLeft,
  getBarWidth,
  getInitialScrollLeft,
} from '@/lib/gantt';
import { Project, Timeline, TimelinePhase } from '@/types';

export interface GanttLayout {
  displayStart: Date;
  displayEnd: Date;
  totalDays: number;
  columnUnit: 'day' | 'week';
  totalWidth: number;
  monthHeaders: { label: string; leftPx: number; widthPx: number }[];
  subHeaders: { label: string; leftPx: number; isToday?: boolean }[];
  todayVisible: boolean;
  todayLeftPx: number;
  deadlineLeftPx: number;
}

export function useGantt(
  project: Pick<Project, 'startDate' | 'deadline'>,
  timeline: Timeline | undefined
): GanttLayout {
  // Select the raw phases array so Zustand can stable-reference it.
  // Calling getActivePhases() inside the selector creates a new array every
  // render, which breaks useSyncExternalStore's snapshot cache check.
  const rawPhases = useTimelineStore((s) => {
    if (!timeline) return null;
    const tl = s.timelines.find((t) => t.id === timeline.id);
    return tl?.phases ?? null;
  });

  const activePhases = useMemo(
    () =>
      rawPhases
        ? rawPhases.filter((p) => !p.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [rawPhases]
  );

  return useMemo(() => {
    const { start, end, totalDays } = getDisplayRange(activePhases, project);
    const columnUnit  = getColumnUnit(totalDays);
    const totalWidth  = getTotalWidth(start, end, columnUnit);
    const monthHeaders = getMonthHeaders(start, end, columnUnit);
    const subHeaders   =
      columnUnit === 'week'
        ? getWeekHeaders(start, end)
        : getDayHeaders(start, end).map(({ label, leftPx, isToday }) => ({ label, leftPx, isToday }));
    const todayVisible  = isTodayVisible(start, end);
    const todayLeftPx   = todayVisible ? getTodayLeftPx(start, columnUnit) : -1;
    const deadlineLeftPx = getBarLeft(new Date(project.deadline), start, columnUnit);

    return {
      displayStart: start,
      displayEnd: end,
      totalDays,
      columnUnit,
      totalWidth,
      monthHeaders,
      subHeaders,
      todayVisible,
      todayLeftPx,
      deadlineLeftPx,
    };
  }, [activePhases, project.startDate, project.deadline]);
}

export function usePhaseBarLayout(
  phase: TimelinePhase,
  displayStart: Date,
  columnUnit: 'day' | 'week'
) {
  return useMemo(() => {
    const leftPx  = getBarLeft(new Date(phase.startDate), displayStart, columnUnit);
    const widthPx = getBarWidth(new Date(phase.startDate), new Date(phase.endDate), columnUnit);
    return { leftPx, widthPx };
  }, [phase.startDate, phase.endDate, displayStart, columnUnit]);
}

export function useGanttScroll(
  displayStart: Date,
  columnUnit: 'day' | 'week'
): { scrollToToday: (container: HTMLElement | null) => void } {
  const scrollToToday = (container: HTMLElement | null) => {
    if (!container) return;
    const target = getInitialScrollLeft(displayStart, container.clientWidth, columnUnit);
    container.scrollTo({ left: target, behavior: 'smooth' });
  };

  return { scrollToToday };
}
