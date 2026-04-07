import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Timeline, TimelinePhase, Milestone, PhaseStatus, Task } from '@/types';
import { PHASE_COLOR_PALETTE, PHASE_STATUS_CONFIG } from '@/lib/constants';
import { useActivityStore } from '@/lib/activityStore';
import { format } from 'date-fns';

interface TimelineStore {
  timelines: Timeline[];

  // ── Timeline CRUD ──────────────────────────────────────────────────────────
  createTimeline: (projectId: string, title?: string, description?: string) => Timeline;
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

  // ── Computed helpers ───────────────────────────────────────────────────────
  getActivePhases: (timelineId: string) => TimelinePhase[];
  getActiveMilestones: (timelineId: string) => Milestone[];
  recalculatePhaseProgress: (timelineId: string, phaseId: string, tasks: Task[]) => void;
  getDeletedItems: () => { timelines: Timeline[]; phases: TimelinePhase[]; milestones: Milestone[] };

  // ── Trash convenience methods (look up by item ID only) ───────────────────
  restorePhase: (phaseId: string) => void;
  permanentDeletePhase: (phaseId: string) => void;
  restoreMilestone: (milestoneId: string) => void;
  permanentDeleteMilestone: (milestoneId: string) => void;
}

function fmtDate(iso: string): string {
  try { return format(new Date(iso), 'MMM d, yyyy'); }
  catch { return iso; }
}

function mapTimeline(
  timelines: Timeline[],
  timelineId: string,
  fn: (t: Timeline) => Timeline
): Timeline[] {
  return timelines.map((t) => (t.id === timelineId ? fn(t) : t));
}

function mapPhase(
  timelines: Timeline[],
  timelineId: string,
  phaseId: string,
  fn: (p: TimelinePhase) => TimelinePhase
): Timeline[] {
  return mapTimeline(timelines, timelineId, (t) => ({
    ...t,
    phases: t.phases.map((p) => (p.id === phaseId ? fn(p) : p)),
    updatedAt: new Date().toISOString(),
  }));
}

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => ({
      timelines: [],

      // ── Timeline CRUD ──────────────────────────────────────────────────────
      createTimeline: (projectId, title = 'Project Timeline', description) => {
        const now = new Date().toISOString();
        const timeline: Timeline = {
          id: uuidv4(),
          projectId,
          title,
          description,
          phases: [],
          milestones: [],
          isDeleted: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ timelines: [...s.timelines, timeline] }));
        return timeline;
      },

      getTimelineByProject: (projectId) =>
        get().timelines.find((t) => t.projectId === projectId && !t.isDeleted),

      updateTimeline: (id, updates) =>
        set((s) => ({
          timelines: mapTimeline(s.timelines, id, (t) => ({
            ...t,
            ...updates,
            updatedAt: new Date().toISOString(),
          })),
        })),

      softDeleteTimeline: (id) =>
        set((s) => ({
          timelines: s.timelines.map((t) =>
            t.id === id
              ? { ...t, isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      restoreTimeline: (id) =>
        set((s) => ({
          timelines: s.timelines.map((t) =>
            t.id === id
              ? { ...t, isDeleted: false, deletedAt: null, updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      permanentDeleteTimeline: (id) =>
        set((s) => ({ timelines: s.timelines.filter((t) => t.id !== id) })),

      // ── Phase CRUD ─────────────────────────────────────────────────────────
      addPhase: (timelineId, data) => {
        const timeline = get().timelines.find((t) => t.id === timelineId);
        if (!timeline) throw new Error('Timeline not found');

        const now = new Date().toISOString();
        const phase: TimelinePhase = {
          ...data,
          id: uuidv4(),
          projectId: timeline.projectId,
          milestones: [],
          isDeleted: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({
          timelines: mapTimeline(s.timelines, timelineId, (t) => ({
            ...t,
            phases: [...t.phases, phase],
            updatedAt: now,
          })),
        }));

        useActivityStore.getState().logActivity(
          timeline.projectId,
          'phase_created',
          `Phase created: "${phase.name}" (${fmtDate(phase.startDate)} → ${fmtDate(phase.endDate)})`
        );

        return phase;
      },

      updatePhase: (timelineId, phaseId, updates) =>
        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          })),
        })),

      updatePhaseStatus: (timelineId, phaseId, status) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        const phase = tl?.phases.find((p) => p.id === phaseId);
        if (!tl || !phase) return;

        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            status,
            updatedAt: new Date().toISOString(),
          })),
        }));

        useActivityStore.getState().logActivity(
          tl.projectId,
          status === 'completed' ? 'phase_completed' : 'phase_status_changed',
          status === 'completed'
            ? `Phase completed: "${phase.name}"`
            : `Phase "${phase.name}" status changed to "${PHASE_STATUS_CONFIG[status].label}"`
        );
      },

      updatePhaseProgress: (timelineId, phaseId, progress) =>
        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            progress,
            updatedAt: new Date().toISOString(),
          })),
        })),

      reorderPhases: (timelineId, orderedPhaseIds) =>
        set((s) => ({
          timelines: mapTimeline(s.timelines, timelineId, (t) => ({
            ...t,
            phases: t.phases.map((p) => ({
              ...p,
              sortOrder: orderedPhaseIds.indexOf(p.id),
            })),
            updatedAt: new Date().toISOString(),
          })),
        })),

      softDeletePhase: (timelineId, phaseId) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        const phase = tl?.phases.find((p) => p.id === phaseId);
        if (!tl || !phase) return;

        const now = new Date().toISOString();
        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            isDeleted: true,
            deletedAt: now,
            taskIds: [], // unlink tasks
            milestones: p.milestones.map((m) => ({
              ...m,
              isDeleted: true,
              deletedAt: now,
            })),
            updatedAt: now,
          })),
        }));

        useActivityStore.getState().logActivity(
          tl.projectId,
          'phase_deleted',
          `Phase deleted: "${phase.name}"`
        );
      },

      // ── Task ↔ Phase linking ───────────────────────────────────────────────
      linkTaskToPhase: (timelineId, phaseId, taskId) => {
        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            taskIds: p.taskIds.includes(taskId) ? p.taskIds : [...p.taskIds, taskId],
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      unlinkTaskFromPhase: (timelineId, phaseId, taskId) => {
        set((s) => ({
          timelines: mapPhase(s.timelines, timelineId, phaseId, (p) => ({
            ...p,
            taskIds: p.taskIds.filter((id) => id !== taskId),
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      getPhaseForTask: (timelineId, taskId) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        return tl?.phases.find((p) => !p.isDeleted && p.taskIds.includes(taskId));
      },

      // ── Milestone CRUD ─────────────────────────────────────────────────────
      addMilestone: (timelineId, phaseId, data) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        if (!tl) throw new Error('Timeline not found');

        const now = new Date().toISOString();
        const milestone: Milestone = {
          ...data,
          id: uuidv4(),
          phaseId,
          projectId: tl.projectId,
          isDeleted: false,
          deletedAt: null,
          createdAt: now,
        };

        set((s) => ({
          timelines: mapTimeline(s.timelines, timelineId, (t) => {
            if (phaseId) {
              return {
                ...t,
                phases: t.phases.map((p) =>
                  p.id === phaseId
                    ? { ...p, milestones: [...p.milestones, milestone], updatedAt: now }
                    : p
                ),
                updatedAt: now,
              };
            }
            return { ...t, milestones: [...t.milestones, milestone], updatedAt: now };
          }),
        }));

        useActivityStore.getState().logActivity(
          tl.projectId,
          'milestone_added',
          `Milestone added: "${milestone.title}" on ${fmtDate(milestone.date)}`
        );

        return milestone;
      },

      updateMilestone: (timelineId, milestoneId, updates) =>
        set((s) => ({
          timelines: mapTimeline(s.timelines, timelineId, (t) => ({
            ...t,
            milestones: t.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...updates } : m
            ),
            phases: t.phases.map((p) => ({
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId ? { ...m, ...updates } : m
              ),
            })),
            updatedAt: new Date().toISOString(),
          })),
        })),

      toggleMilestone: (timelineId, milestoneId) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        if (!tl) return;

        // Find in project-level milestones or phase milestones
        const allMilestones = [
          ...tl.milestones,
          ...tl.phases.flatMap((p) => p.milestones),
        ];
        const milestone = allMilestones.find((m) => m.id === milestoneId);
        if (!milestone) return;

        const newCompleted = !milestone.isCompleted;
        const now = new Date().toISOString();

        get().updateMilestone(timelineId, milestoneId, {
          isCompleted: newCompleted,
          completedAt: newCompleted ? now : undefined,
        });

        if (newCompleted) {
          useActivityStore.getState().logActivity(
            tl.projectId,
            'milestone_completed',
            `Milestone reached: "${milestone.title}"`
          );
        }
      },

      softDeleteMilestone: (timelineId, milestoneId) => {
        const now = new Date().toISOString();
        get().updateMilestone(timelineId, milestoneId, {
          isDeleted: true,
          deletedAt: now,
        });
      },

      // ── Computed helpers ───────────────────────────────────────────────────
      getActivePhases: (timelineId) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        return (tl?.phases ?? [])
          .filter((p) => !p.isDeleted)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      getActiveMilestones: (timelineId) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        if (!tl) return [];
        const phaseMilestones = tl.phases.flatMap((p) => p.milestones).filter((m) => !m.isDeleted);
        const projectMilestones = tl.milestones.filter((m) => !m.isDeleted);
        return [...phaseMilestones, ...projectMilestones];
      },

      recalculatePhaseProgress: (timelineId, phaseId, tasks) => {
        const tl = get().timelines.find((t) => t.id === timelineId);
        const phase = tl?.phases.find((p) => p.id === phaseId);
        if (!phase || phase.progressMode !== 'auto') return;

        const linkedTasks = tasks.filter(
          (t) => phase.taskIds.includes(t.id) && !t.isDeleted
        );
        if (linkedTasks.length === 0) return;

        const completedCount = linkedTasks.filter((t) => t.completed).length;
        const newProgress = Math.round((completedCount / linkedTasks.length) * 100);
        get().updatePhaseProgress(timelineId, phaseId, newProgress);
      },

      getDeletedItems: () => {
        const { timelines } = get();
        const deletedTimelines = timelines.filter((t) => t.isDeleted);
        const phases: TimelinePhase[] = [];
        const milestones: Milestone[] = [];

        for (const tl of timelines) {
          for (const p of tl.phases) {
            if (p.isDeleted) phases.push(p);
            for (const m of p.milestones) {
              if (m.isDeleted) milestones.push(m);
            }
          }
          for (const m of tl.milestones) {
            if (m.isDeleted) milestones.push(m);
          }
        }

        return { timelines: deletedTimelines, phases, milestones };
      },

      // ── Trash convenience (look up by item ID alone) ──────────────────────
      restorePhase: (phaseId) => {
        const now = new Date().toISOString();
        set((state) => ({
          timelines: state.timelines.map((tl) => ({
            ...tl,
            phases: tl.phases.map((p) =>
              p.id === phaseId ? { ...p, isDeleted: false, deletedAt: null } : p
            ),
          })),
        }));
      },
      permanentDeletePhase: (phaseId) => {
        set((state) => ({
          timelines: state.timelines.map((tl) => ({
            ...tl,
            phases: tl.phases.filter((p) => p.id !== phaseId),
          })),
        }));
      },
      restoreMilestone: (milestoneId) => {
        set((state) => ({
          timelines: state.timelines.map((tl) => ({
            ...tl,
            phases: tl.phases.map((p) => ({
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId ? { ...m, isDeleted: false, deletedAt: null } : m
              ),
            })),
            milestones: tl.milestones.map((m) =>
              m.id === milestoneId ? { ...m, isDeleted: false, deletedAt: null } : m
            ),
          })),
        }));
      },
      permanentDeleteMilestone: (milestoneId) => {
        set((state) => ({
          timelines: state.timelines.map((tl) => ({
            ...tl,
            phases: tl.phases.map((p) => ({
              ...p,
              milestones: p.milestones.filter((m) => m.id !== milestoneId),
            })),
            milestones: tl.milestones.filter((m) => m.id !== milestoneId),
          })),
        }));
      },
    }),
    {
      name: 'timeline-storage',
      skipHydration: true,
    }
  )
);
