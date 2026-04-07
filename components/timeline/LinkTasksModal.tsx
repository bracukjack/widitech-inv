"use client";

import { useState } from "react";
import { Task, TimelinePhase } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkTasksModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phase: TimelinePhase;
  allTasks: Task[];
  linkedPhases: TimelinePhase[]; // all active phases (to detect already-linked tasks)
  onSave: (selectedTaskIds: string[]) => void;
}

export default function LinkTasksModal({
  open,
  onOpenChange,
  phase,
  allTasks,
  linkedPhases,
  onSave,
}: LinkTasksModalProps) {
  const activeTasks = allTasks.filter((t) => !t.isDeleted);

  // Tasks linked to OTHER phases
  const linkedToOther = new Set(
    linkedPhases
      .filter((p) => p.id !== phase.id)
      .flatMap((p) => p.taskIds)
  );

  const initialSelected = new Set(phase.taskIds);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected)
  );

  const toggle = (taskId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onOpenChange(false);
  };

  const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link tasks to {phase.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-72 overflow-y-auto py-2">
          {activeTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks on this project yet.
            </p>
          )}
          {activeTasks.map((task) => {
            const isOther = linkedToOther.has(task.id);
            const isChecked = selected.has(task.id);

            return (
              <label
                key={task.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors ${
                  isOther ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isOther}
                  onChange={() => !isOther && toggle(task.id)}
                  className="rounded border-input accent-primary"
                />
                <span className="flex-1 text-sm text-foreground truncate">
                  {task.title}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    PRIORITY_COLORS[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                )}
                {isOther && (
                  <span className="text-[10px] text-muted-foreground">
                    (linked)
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
