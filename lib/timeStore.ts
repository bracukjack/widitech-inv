import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TimeLog } from '@/types';
import { migrateSoftDelete } from '@/lib/storage';

interface TimeStore {
  timeLogs: TimeLog[];
  activeTimer: { projectId: string; startTime: string; description: string } | null;

  // CREATE
  startTimer: (projectId: string, description: string) => void;
  stopTimer: (hourlyRate: number, billable: boolean) => void;
  addManualLog: (log: Omit<TimeLog, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;

  // READ
  getTimeLogs: (projectId?: string) => TimeLog[];

  // UPDATE
  updateTimeLog: (id: string, updates: Partial<TimeLog>) => void;
  toggleBillable: (id: string) => void;

  // DELETE
  deleteLog: (id: string) => void;
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => TimeLog[];

  // COMPUTED
  getTotalHours: (projectId?: string) => number;
  getBillableAmount: (projectId?: string) => number;
}

export const useTimeStore = create<TimeStore>()(
  persist(
    (set, get) => ({
      timeLogs: [],
      activeTimer: null,

      startTimer: (projectId, description) => set({
        activeTimer: { projectId, description, startTime: new Date().toISOString() },
      }),

      stopTimer: (hourlyRate, billable) => {
        const { activeTimer } = get();
        if (!activeTimer) return;
        const start = new Date(activeTimer.startTime);
        const end = new Date();
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        const billableAmount = billable ? (duration / 60) * hourlyRate : 0;

        set((state) => ({
          activeTimer: null,
          timeLogs: [
            ...state.timeLogs,
            {
              id: uuidv4(),
              projectId: activeTimer.projectId,
              description: activeTimer.description,
              startTime: activeTimer.startTime,
              endTime: end.toISOString(),
              duration,
              billable,
              hourlyRate,
              billableAmount,
              createdAt: new Date().toISOString(),
              isDeleted: false,
              deletedAt: null,
            },
          ],
        }));
      },

      addManualLog: (log) => set((state) => ({
        timeLogs: [
          ...state.timeLogs,
          { ...log, id: uuidv4(), createdAt: new Date().toISOString(), isDeleted: false, deletedAt: null },
        ],
      })),

      getTimeLogs: (projectId) => {
        const logs = get().timeLogs.filter((l) => !l.isDeleted);
        return projectId ? logs.filter((l) => l.projectId === projectId) : logs;
      },

      updateTimeLog: (id, updates) => set((state) => ({
        timeLogs: state.timeLogs.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      })),

      toggleBillable: (id) => set((state) => ({
        timeLogs: state.timeLogs.map((l) =>
          l.id === id ? { ...l, billable: !l.billable, billableAmount: !l.billable ? (l.duration / 60) * l.hourlyRate : 0 } : l
        ),
      })),

      deleteLog: (id) => { get().softDelete(id); },

      softDelete: (id) => set((state) => ({
        timeLogs: state.timeLogs.map((l) =>
          l.id === id ? { ...l, isDeleted: true, deletedAt: new Date().toISOString() } : l
        ),
      })),

      restore: (id) => set((state) => ({
        timeLogs: state.timeLogs.map((l) =>
          l.id === id ? { ...l, isDeleted: false, deletedAt: null } : l
        ),
      })),

      permanentDelete: (id) => set((state) => ({
        timeLogs: state.timeLogs.filter((l) => l.id !== id),
      })),

      getDeleted: () => get().timeLogs.filter((l) => l.isDeleted),

      getTotalHours: (projectId) => {
        const logs = projectId
          ? get().timeLogs.filter((l) => !l.isDeleted && l.projectId === projectId)
          : get().timeLogs.filter((l) => !l.isDeleted);
        return logs.reduce((sum, l) => sum + l.duration, 0) / 60;
      },

      getBillableAmount: (projectId) => {
        const logs = projectId
          ? get().timeLogs.filter((l) => !l.isDeleted && l.projectId === projectId)
          : get().timeLogs.filter((l) => !l.isDeleted);
        return logs.filter((l) => l.billable).reduce((sum, l) => sum + l.billableAmount, 0);
      },
    }),
    {
      name: 'time-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.timeLogs = migrateSoftDelete(state.timeLogs);
        }
      },
    }
  )
);
