import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppNotification, Project } from '@/types';
import { Invoice } from '@/types/invoice';
import { differenceInDays } from 'date-fns';

interface NotificationStore {
  notifications: AppNotification[];
  generateNotifications: (projects: Project[], invoices: Invoice[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  getUnread: () => AppNotification[];
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      generateNotifications: (projects, invoices) => {
        const now = new Date();
        const generated: AppNotification[] = [];

        // Check project deadlines
        for (const project of projects) {
          if (project.isDeleted || project.status === 'done' || project.status === 'cancelled') continue;

          const deadline = new Date(project.deadline);
          const daysUntilDeadline = differenceInDays(deadline, now);

          if (daysUntilDeadline < 0) {
            generated.push({
              id: uuidv4(),
              type: 'deadline_overdue',
              title: 'Project Overdue',
              message: `"${project.name}" is ${Math.abs(daysUntilDeadline)} day(s) past deadline.`,
              entityId: project.id,
              entityType: 'project',
              isRead: false,
              createdAt: now.toISOString(),
              link: `/projects/${project.id}`,
            });
          } else if (daysUntilDeadline <= 3) {
            generated.push({
              id: uuidv4(),
              type: 'deadline_warning',
              title: 'Deadline Approaching',
              message: `"${project.name}" deadline is in ${daysUntilDeadline} day(s).`,
              entityId: project.id,
              entityType: 'project',
              isRead: false,
              createdAt: now.toISOString(),
              link: `/projects/${project.id}`,
            });
          } else if (daysUntilDeadline <= 7) {
            generated.push({
              id: uuidv4(),
              type: 'deadline_warning',
              title: 'Deadline This Week',
              message: `"${project.name}" deadline is in ${daysUntilDeadline} day(s).`,
              entityId: project.id,
              entityType: 'project',
              isRead: false,
              createdAt: now.toISOString(),
              link: `/projects/${project.id}`,
            });
          }
        }

        // Check invoice due dates
        for (const invoice of invoices) {
          if (invoice.isDeleted || invoice.status === 'Paid') continue;

          const dueDate = new Date(invoice.dueDate);
          const daysUntilDue = differenceInDays(dueDate, now);

          if (daysUntilDue < 0) {
            generated.push({
              id: uuidv4(),
              type: 'invoice_overdue',
              title: 'Invoice Overdue',
              message: `Invoice ${invoice.invoiceNumber} is ${Math.abs(daysUntilDue)} day(s) overdue.`,
              entityId: invoice.id,
              entityType: 'invoice',
              isRead: false,
              createdAt: now.toISOString(),
              link: `/invoice/${invoice.id}`,
            });
          } else if (daysUntilDue <= 3) {
            generated.push({
              id: uuidv4(),
              type: 'invoice_due_soon',
              title: 'Invoice Due Soon',
              message: `Invoice ${invoice.invoiceNumber} is due in ${daysUntilDue} day(s).`,
              entityId: invoice.id,
              entityType: 'invoice',
              isRead: false,
              createdAt: now.toISOString(),
              link: `/invoice/${invoice.id}`,
            });
          }
        }

        // Keep manually-read state for existing notifications by preserving read status
        const existingReadIds = new Set(
          get().notifications.filter((n) => n.isRead).map((n) => `${n.entityId}-${n.type}`)
        );

        for (const notif of generated) {
          const key = `${notif.entityId}-${notif.type}`;
          if (existingReadIds.has(key)) {
            notif.isRead = true;
          }
        }

        set({ notifications: generated });
      },

      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      })),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      })),

      dismiss: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

      clearAll: () => set({ notifications: [] }),

      getUnread: () => get().notifications.filter((n) => !n.isRead),

      getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    {
      name: 'notification-storage',
      skipHydration: true,
    }
  )
);
