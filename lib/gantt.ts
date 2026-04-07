import {
  differenceInDays,
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  getISOWeek,
  format,
} from 'date-fns';
import { TimelinePhase } from '@/types';

export const DAY_WIDTH = 20;   // px per day
export const WEEK_WIDTH = 40;  // px per week
export const PADDING_DAYS = 3; // visual breathing room on each side

// ── Display Range ─────────────────────────────────────────────────────────────

export function getDisplayRange(
  phases: TimelinePhase[],
  project: { startDate: string; deadline: string }
): { start: Date; end: Date; totalDays: number } {
  const projectStart = new Date(project.startDate);
  const projectEnd   = new Date(project.deadline);

  const activePhases = phases.filter((p) => !p.isDeleted);

  const allStarts = [projectStart, ...activePhases.map((p) => new Date(p.startDate))];
  const allEnds   = [projectEnd,   ...activePhases.map((p) => new Date(p.endDate))];

  const rawStart = allStarts.reduce((a, b) => (a < b ? a : b));
  const rawEnd   = allEnds.reduce((a, b) => (a > b ? a : b));

  const start     = addDays(rawStart, -PADDING_DAYS);
  const end       = addDays(rawEnd,    PADDING_DAYS);
  const totalDays = differenceInDays(end, start) + 1;

  return { start, end, totalDays };
}

// ── Column unit ───────────────────────────────────────────────────────────────

export function getColumnUnit(totalDays: number): 'day' | 'week' {
  return totalDays <= 60 ? 'day' : 'week';
}

// ── Bar positioning ───────────────────────────────────────────────────────────

export function getBarLeft(
  date: Date,
  displayStart: Date,
  columnUnit: 'day' | 'week'
): number {
  const days = differenceInDays(date, displayStart);
  return columnUnit === 'day' ? days * DAY_WIDTH : (days / 7) * WEEK_WIDTH;
}

export function getBarWidth(
  phaseStart: Date,
  phaseEnd: Date,
  columnUnit: 'day' | 'week'
): number {
  const days   = differenceInDays(phaseEnd, phaseStart) + 1;
  const minPx  = 4;
  return columnUnit === 'day'
    ? Math.max(days * DAY_WIDTH, minPx)
    : Math.max((days / 7) * WEEK_WIDTH, minPx);
}

export function getTotalWidth(
  displayStart: Date,
  displayEnd: Date,
  columnUnit: 'day' | 'week'
): number {
  const days = differenceInDays(displayEnd, displayStart) + 1;
  return columnUnit === 'day' ? days * DAY_WIDTH : (days / 7) * WEEK_WIDTH;
}

// ── Header rows ───────────────────────────────────────────────────────────────

export function getMonthHeaders(
  displayStart: Date,
  displayEnd: Date,
  columnUnit: 'day' | 'week'
): { label: string; leftPx: number; widthPx: number }[] {
  const headers: { label: string; leftPx: number; widthPx: number }[] = [];

  let monthStart = new Date(displayStart.getFullYear(), displayStart.getMonth(), 1);

  while (monthStart <= displayEnd) {
    const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const visibleStart   = monthStart < displayStart ? displayStart : monthStart;
    const visibleEnd     = nextMonthStart <= displayEnd
      ? addDays(nextMonthStart, -1)
      : displayEnd;

    const daysFromStart = differenceInDays(visibleStart, displayStart);
    const daysWidth     = differenceInDays(visibleEnd, visibleStart) + 1;

    const leftPx  = columnUnit === 'day'
      ? daysFromStart * DAY_WIDTH
      : (daysFromStart / 7) * WEEK_WIDTH;
    const widthPx = columnUnit === 'day'
      ? daysWidth * DAY_WIDTH
      : (daysWidth / 7) * WEEK_WIDTH;

    headers.push({ label: format(monthStart, 'MMMM yyyy'), leftPx, widthPx });
    monthStart = nextMonthStart;
  }

  return headers;
}

export function getWeekHeaders(
  displayStart: Date,
  displayEnd: Date
): { label: string; leftPx: number }[] {
  const weeks: { label: string; leftPx: number }[] = [];
  let weekStart = startOfWeek(displayStart, { weekStartsOn: 1 }); // Monday

  while (weekStart <= displayEnd) {
    const visibleDay    = weekStart < displayStart ? displayStart : weekStart;
    const daysFromStart = differenceInDays(visibleDay, displayStart);
    const leftPx        = (daysFromStart / 7) * WEEK_WIDTH;

    weeks.push({ label: `W${getISOWeek(weekStart)}`, leftPx });
    weekStart = addWeeks(weekStart, 1);
  }

  return weeks;
}

export function getDayHeaders(
  displayStart: Date,
  displayEnd: Date
): { label: string; leftPx: number; isToday: boolean }[] {
  const days: { label: string; leftPx: number; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = new Date(displayStart);

  while (current <= displayEnd) {
    const daysFromStart = differenceInDays(current, displayStart);
    const isToday       = current.toDateString() === today.toDateString();

    days.push({
      label:   format(current, 'd'),
      leftPx:  daysFromStart * DAY_WIDTH,
      isToday,
    });
    current = addDays(current, 1);
  }

  return days;
}

// ── Today helpers ─────────────────────────────────────────────────────────────

export function isTodayVisible(displayStart: Date, displayEnd: Date): boolean {
  const today = new Date();
  return today >= displayStart && today <= displayEnd;
}

export function getTodayLeftPx(
  displayStart: Date,
  columnUnit: 'day' | 'week'
): number {
  return getBarLeft(new Date(), displayStart, columnUnit);
}

// ── Phase utilities ───────────────────────────────────────────────────────────

export function getPhaseDurationDays(phase: TimelinePhase): number {
  return differenceInDays(new Date(phase.endDate), new Date(phase.startDate)) + 1;
}

export function getInitialScrollLeft(
  displayStart: Date,
  containerWidth: number,
  columnUnit: 'day' | 'week'
): number {
  const today      = new Date();
  const todayLeft  = getBarLeft(today, displayStart, columnUnit);

  if (isNaN(todayLeft)) return 0;

  const scrollLeft = todayLeft - containerWidth * 0.3;
  return Math.max(0, scrollLeft);
}

export function phaseExtendsDeadline(phase: TimelinePhase, deadline: string): boolean {
  return phase.endDate > deadline;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
