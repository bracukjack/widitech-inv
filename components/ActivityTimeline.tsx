"use client";

import { useActivityStore } from "@/lib/activityStore";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";

interface ActivityTimelineProps {
  projectId: string;
}

const TYPE_COLORS: Record<string, string> = {
  project_created: 'bg-gray-400',
  project_updated: 'bg-blue-500',
  status_changed: 'bg-blue-500',
  progress_updated: 'bg-blue-500',
  task_added: 'bg-green-500',
  task_completed: 'bg-green-500',
  task_deleted: 'bg-red-500',
  invoice_created: 'bg-amber-500',
  invoice_paid: 'bg-amber-500',
  time_logged: 'bg-purple-500',
  note_added: 'bg-gray-400',
  file_attached: 'bg-gray-400',
};

export default function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const activities = useActivityStore((s) => s.getActivities(projectId));

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs mt-1">Actions you take will be recorded here.</p>
      </div>
    );
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = differenceInDays(new Date(), date);
    if (days < 7) return formatDistanceToNow(date, { addSuffix: true });
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex items-start gap-3 pl-0">
            {/* Dot */}
            <div className={`relative z-10 size-[10px] rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[activity.type] || 'bg-gray-400'}`} style={{ marginLeft: '6px' }} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{activity.description}</p>
              {activity.meta && activity.meta.from && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Previously: {activity.meta.from}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {formatTimestamp(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
