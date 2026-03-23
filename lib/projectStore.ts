import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectStatus, ProjectCategory, Task } from '@/types';
import { migrateNestedSoftDelete } from '@/lib/storage';
import { useActivityStore } from '@/lib/activityStore';

interface ProjectStore {
  projects: Project[];

  // CREATE
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) => Project;

  // READ (exclude deleted)
  getProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  getProjectsByClient: (clientId: string) => Project[];
  getProjectsByCategory: (category: ProjectCategory) => Project[];
  searchProjects: (query: string) => Project[];

  // UPDATE
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: ProjectStatus) => void;

  // TASK CRUD
  addTask: (projectId: string, task: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  softDeleteTask: (projectId: string, taskId: string) => void;
  restoreTask: (projectId: string, taskId: string) => void;
  permanentDeleteTask: (projectId: string, taskId: string) => void;
  getActiveTasks: (projectId: string) => Task[];
  getDeletedTasks: (projectId: string) => Task[];

  // SOFT DELETE
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  deleteProject: (id: string) => void; // kept for backward compat, now soft deletes
  getDeleted: () => Project[];

  // PIN
  togglePin: (id: string) => void;
  getPinnedProjects: () => Project[];

  // AUTO-PROGRESS
  recalculateProgress: (projectId: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: uuidv4(),
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
          deletedAt: null,
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
        useActivityStore.getState().logActivity(newProject.id, 'project_created', `Project "${newProject.name}" was created.`);
        return newProject;
      },

      // READ
      getProjects: () => get().projects.filter((p) => !p.isDeleted),
      getProjectById: (id) => get().projects.find((p) => p.id === id && !p.isDeleted),
      getProjectsByStatus: (status) => get().projects.filter((p) => !p.isDeleted && p.status === status),
      getProjectsByClient: (clientId) => get().projects.filter((p) => !p.isDeleted && p.clientId === clientId),
      getProjectsByCategory: (category) => get().projects.filter((p) => !p.isDeleted && p.category === category),
      searchProjects: (query) => {
        const q = query.toLowerCase();
        return get().projects.filter((p) => !p.isDeleted && (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)));
      },

      // UPDATE
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      })),
      updateProgress: (id, progress) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, progress, updatedAt: new Date().toISOString() } : p
          ),
        }));
        useActivityStore.getState().logActivity(id, 'progress_updated', `Progress updated to ${progress}%.`, { progress });
      },
      updateStatus: (id, status) => {
        const oldStatus = get().projects.find((p) => p.id === id)?.status;
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          ),
        }));
        useActivityStore.getState().logActivity(id, 'status_changed', `Status changed from "${oldStatus}" to "${status}".`, { oldStatus, newStatus: status });
      },

      // TASK CRUD
      addTask: (projectId, task) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: [
                  ...p.tasks,
                  { ...task, id: uuidv4(), projectId, createdAt: new Date().toISOString(), isDeleted: false, deletedAt: null },
                ],
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),

      toggleTask: (projectId, taskId) => {
        const project = get().projects.find((p) => p.id === projectId);
        const task = project?.tasks.find((t) => t.id === taskId);
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        get().recalculateProgress(projectId);
        if (task) {
          const newState = !task.completed;
          useActivityStore.getState().logActivity(
            projectId,
            newState ? 'task_completed' : 'task_added',
            newState ? `Task "${task.title}" completed.` : `Task "${task.title}" marked incomplete.`,
            { taskId, taskTitle: task.title, completed: newState }
          );
        }
      },

      updateTask: (projectId, taskId, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, ...updates } : t
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),

      // kept for backward compat — now calls softDeleteTask
      deleteTask: (projectId, taskId) => {
        get().softDeleteTask(projectId, taskId);
      },

      softDeleteTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, isDeleted: true, deletedAt: new Date().toISOString() } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        get().recalculateProgress(projectId);
      },

      restoreTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, isDeleted: false, deletedAt: null } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        get().recalculateProgress(projectId);
      },

      permanentDeleteTask: (projectId, taskId) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId), updatedAt: new Date().toISOString() }
            : p
        ),
      })),

      getActiveTasks: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project ? project.tasks.filter((t) => !t.isDeleted) : [];
      },

      getDeletedTasks: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project ? project.tasks.filter((t) => t.isDeleted) : [];
      },

      // SOFT DELETE (project level)
      softDelete: (id) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                tasks: p.tasks.map((t) => ({ ...t, isDeleted: true, deletedAt: new Date().toISOString() })),
              }
            : p
        ),
      })),

      restore: (id) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                isDeleted: false,
                deletedAt: null,
                tasks: p.tasks.map((t) => ({ ...t, isDeleted: false, deletedAt: null })),
              }
            : p
        ),
      })),

      permanentDelete: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      })),

      // backward compat alias
      deleteProject: (id) => {
        get().softDelete(id);
      },

      getDeleted: () => get().projects.filter((p) => p.isDeleted),

      // PIN
      togglePin: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;
        const pinnedCount = get().projects.filter(p => p.isPinned && !p.isDeleted).length;
        if (!project.isPinned && pinnedCount >= 8) return;
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isPinned: !p.isPinned, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
      getPinnedProjects: () => get().projects.filter((p) => !p.isDeleted && p.isPinned),

      recalculateProgress: (projectId) => set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          const activeTasks = p.tasks.filter((t) => !t.isDeleted);
          if (activeTasks.length === 0) return p; // keep last known progress
          const completed = activeTasks.filter((t) => t.completed).length;
          return { ...p, progress: Math.round((completed / activeTasks.length) * 100) };
        }),
      })),
    }),
    {
      name: 'project-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.projects = migrateNestedSoftDelete(state.projects, 'tasks');
        }
      },
    }
  )
);
