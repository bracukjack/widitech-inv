"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phaseSchema, PhaseFormData } from "@/lib/schemas";
import {
  PHASE_STATUS_CONFIG,
  PHASE_COLOR_PALETTE,
} from "@/lib/constants";
import { Project, TimelinePhase, PhaseStatus } from "@/types";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface PhaseFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Pick<Project, "startDate" | "deadline">;
  defaultValues?: Partial<PhaseFormData>;
  phaseCount?: number; // used to pick default color
  onSubmit: (data: PhaseFormData) => void;
  mode?: "create" | "edit";
}

const PHASE_STATUSES: PhaseStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "on_hold",
  "cancelled",
];

export default function PhaseForm({
  open,
  onOpenChange,
  project,
  defaultValues,
  phaseCount = 0,
  onSubmit,
  mode = "create",
}: PhaseFormProps) {
  const defaultColor =
    PHASE_COLOR_PALETTE[phaseCount % PHASE_COLOR_PALETTE.length];

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PhaseFormData>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "not_started",
      startDate: "",
      endDate: "",
      color: defaultColor,
      progressMode: "manual",
      progress: 0,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        description: "",
        status: "not_started",
        startDate: "",
        endDate: "",
        color: defaultColor,
        progressMode: "manual",
        progress: 0,
        ...defaultValues,
      });
    }
  }, [open]);

  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchProgressMode = watch("progressMode");
  const watchProgress = watch("progress");
  const watchColor = watch("color");

  const durationDays =
    watchStartDate && watchEndDate
      ? differenceInDays(new Date(watchEndDate), new Date(watchStartDate)) + 1
      : null;

  const dateWarning = (() => {
    if (!watchStartDate || !watchEndDate) return null;
    if (watchStartDate < project.startDate || watchEndDate > project.deadline)
      return "Phase dates extend beyond project timeline";
    return null;
  })();

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Phase" : "Edit Phase"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ph-name">Phase name *</Label>
            <Input
              id="ph-name"
              placeholder="e.g. Phase 1 — Discovery"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ph-desc">Description</Label>
            <Textarea
              id="ph-desc"
              placeholder="Optional, max 200 characters"
              rows={2}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="ph-status">Status *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  id="ph-status"
                  {...field}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {PHASE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PHASE_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ph-start">Start date *</Label>
              <Input id="ph-start" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph-end">End date *</Label>
              <Input id="ph-end" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-xs text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          {durationDays !== null && durationDays > 0 && (
            <p className="text-xs text-muted-foreground font-mono -mt-2">
              {durationDays} day{durationDays !== 1 ? "s" : ""}
            </p>
          )}
          {dateWarning && (
            <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              {dateWarning}
            </div>
          )}

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color *</Label>
            <div className="flex flex-wrap gap-2">
              {PHASE_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    watchColor === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Progress mode */}
          <div className="space-y-1.5">
            <Label>Progress mode *</Label>
            <Controller
              name="progressMode"
              control={control}
              render={({ field }) => (
                <div className="flex rounded-lg border border-input overflow-hidden w-fit">
                  {(["manual", "auto"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => field.onChange(m)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                        field.value === m
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m === "manual" ? "Manual" : "Auto from tasks"}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {watchProgressMode === "manual" && (
            <div className="space-y-1.5">
              <Label htmlFor="ph-progress">
                Progress:{" "}
                <span className="font-mono text-foreground">
                  {watchProgress}%
                </span>
              </Label>
              <Controller
                name="progress"
                control={control}
                render={({ field }) => (
                  <input
                    id="ph-progress"
                    type="range"
                    min={0}
                    max={100}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                )}
              />
            </div>
          )}

          {watchProgressMode === "auto" && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Progress will be calculated automatically from linked tasks.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save Phase</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
