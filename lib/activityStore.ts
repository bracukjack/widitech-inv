import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLog, ActivityType } from '@/types';

interface ActivityStore {
  activities: ActivityLog[];
  logActivity: (projectId: string, type: ActivityType, description: string, meta?: Record<string, any>) => void;
  getActivities: (projectId: string) => ActivityLog[];
  clearActivities: (projectId: string) => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],

      logActivity: (projectId, type, description, meta) => {
        const entry: ActivityLog = {
          id: uuidv4(),
          projectId,
          type,
          description,
          meta,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activities: [...state.activities, entry] }));
      },

      getActivities: (projectId) =>
        get().activities
          .filter((a) => a.projectId === projectId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      clearActivities: (projectId) => set((state) => ({
        activities: state.activities.filter((a) => a.projectId !== projectId),
      })),
    }),
    {
      name: 'activity-storage',
      skipHydration: true,
    }
  )
);
