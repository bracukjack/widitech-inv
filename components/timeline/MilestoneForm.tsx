"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { milestoneSchema, MilestoneFormData } from "@/lib/schemas";
import { TimelinePhase } from "@/types";
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

const MILESTONE_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // purple
  "#0f766e", // teal
  "#d97706", // amber
  "#b91c1c", // red
  "#16a34a", // green
];

interface MilestoneFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phases: TimelinePhase[];
  defaultPhaseId?: string | null;
  defaultValues?: Partial<MilestoneFormData>;
  onSubmit: (data: MilestoneFormData) => void;
  mode?: "create" | "edit";
}

export default function MilestoneForm({
  open,
  onOpenChange,
  phases,
  defaultPhaseId,
  defaultValues,
  onSubmit,
  mode = "create",
}: MilestoneFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: "",
      date: "",
      description: "",
      color: MILESTONE_COLORS[0],
      phaseId: defaultPhaseId ?? null,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        date: "",
        description: "",
        color: MILESTONE_COLORS[0],
        phaseId: defaultPhaseId ?? null,
        ...defaultValues,
      });
    }
  }, [open]);

  const watchColor = watch("color");

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Milestone" : "Edit Milestone"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ms-title">Title *</Label>
            <Input
              id="ms-title"
              placeholder="e.g. Design approval"
              autoFocus
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="ms-date">Date *</Label>
            <Input id="ms-date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ms-desc">Description</Label>
            <Textarea
              id="ms-desc"
              placeholder="Optional"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {MILESTONE_COLORS.map((c) => (
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
                />
              ))}
            </div>
          </div>

          {/* Phase link */}
          <div className="space-y-1.5">
            <Label htmlFor="ms-phase">Phase</Label>
            <Controller
              name="phaseId"
              control={control}
              render={({ field }) => (
                <select
                  id="ms-phase"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : e.target.value)
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Project level (not tied to a phase)</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Add Milestone" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
