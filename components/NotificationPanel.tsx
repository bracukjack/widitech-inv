"use client";

import { useNotificationStore } from "@/lib/notificationStore";
import { useRouter } from "next/navigation";
import { Bell, BellOff, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  deadline_overdue: 'border-l-red-500',
  deadline_warning: 'border-l-amber-500',
  invoice_overdue: 'border-l-red-500',
  invoice_due_soon: 'border-l-amber-500',
  payment_received: 'border-l-green-500',
  project_completed: 'border-l-green-500',
};

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const router = useRouter();

  if (!open) return null;

  const handleClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    router.push(notification.link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div
        className="absolute left-[220px] top-0 h-full w-80 bg-card border-r border-border shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BellOff className="size-8 mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1">No notifications right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`relative px-4 py-3 border-l-2 cursor-pointer hover:bg-muted/50 transition-colors group ${
                    TYPE_COLORS[n.type] || 'border-l-transparent'
                  } ${!n.isRead ? 'bg-accent/30' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  {!n.isRead && (
                    <div className="absolute top-3 right-10 size-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
