"use client";

import { TimelinePhase, Task, Timeline } from "@/types";
import { useTimelineStore } from "@/lib/timelineStore";
import PhaseCard from "./PhaseCard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface ListViewProps {
  timeline: Timeline;
  activePhases: TimelinePhase[];
  allTasks: Task[];
  deadline: string;
  onEditPhase: (phase: TimelinePhase) => void;
  onLinkTasks: (phase: TimelinePhase) => void;
  onAddMilestone: (phase: TimelinePhase) => void;
  onDeletePhase: (phase: TimelinePhase) => void;
}

export default function ListView({
  timeline,
  activePhases,
  allTasks,
  deadline,
  onEditPhase,
  onLinkTasks,
  onAddMilestone,
  onDeletePhase,
}: ListViewProps) {
  const reorderPhases = useTimelineStore((s) => s.reorderPhases);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activePhases.findIndex((p) => p.id === active.id);
    const newIndex = activePhases.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(activePhases, oldIndex, newIndex);
    reorderPhases(timeline.id, reordered.map((p) => p.id));
  };

  if (activePhases.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 text-sm">
        No phases yet. Add a phase to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activePhases.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {activePhases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              allTasks={allTasks}
              deadline={deadline}
              onEdit={onEditPhase}
              onLinkTasks={onLinkTasks}
              onAddMilestone={onAddMilestone}
              onDeletePhase={onDeletePhase}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
