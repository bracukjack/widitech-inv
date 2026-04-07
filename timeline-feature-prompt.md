# 📅 PROMPT — Project Timeline Feature
> Continuation prompt #4. Base app + CRUD + Soft Delete + UI Polish sudah implemented.
> Paste ke Cursor dan bilang: "Implement this on top of the existing codebase."

---

## OBJECTIVE

Add a **Timeline feature** per project. Each project can have one timeline composed of multiple phases. Each phase has its own date range, tasks, status, and completion percentage. The timeline is visualized as a horizontal Gantt-style bar chart within the project detail page.

This is NOT a standalone page — timeline lives **inside the project detail** as a new tab, deeply integrated with the existing project structure.

---

## DESIGN PHILOSOPHY

Consistent with existing app aesthetic:
- Same DM Sans + DM Mono fonts
- Same color variables (`--surface`, `--border`, `--text-primary`, etc.)
- Same card style (1px border, 12px radius, no drop shadows)
- Same badge/status pill style (11px, sentence case, pill shape)
- Same spacing scale (32px page padding, 20px card padding, etc.)
- Gantt bars: flat color (no gradient), rounded ends, height 28px
- Timeline header row: text-[11px] uppercase tracking-wider text-muted (same as table headers)
- All date/time values: DM Mono font
- Micro-interactions: 120ms ease transitions only

---

## PART 1 — DATA MODELS

Add to `src/types/index.ts`:

```typescript
// ─── Timeline Phase Status ───────────────────────────────────────────────────
export type PhaseStatus =
  | 'not_started'  // Belum dimulai
  | 'in_progress'  // Sedang berjalan
  | 'completed'    // Selesai
  | 'on_hold'      // Ditunda
  | 'cancelled';   // Dibatalkan

// ─── Milestone (key event within a phase or standalone) ──────────────────────
export interface Milestone {
  id: string;
  phaseId: string | null;   // null = project-level milestone (not tied to a phase)
  projectId: string;
  title: string;
  date: string;             // ISO date — single point in time
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  color?: string;           // hex, defaults to category color
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

// ─── Timeline Phase ───────────────────────────────────────────────────────────
export interface TimelinePhase {
  id: string;
  projectId: string;
  name: string;             // e.g. "Phase 1 — Discovery", "Design", "Development"
  description?: string;
  status: PhaseStatus;
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  progress: number;         // 0–100, auto-calculated from linked tasks OR manual
  progressMode: 'auto' | 'manual';
  // 'auto'   = progress derived from % of linked tasks completed
  // 'manual' = user sets progress directly via slider

  color: string;            // hex — defaults to a color from the preset palette
  sortOrder: number;        // for vertical ordering on the Gantt
  taskIds: string[];        // IDs of Project.tasks linked to this phase
  milestones: Milestone[];  // milestones that belong to this phase

  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Timeline (one per project) ───────────────────────────────────────────────
export interface Timeline {
  id: string;
  projectId: string;        // 1-to-1 with Project
  title: string;            // e.g. "Project Timeline" or custom name
  description?: string;
  phases: TimelinePhase[];
  milestones: Milestone[];  // project-level milestones (phaseId = null)

  // Computed display range (derived — do NOT store, compute on read):
  // displayStartDate = min(all phase startDates, project.startDate)
  // displayEndDate   = max(all phase endDates,   project.deadline)

  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Extend existing `Project` interface

```typescript
// In the existing Project interface, ADD one field:
export interface Project {
  // ... all existing fields unchanged ...
  timelineId: string | null;  // null if no timeline created yet
}
```

---

## PART 2 — ZUSTAND STORE

Create `src/store/timelineStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timeline, TimelinePhase, Milestone, PhaseStatus } from '@/types';
import { nanoid } from 'nanoid';

interface TimelineStore {
  timelines: Timeline[];

  // ── Timeline CRUD ──────────────────────────────────────────────────────────
  createTimeline: (projectId: string, title?: string) => Timeline;
  getTimelineByProject: (projectId: string) => Timeline | undefined;
  updateTimeline: (id: string, updates: Partial<Pick<Timeline, 'title' | 'description'>>) => void;
  softDeleteTimeline: (id: string) => void;
  restoreTimeline: (id: string) => void;
  permanentDeleteTimeline: (id: string) => void;

  // ── Phase CRUD ─────────────────────────────────────────────────────────────
  addPhase: (
    timelineId: string,
    data: Omit<TimelinePhase, 'id' | 'projectId' | 'milestones' | 'isDeleted' | 'deletedAt' | 'createdAt' | 'updatedAt'>
  ) => TimelinePhase;
  updatePhase: (timelineId: string, phaseId: string, updates: Partial<TimelinePhase>) => void;
  updatePhaseStatus: (timelineId: string, phaseId: string, status: PhaseStatus) => void;
  updatePhaseProgress: (timelineId: string, phaseId: string, progress: number) => void;
  reorderPhases: (timelineId: string, orderedPhaseIds: string[]) => void;
  softDeletePhase: (timelineId: string, phaseId: string) => void;
  restorePhase: (timelineId: string, phaseId: string) => void;
  permanentDeletePhase: (timelineId: string, phaseId: string) => void;

  // ── Task ↔ Phase linking ───────────────────────────────────────────────────
  linkTaskToPhase: (timelineId: string, phaseId: string, taskId: string) => void;
  unlinkTaskFromPhase: (timelineId: string, phaseId: string, taskId: string) => void;
  getPhaseForTask: (timelineId: string, taskId: string) => TimelinePhase | undefined;

  // ── Milestone CRUD ─────────────────────────────────────────────────────────
  addMilestone: (
    timelineId: string,
    phaseId: string | null,
    data: Omit<Milestone, 'id' | 'phaseId' | 'projectId' | 'isDeleted' | 'deletedAt' | 'createdAt'>
  ) => Milestone;
  updateMilestone: (timelineId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  toggleMilestone: (timelineId: string, milestoneId: string) => void;
  softDeleteMilestone: (timelineId: string, milestoneId: string) => void;
  permanentDeleteMilestone: (timelineId: string, milestoneId: string) => void;

  // ── Computed helpers ───────────────────────────────────────────────────────
  getActivePhases: (timelineId: string) => TimelinePhase[];
  getActiveMilestones: (timelineId: string) => Milestone[];
  recalculatePhaseProgress: (timelineId: string, phaseId: string, tasks: Task[]) => void;
  // Reads linked taskIds, counts completed vs total, sets phase.progress if progressMode === 'auto'

  getDeletedItems: () => { phases: TimelinePhase[]; milestones: Milestone[] };
}
```

### Auto-progress recalculation rule

```typescript
// Call recalculatePhaseProgress whenever:
// 1. A task linked to a phase is toggled (in projectStore.toggleTask)
// 2. A task is added/removed from a phase (linkTaskToPhase / unlinkTaskFromPhase)
// 3. A task is soft-deleted (in projectStore.softDeleteTask)

function recalculatePhaseProgress(timelineId, phaseId, allProjectTasks) {
  const phase = getPhase(timelineId, phaseId);
  if (!phase || phase.progressMode !== 'auto') return;

  const linkedTasks = allProjectTasks.filter(
    t => phase.taskIds.includes(t.id) && !t.isDeleted
  );
  if (linkedTasks.length === 0) return; // don't change progress if no tasks

  const completedCount = linkedTasks.filter(t => t.completed).length;
  const newProgress = Math.round((completedCount / linkedTasks.length) * 100);
  updatePhaseProgress(timelineId, phaseId, newProgress);
}
```

---

## PART 3 — PROJECT DETAIL INTEGRATION

### Add "Timeline" tab to existing project detail tabs

Current tabs: Overview · Tasks · Finance · Time Logs · Files · Activity

New tab order: Overview · Tasks · **Timeline** · Finance · Time Logs · Files · Activity

### Timeline tab — two sub-views (toggle button top-right):

```
[Gantt View]  [List View]
```

---

## PART 4 — GANTT VIEW (main visualization)

### Layout structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIMELINE HEADER                                                             │
│  Title: "Project Timeline"   [+ Add Phase]  [+ Add Milestone]  [⋯ Edit]    │
├──────────────────┬──────────────────────────────────────────────────────────┤
│  PHASE LIST      │  GANTT CHART AREA                                        │
│  (left column)   │  (scrollable horizontally)                               │
│  200px fixed     │  flexible width                                          │
├──────────────────┼──────────────────────────────────────────────────────────┤
│                  │  DATE HEADER ROW (months + weeks)                        │
│  Phase 1 ──────  │  ████████████░░░░░░░░░░░░░░░░░  bar                     │
│  Phase 2 ──────  │        ████████████████████████  bar                     │
│  Phase 3 ──────  │                    ████████████  bar                     │
│                  │                         ◆  ◆  ◆  milestones              │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

### Gantt chart — detailed specifications

**Date header (top of chart area):**
```
Row 1 (months): March 2025 ────────────────── April 2025 ──────── May 2025
Row 2 (weeks):  W10  W11  W12  W13  W14  W15  W16  W17  W18  W19  W20

Styling:
- Month label: text-[11px] font-medium text-primary, left-aligned per month column
- Week label:  text-[10px] text-muted, centered per week column
- Row height:  28px each, total header = 56px
- Background:  bg-surface-2
- Border-bottom: 1px border
- "Today" column: subtle bg-blue/5 vertical highlight spanning full chart height
```

**Column width:**
```typescript
const COLUMN_UNIT: 'week' | 'day' = (() => {
  const totalDays = differenceInDays(displayEndDate, displayStartDate);
  return totalDays <= 60 ? 'day' : 'week';
})();
// < 60 days total span → show daily columns (20px/day)
// ≥ 60 days total span → show weekly columns (40px/week)

const DAY_WIDTH  = 20;  // px per day
const WEEK_WIDTH = 40;  // px per week
```

**Phase left column:**
```
Width: 200px, fixed, no horizontal scroll
Each row: height 48px, border-bottom 1px

Row content (vertically centered):
  ● [phase color dot 8px]  Phase Name          [status badge]
  Progress bar (full width, 3px height, mt-1)

Phase name: text-sm font-medium, truncate 1 line
Status badge: same pill style as project status, 11px
Progress bar: bg-surface-2 track, colored fill matching phase color

Hover row: bg-surface-2/50
Click row: expands to show linked tasks below (accordion)
```

**Gantt bars:**
```typescript
interface GanttBarProps {
  phase: TimelinePhase;
  displayStartDate: Date;  // leftmost date of the chart
  columnUnit: 'day' | 'week';
}

// Bar position:
const leftPx  = getColumnOffset(phase.startDate, displayStartDate, columnUnit);
const widthPx = getColumnWidth(phase.startDate, phase.endDate, columnUnit);

// Minimum bar width: 4px (so 1-day phases are visible)
// Bar height: 28px
// Border-radius: 4px (rounded ends)
// Background: phase.color at 85% opacity (e.g. #2563eb → rgba(37,99,235,0.85))
// NO gradient

// Inside bar (if wide enough > 80px):
//   Left-aligned text: phase.name, text-[11px] text-white font-medium, px-2, truncate
//   Right-aligned: progress %, text-[10px] text-white/80, DM Mono

// Hover state:
//   Slight border: 1px solid phase.color (100% opacity outline)
//   Show tooltip (see below)

// Tooltip on bar hover:
┌──────────────────────────────┐
│  Phase 1 — Discovery         │
│  Mar 1 → Mar 14 (14 days)    │
│  Progress: 75%               │
│  Status: In Progress         │
│  Tasks: 3/4 completed        │
└──────────────────────────────┘
// Tooltip: bg-surface, border, rounded-lg, text-xs, p-3, shadow-md
// Position: above bar, centered horizontally
// Delay: 300ms before showing (prevent flicker on quick hover)
```

**Progress fill inside bar:**
```
Bar has two layers:
1. Background layer: phase.color at 30% opacity (full width = planned)
2. Progress layer:   phase.color at 90% opacity (width = progress%)
   Border-radius right side = 0 if progress < 100%, = 4px if 100%
```

**Milestones on Gantt:**
```
Rendered as diamond (◆) shape on the timeline row
Size: 12x12px, rotated 45deg square
Color: milestone.color ?? phase.color ?? category color
Position: vertically centered on the phase row, horizontally at milestone.date

If milestone is at project level (phaseId = null):
  Render on a dedicated "Milestones" row BELOW all phase rows
  Row label: "Milestones" in text-[11px] text-muted

Completed milestone: filled diamond, opacity 60%
Incomplete milestone: outlined diamond (border only, transparent fill)

Hover tooltip:
┌──────────────────┐
│ ◆ Client Review  │
│ March 14, 2025   │
│ ✓ Completed      │
└──────────────────┘
```

**"Today" line:**
```
Vertical line spanning full chart height (all rows + header)
Style: 1px dashed, color var(--blue), opacity 60%
Top label: "Today" text-[10px] text-blue bg-surface px-1 rounded
Only show if today falls within displayStartDate ↔ displayEndDate
```

**Scroll behavior:**
```
The Gantt chart area (right column) is horizontally scrollable
The phase left column is sticky (does not scroll horizontally)
On mount: auto-scroll to position today's date at 30% from the left edge
Smooth scroll, no snap
Horizontal scrollbar: styled thin (4px height), rounded, color border-md
```

---

## PART 5 — LIST VIEW (alternative view)

When user toggles to List View, show phases as expandable cards instead of Gantt bars:

```
┌────────────────────────────────────────────────────────────┐
│  ▼  Phase 1 — Discovery                      not_started   │
│     Mar 1 – Mar 14 · 14 days                 ░░░░░░  0%   │
│  ─────────────────────────────────────────────────────────  │
│     No tasks linked to this phase             + Link tasks  │
│     No milestones                             + Add milestone│
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ▼  Phase 2 — Design                         in_progress   │
│     Mar 15 – Apr 4 · 21 days                 ████░░  60%  │
│  ─────────────────────────────────────────────────────────  │
│  LINKED TASKS                                              │
│  ✓  Create wireframes            high   Mar 20   Done      │
│  ○  Design system setup          medium Mar 25   Pending   │
│  ─────────────────────────────────────────────────────────  │
│  MILESTONES                                                │
│  ◆  Design approval              Mar 28          Pending   │
└────────────────────────────────────────────────────────────┘
```

**List view card rules:**
- Same card style as existing app (1px border, 12px radius, 20px padding)
- Expandable via chevron (▼/▶) — expanded by default
- Collapsed: shows only phase name, date range, status badge, progress bar (1 line)
- Expanded: shows linked tasks + milestones sections
- Tasks shown inline (compact, not full TaskList component)
- Each phase has a left border (3px) in phase.color (same as category color borders)
- Drag handle (GripVertical icon) on left edge for reordering phases

---

## PART 6 — FORM SPECIFICATIONS

### Create / Edit Timeline

```
Triggered: first time user clicks "Timeline" tab → shows empty state with "Create Timeline" button

Form (small modal, max-w-md):
1. Timeline title * (default: "Project Timeline")
2. Description       (textarea, optional)

[Cancel]  [Create Timeline]
```

### Create / Edit Phase (modal, max-w-lg)

```
1. Phase name *              (text, placeholder: "e.g. Phase 1 — Discovery")
2. Description               (textarea, optional, max 200 chars)
3. Status *                  (select: Not Started / In Progress / Completed / On Hold / Cancelled)
4. Start date *              (DatePicker)
5. End date *                (DatePicker — must be ≥ start date)
   ↳ Helper text: "X days" auto-calculated and shown inline
6. Color *                   (same 12-swatch color picker as category form)
   ↳ Default: cycle through palette in order for each new phase
7. Progress mode *           (segmented: [Auto from tasks] [Manual])
   ↳ If "Manual": show progress slider (0–100%)
   ↳ If "Auto":   show read-only "calculated from X linked tasks"

Validation:
- Start date must be within project.startDate ↔ project.deadline
  → Warning (not error): "Phase dates extend beyond project timeline"
- End date must be ≥ start date
- Name required, max 80 chars

[Cancel]  [Save Phase]
```

### Link Tasks to Phase (modal, max-w-md)

```
Title: "Link tasks to [Phase Name]"

Shows list of ALL project tasks not yet assigned to any phase:
  ☐  Create wireframes          high    Mar 20
  ☐  Setup design system        medium  (no date)
  ☑  Write API docs             low     Apr 5    ← already linked (shown, disabled)

Checkboxes to select/deselect
[Cancel]  [Save]

After saving: recalculatePhaseProgress() is called automatically
```

### Add Milestone (inline form OR small modal)

```
Prefer inline form below the milestones row (same pattern as task inline add):

1. Milestone title *     (text, autofocus, max 80 chars)
2. Date *                (DatePicker)
3. Description           (expandable, optional)
4. Color                 (6-swatch mini picker: blue/purple/teal/amber/red/green)
5. Phase link            (select: "Project level" or any phase name)

[Enter] to save, [Esc] to cancel
Or: dedicated modal for full edit
```

---

## PART 7 — EMPTY STATE & FIRST USE

When a project has no timeline yet:

```
Timeline tab empty state:
┌──────────────────────────────────────────────────┐
│                                                  │
│          [CalendarRange icon — 40px muted]       │
│                                                  │
│          No timeline yet                         │
│          Plan your project phases,               │
│          milestones, and delivery schedule.      │
│                                                  │
│          [Create Timeline]                       │
│                                                  │
└──────────────────────────────────────────────────┘

After creating the timeline (no phases yet):
- Show the Gantt area with just the date header and project start→deadline range
- Show "+ Add Phase" prominent button in the center of the chart area
- Show a subtle dashed border Gantt row as placeholder: "Add your first phase →"
```

---

## PART 8 — PHASE STATUS CONFIG

```typescript
// Add to src/lib/constants.ts
export const PHASE_STATUS_CONFIG: Record<PhaseStatus, {
  label: string;
  bg: string;
  text: string;
}> = {
  not_started: { label: 'Not started', bg: '#f9fafb', text: '#374151' },
  in_progress: { label: 'In progress', bg: '#eff6ff', text: '#1d4ed8' },
  completed:   { label: 'Completed',   bg: '#f0fdf4', text: '#15803d' },
  on_hold:     { label: 'On hold',     bg: '#fffbeb', text: '#b45309' },
  cancelled:   { label: 'Cancelled',   bg: '#fef2f2', text: '#b91c1c' },
};

// Default phase color palette (cycle through for new phases):
export const PHASE_COLOR_PALETTE = [
  '#2563eb', // blue
  '#7c3aed', // purple
  '#0f766e', // teal
  '#d97706', // amber
  '#db2777', // pink
  '#16a34a', // green
  '#ea580c', // orange
  '#0284c7', // sky
];
// When adding the Nth phase, use PHASE_COLOR_PALETTE[N % PHASE_COLOR_PALETTE.length]
```

---

## PART 9 — ACTIVITY LOG INTEGRATION

Auto-log these events in the existing `activityStore` (or projectStore activity logger):

```typescript
// Phase created
logActivity(projectId, 'phase_created',
  `Phase created: "${phase.name}" (${formatDate(phase.startDate)} → ${formatDate(phase.endDate)})`
);

// Phase status changed
logActivity(projectId, 'phase_status_changed',
  `Phase "${phase.name}" status changed to "${PHASE_STATUS_CONFIG[newStatus].label}"`
);

// Phase completed (status → 'completed')
logActivity(projectId, 'phase_completed',
  `Phase completed: "${phase.name}"`
);

// Milestone added
logActivity(projectId, 'milestone_added',
  `Milestone added: "${milestone.title}" on ${formatDate(milestone.date)}`
);

// Milestone completed
logActivity(projectId, 'milestone_completed',
  `Milestone reached: "${milestone.title}"`
);
```

---

## PART 10 — DASHBOARD INTEGRATION

### Project card enhancement (existing cards in Dashboard + Project list)

Add a small timeline preview below the existing progress bar on project cards:

```
Current card:
  [Project Name]   [Status badge]
  [Client]
  [████░░░░ 45%]
  [Deadline: Mar 30]

Enhanced card (if timeline exists):
  [Project Name]   [Status badge]
  [Client]
  [████░░░░ 45%]
  [Deadline: Mar 30]
  ─────────────────────────────
  [Phase 1 ██] [Phase 2 ░░] [Phase 3 ░░]   ← mini phase strip

Mini phase strip:
- Height: 4px bars, gap 2px between phases
- Each bar width proportional to phase duration relative to total project duration
- Color: phase.color
- Opacity: 40% (not_started), 100% (in_progress), 60% (completed), 30% (cancelled)
- Tooltip on hover: "Phase 2 — Design: 60% · In progress"
- Only show if project has timeline with ≥ 1 phase
- Max 6 phases shown in strip; if more → show first 5 + "+N" label
```

### Dashboard stats — no changes needed (timeline data feeds into existing project progress)

---

## PART 11 — ZOD VALIDATION SCHEMAS

Add to `src/lib/schemas.ts`:

```typescript
export const phaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required').max(80),
  description: z.string().max(200).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
  progressMode: z.enum(['auto', 'manual']),
  progress: z.number().min(0).max(100),
}).refine(d => d.endDate >= d.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(80),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  phaseId: z.string().nullable(),
});

export const timelineSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(300).optional(),
});

export type PhaseFormData     = z.infer<typeof phaseSchema>;
export type MilestoneFormData = z.infer<typeof milestoneSchema>;
export type TimelineFormData  = z.infer<typeof timelineSchema>;
```

---

## PART 12 — KEYBOARD SHORTCUTS (extend existing)

Add to `src/lib/shortcuts.ts`:

```typescript
// Inside project detail — Timeline tab only:
ADD_PHASE:       { key: 'p', meta: true, shift: true, description: 'Add new phase' },
ADD_MILESTONE:   { key: 'm', meta: true, shift: true, description: 'Add milestone' },
TOGGLE_VIEW:     { key: '\\', meta: true,             description: 'Toggle Gantt / List view' },
SCROLL_TODAY:    { key: 't', meta: true,              description: 'Scroll to today' },
```

Also add a "Go to today" button (target icon, Lucide: Crosshair) in the Gantt toolbar — top-right of chart area. Clicking it smoothly scrolls the chart to center on today's date.

---

## PART 13 — SOFT DELETE INTEGRATION

Follow the same pattern as all other modules (established in Prompt #2):

```typescript
// Soft delete a phase:
softDeletePhase(timelineId, phaseId)
// → sets phase.isDeleted = true, phase.deletedAt = now()
// → does NOT delete linked tasks (tasks remain on project, just unlinked from phase)
// → does NOT delete milestones within the phase (they are also soft-deleted)
// → logs activity: "Phase deleted: [name]"

// Soft delete a milestone:
softDeleteMilestone(timelineId, milestoneId)
// → sets milestone.isDeleted = true

// Restore:
restorePhase(timelineId, phaseId)    // restores phase but NOT its milestones (restore separately)
restoreTimeline(timelineId)          // restores timeline, NOT phases (restore each separately)

// Trash page — add new tabs:
// Trash > Timelines | Phases | Milestones
// Same UI pattern as other trash tabs
```

**Confirmation dialog for phase delete:**
```
Title: "Delete phase?"
Body:  "\"[Phase Name]\" will be moved to Trash. Linked tasks will remain
        on the project but will be unlinked from this phase."
Buttons: Cancel | Move to Trash
```

---

## PART 14 — FILE STRUCTURE

New files to create:

```
src/
├── store/
│   └── timelineStore.ts           # New store
├── types/
│   └── index.ts                   # EXTEND (add Timeline, TimelinePhase, Milestone types)
├── lib/
│   ├── schemas.ts                 # EXTEND (add phaseSchema, milestoneSchema, timelineSchema)
│   ├── constants.ts               # EXTEND (add PHASE_STATUS_CONFIG, PHASE_COLOR_PALETTE)
│   └── gantt.ts                   # NEW — Gantt calculation helpers
├── components/
│   └── timeline/
│       ├── TimelineTab.tsx         # Tab entry point — shows Gantt or List + empty state
│       ├── GanttView.tsx           # Main Gantt chart component
│       ├── GanttHeader.tsx         # Date header row (months + weeks/days)
│       ├── GanttPhaseRow.tsx       # Single phase row (left label + bar)
│       ├── GanttBar.tsx            # The colored bar element
│       ├── GanttMilestone.tsx      # Diamond milestone marker
│       ├── GanttToday.tsx          # Today vertical line
│       ├── GanttTooltip.tsx        # Hover tooltip for bars and milestones
│       ├── ListView.tsx            # List/accordion alternative view
│       ├── PhaseCard.tsx           # Phase card in list view
│       ├── PhaseForm.tsx           # Create/edit phase modal
│       ├── MilestoneForm.tsx       # Inline/modal milestone form
│       ├── TimelineForm.tsx        # Create/edit timeline modal
│       ├── LinkTasksModal.tsx      # Link tasks to phase modal
│       └── MiniPhaseStrip.tsx      # Tiny phase strip for project cards
└── hooks/
    └── useGantt.ts                 # Gantt layout calculation hook
```

### `src/lib/gantt.ts` — helper functions

```typescript
// All pure functions — no side effects

export function getDisplayRange(phases: TimelinePhase[], project: Project): {
  start: Date;
  end: Date;
  totalDays: number;
} {
  // start = min(project.startDate, ...phases.map(p => p.startDate))
  // end   = max(project.deadline,  ...phases.map(p => p.endDate))
  // Add 3-day padding on each side for visual breathing room
}

export function getColumnUnit(totalDays: number): 'day' | 'week' {
  return totalDays <= 60 ? 'day' : 'week';
}

export function getBarLeft(
  phaseStart: Date,
  displayStart: Date,
  columnUnit: 'day' | 'week'
): number { /* px from left edge */ }

export function getBarWidth(
  phaseStart: Date,
  phaseEnd: Date,
  columnUnit: 'day' | 'week'
): number { /* px width */ }

export function getMonthHeaders(
  displayStart: Date,
  displayEnd: Date,
  columnUnit: 'day' | 'week'
): { label: string; leftPx: number; widthPx: number }[] { }

export function getWeekHeaders(
  displayStart: Date,
  displayEnd: Date
): { label: string; leftPx: number }[] { }

export function isTodayVisible(displayStart: Date, displayEnd: Date): boolean { }

export function getTodayLeftPx(
  displayStart: Date,
  columnUnit: 'day' | 'week'
): number { }

export function getPhaseDurationDays(phase: TimelinePhase): number {
  return differenceInDays(new Date(phase.endDate), new Date(phase.startDate)) + 1;
}

export function getInitialScrollLeft(
  displayStart: Date,
  containerWidth: number,
  columnUnit: 'day' | 'week'
): number {
  // Position today at 30% from left
  // If today is not in range, scroll to start
}
```

---

## PART 15 — EDGE CASES & GUARD RAILS

```
1. OVERLAPPING PHASES
   → Allowed (common in real projects — e.g. Design overlaps with Development)
   → No validation error — just render bars on the same row, slightly offset vertically
     if they overlap: shift second bar 6px down within the row (row height expands to 54px)

2. PHASE EXTENDS BEYOND PROJECT DEADLINE
   → Show warning badge on the phase in list view: "Extends beyond deadline"
   → In Gantt: bar continues past the project deadline line (shown as dashed vertical)
   → Project deadline line: 1px dashed red, label "Deadline" at top

3. MILESTONE DATE OUTSIDE ALL PHASES
   → Show on "Project milestones" standalone row (not tied to any phase row)

4. PROJECT WITH NO START DATE OR NO DEADLINE
   → "Create Timeline" button is disabled
   → Tooltip: "Set a start date and deadline on the project first."

5. ALL PHASES DELETED (timeline exists but 0 active phases)
   → Show "No phases" empty state with "+ Add Phase" inside the Gantt area
   → Still show the date header with project start → deadline range

6. PROGRESS MODE = AUTO, NO TASKS LINKED
   → Show "0%" progress
   → In phase list view: info hint "Link tasks to auto-calculate progress"

7. PHASE WITH 100% PROGRESS BUT STATUS NOT 'completed'
   → Show a gentle suggestion toast (once per session):
     "Phase '[name]' is 100% complete. Mark it as completed?"
     [Dismiss]  [Mark Completed]

8. DELETING A TASK THAT IS LINKED TO A PHASE
   → In projectStore.softDeleteTask: automatically call unlinkTaskFromPhase()
   → Then call recalculatePhaseProgress()
   → Log activity: "Task removed from Phase [name] and deleted"

9. REORDERING PHASES (drag to reorder in list view)
   → Only affects sortOrder (visual order on Gantt rows)
   → Does NOT affect dates
   → Use @dnd-kit/sortable (already installed)

10. MOBILE / NARROW SCREEN
    → Gantt view: show horizontal scroll indicator (faint fade on right edge)
    → Minimum usable width for Gantt: 600px
    → Below 600px: auto-switch to List view, hide Gantt toggle button
```

---

## IMPLEMENTATION ORDER

Build in this exact sequence:

1. **Types** — add `Timeline`, `TimelinePhase`, `Milestone` to `types/index.ts` + add `timelineId` to `Project`
2. **Schemas** — add `phaseSchema`, `milestoneSchema`, `timelineSchema` to `schemas.ts`
3. **Constants** — add `PHASE_STATUS_CONFIG`, `PHASE_COLOR_PALETTE` to `constants.ts`
4. **Gantt helpers** — create `lib/gantt.ts` with all pure calculation functions (test these first)
5. **Timeline store** — create `timelineStore.ts` with full implementation
6. **Hook** — create `useGantt.ts` that consumes timelineStore + gantt.ts helpers
7. **Timeline tab** — add tab entry to project detail, show empty state
8. **Timeline form** — create/edit timeline modal
9. **Phase form** — create/edit phase modal (most complex form)
10. **List view** — simpler to build first, validates data model
11. **Gantt date header** — `GanttHeader.tsx` (month + week rows)
12. **Gantt phase rows** — `GanttPhaseRow.tsx` + `GanttBar.tsx`
13. **Today line** — `GanttToday.tsx` + auto-scroll on mount
14. **Milestones** — `GanttMilestone.tsx` + milestone form
15. **Tooltips** — `GanttTooltip.tsx` (add last — overlay layer)
16. **Link tasks modal** — `LinkTasksModal.tsx` + recalculate integration
17. **Mini phase strip** — `MiniPhaseStrip.tsx` on dashboard + project cards
18. **Activity log integration** — add logActivity calls in timelineStore actions
19. **Trash integration** — add Timeline/Phase/Milestone tabs to Trash page
20. **Keyboard shortcuts** — extend existing shortcuts registry
21. **Edge cases** — implement all 10 guard rails from Part 15

---

## DO NOT CHANGE

- Do NOT change the existing routing structure
- Do NOT change the design system, colors, fonts, or spacing tokens
- Do NOT remove or rename any existing Zustand store methods
- Do NOT add authentication, API calls, or external data sources
- Do NOT install new charting libraries — Gantt is built with pure CSS + calculated positions
- Do NOT add dark mode
- Keep DM Mono for all numbers (dates, percentages, durations)
- Keep all existing CRUD + soft delete patterns from Prompt #2

---

*Continuation prompt #4 for: Freelance Business OS*
*Feature: Project Timeline — Gantt Chart + Phases + Milestones*
*Stack: Next.js 14 · TypeScript · Tailwind CSS · Zustand · localStorage*
