"use client";

import { useState, useRef, useEffect } from "react";
import { Project, Timeline, TimelinePhase } from "@/types";
import { useTimelineStore } from "@/lib/timelineStore";
import { useProjectStore } from "@/lib/projectStore";
import { getDisplayRange, getColumnUnit, getInitialScrollLeft } from "@/lib/gantt";
import { TimelineFormData, PhaseFormData, MilestoneFormData } from "@/lib/schemas";
import { showCreated, showDeleted, showUpdated } from "@/lib/toasts";
import {
  CalendarRange,
  Plus,
  LayoutList,
  BarChart2,
  Pencil,
  Crosshair,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TimelineForm from "./TimelineForm";
import PhaseForm from "./PhaseForm";
import MilestoneForm from "./MilestoneForm";
import LinkTasksModal from "./LinkTasksModal";
import GanttView from "./GanttView";
import ListView from "./ListView";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface TimelineTabProps {
  project: Project;
}

type ViewMode = "gantt" | "list";

export default function TimelineTab({ project }: TimelineTabProps) {
  const [viewMode, setViewMode]           = useState<ViewMode>("gantt");
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingPhase, setEditingPhase]   = useState<TimelinePhase | null>(null);
  const [linkTasksFor, setLinkTasksFor]   = useState<TimelinePhase | null>(null);
  const [addMsFor, setAddMsFor]           = useState<TimelinePhase | null>(null);
  const [deletePhaseTarget, setDeletePhaseTarget] = useState<TimelinePhase | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const timelines         = useTimelineStore((s) => s.timelines);
  const createTimeline    = useTimelineStore((s) => s.createTimeline);
  const updateTimeline    = useTimelineStore((s) => s.updateTimeline);
  const addPhase          = useTimelineStore((s) => s.addPhase);
  const updatePhase       = useTimelineStore((s) => s.updatePhase);
  const softDeletePhase   = useTimelineStore((s) => s.softDeletePhase);
  const getActivePhases   = useTimelineStore((s) => s.getActivePhases);
  const addMilestone      = useTimelineStore((s) => s.addMilestone);
  const linkTaskToPhase   = useTimelineStore((s) => s.linkTaskToPhase);
  const unlinkTaskFromPhase = useTimelineStore((s) => s.unlinkTaskFromPhase);
  const recalculate       = useTimelineStore((s) => s.recalculatePhaseProgress);

  const updateProject = useProjectStore((s) => s.updateProject);

  const timeline = timelines.find(
    (t) => t.projectId === project.id && !t.isDeleted
  );
  const activePhases = timeline ? getActivePhases(timeline.id) : [];
  const activeTasks  = project.tasks.filter((t) => !t.isDeleted);

  const hasProjectDates = !!project.startDate && !!project.deadline;

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!timeline) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key === "P") { e.preventDefault(); setShowPhaseForm(true); }
      if (mod && e.shiftKey && e.key === "M") { e.preventDefault(); setShowMilestoneForm(true); }
      if (mod && e.key === "\\") { e.preventDefault(); setViewMode((v) => (v === "gantt" ? "list" : "gantt")); }
      if (mod && e.key === "t") {
        e.preventDefault();
        if (scrollRef.current) {
          const { start, totalDays } = getDisplayRange(activePhases, project);
          const unit   = getColumnUnit(totalDays);
          const target = getInitialScrollLeft(start, scrollRef.current.clientWidth, unit);
          scrollRef.current.scrollTo({ left: target, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [timeline, activePhases, project]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleCreateTimeline = (data: TimelineFormData) => {
    const tl = createTimeline(project.id, data.title, data.description);
    updateProject(project.id, { timelineId: tl.id });
    setShowTimelineForm(false);
    showCreated("Timeline");
  };

  const handleAddPhase = (data: PhaseFormData) => {
    if (!timeline) return;
    addPhase(timeline.id, {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      progressMode: data.progressMode,
      progress: data.progress,
      sortOrder: activePhases.length,
      taskIds: [],
    });
    setShowPhaseForm(false);
    showCreated("Phase");
  };

  const handleEditPhase = (phase: TimelinePhase) => {
    setEditingPhase(phase);
    setShowPhaseForm(true);
  };

  const handleUpdatePhase = (data: PhaseFormData) => {
    if (!timeline || !editingPhase) return;
    updatePhase(timeline.id, editingPhase.id, {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      progressMode: data.progressMode,
      progress: data.progressMode === "manual" ? data.progress : editingPhase.progress,
    });
    setEditingPhase(null);
    setShowPhaseForm(false);
    showUpdated("Phase");
  };

  const handleDeletePhase = () => {
    if (!timeline || !deletePhaseTarget) return;
    softDeletePhase(timeline.id, deletePhaseTarget.id);
    setDeletePhaseTarget(null);
    showDeleted("Phase");
  };

  const handleAddMilestone = (data: MilestoneFormData) => {
    if (!timeline) return;
    addMilestone(timeline.id, data.phaseId, {
      title: data.title,
      date: data.date,
      description: data.description,
      color: data.color,
      isCompleted: false,
    });
    setShowMilestoneForm(false);
    setAddMsFor(null);
    showCreated("Milestone");
  };

  const handleLinkTasksSave = (phase: TimelinePhase, selectedIds: string[]) => {
    if (!timeline) return;
    // Unlink removed, link new
    const toUnlink = phase.taskIds.filter((id) => !selectedIds.includes(id));
    const toLink   = selectedIds.filter((id) => !phase.taskIds.includes(id));

    toUnlink.forEach((id) => unlinkTaskFromPhase(timeline.id, phase.id, id));
    toLink.forEach((id)   => linkTaskToPhase(timeline.id, phase.id, id));

    recalculate(timeline.id, phase.id, activeTasks);
    setLinkTasksFor(null);
  };

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    const { start, totalDays } = getDisplayRange(activePhases, project);
    const unit   = getColumnUnit(totalDays);
    const target = getInitialScrollLeft(start, scrollRef.current.clientWidth, unit);
    scrollRef.current.scrollTo({ left: target, behavior: "smooth" });
  };

  // ── Render guards ─────────────────────────────────────────────────────

  // No project dates
  if (!hasProjectDates) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <CalendarRange className="size-10 mx-auto mb-4 text-muted-foreground/40" />
        <p className="font-medium text-foreground mb-1">Timeline unavailable</p>
        <p className="text-sm text-muted-foreground">
          Set a start date and deadline on the project first.
        </p>
      </div>
    );
  }

  // No timeline yet
  if (!timeline) {
    return (
      <>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CalendarRange className="size-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-semibold text-foreground mb-1">No timeline yet</p>
          <p className="text-sm text-muted-foreground mb-5">
            Plan your project phases, milestones, and delivery schedule.
          </p>
          <Button onClick={() => setShowTimelineForm(true)}>
            <Plus className="size-4 mr-1" />
            Create Timeline
          </Button>
        </div>

        <TimelineForm
          open={showTimelineForm}
          onOpenChange={setShowTimelineForm}
          onSubmit={handleCreateTimeline}
          mode="create"
        />
      </>
    );
  }

  // ── Main timeline UI ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{timeline.title}</h3>
          <button
            onClick={() => setShowTimelineForm(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Edit timeline"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll to today */}
          {viewMode === "gantt" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToToday}
              title="Scroll to today (⌘T)"
            >
              <Crosshair className="size-4" />
            </Button>
          )}

          {/* Add milestone */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMilestoneForm(true)}
            title="Add milestone (⌘⇧M)"
          >
            <Plus className="size-3.5 mr-1" />
            Milestone
          </Button>

          {/* Add phase */}
          <Button
            size="sm"
            onClick={() => { setEditingPhase(null); setShowPhaseForm(true); }}
            title="Add phase (⌘⇧P)"
          >
            <Plus className="size-3.5 mr-1" />
            Phase
          </Button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("gantt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "gantt"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <BarChart2 className="size-3.5" />
              Gantt
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutList className="size-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* View content */}
      {viewMode === "gantt" ? (
        <GanttView
          project={project}
          timeline={timeline}
          activePhases={activePhases}
          allTasks={activeTasks}
          onEditPhase={handleEditPhase}
          scrollRef={scrollRef}
        />
      ) : (
        <ListView
          timeline={timeline}
          activePhases={activePhases}
          allTasks={activeTasks}
          deadline={project.deadline}
          onEditPhase={handleEditPhase}
          onLinkTasks={(phase) => setLinkTasksFor(phase)}
          onAddMilestone={(phase) => { setAddMsFor(phase); setShowMilestoneForm(true); }}
          onDeletePhase={(phase) => setDeletePhaseTarget(phase)}
        />
      )}

      {/* Modals */}
      <TimelineForm
        open={showTimelineForm}
        onOpenChange={setShowTimelineForm}
        defaultValues={{ title: timeline.title, description: timeline.description }}
        onSubmit={(data) => {
          updateTimeline(timeline.id, data);
          setShowTimelineForm(false);
          showUpdated("Timeline");
        }}
        mode="edit"
      />

      <PhaseForm
        open={showPhaseForm}
        onOpenChange={(v) => {
          setShowPhaseForm(v);
          if (!v) setEditingPhase(null);
        }}
        project={project}
        phaseCount={activePhases.length}
        defaultValues={
          editingPhase
            ? {
                name: editingPhase.name,
                description: editingPhase.description,
                status: editingPhase.status,
                startDate: editingPhase.startDate,
                endDate: editingPhase.endDate,
                color: editingPhase.color,
                progressMode: editingPhase.progressMode,
                progress: editingPhase.progress,
              }
            : undefined
        }
        onSubmit={editingPhase ? handleUpdatePhase : handleAddPhase}
        mode={editingPhase ? "edit" : "create"}
      />

      <MilestoneForm
        open={showMilestoneForm}
        onOpenChange={(v) => {
          setShowMilestoneForm(v);
          if (!v) setAddMsFor(null);
        }}
        phases={activePhases}
        defaultPhaseId={addMsFor?.id ?? null}
        onSubmit={handleAddMilestone}
      />

      {linkTasksFor && (
        <LinkTasksModal
          open={!!linkTasksFor}
          onOpenChange={(v) => { if (!v) setLinkTasksFor(null); }}
          phase={linkTasksFor}
          allTasks={activeTasks}
          linkedPhases={activePhases}
          onSave={(ids) => handleLinkTasksSave(linkTasksFor, ids)}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletePhaseTarget}
        onOpenChange={(v) => { if (!v) setDeletePhaseTarget(null); }}
        title="Delete phase?"
        description={`"${deletePhaseTarget?.name}" will be moved to Trash. Linked tasks will remain on the project but will be unlinked from this phase.`}
        onConfirm={handleDeletePhase}
      />
    </div>
  );
}
