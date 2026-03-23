"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeLogSchema, TimeLogFormData } from "@/lib/schemas";
import { useProjectStore } from "@/lib/projectStore";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TimeLogFormData) => void;
  defaultValues?: Partial<TimeLogFormData>;
  mode: "create" | "edit";
}

export default function TimeLogForm({ open, onOpenChange, onSubmit, defaultValues, mode }: TimeLogFormProps) {
  const projects = useProjectStore((s) => s.projects).filter((p) => !p.isDeleted);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeLogFormData>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      projectId: "",
      description: "",
      duration: 60,
      hourlyRate: 100000,
      billable: true,
      date: format(new Date(), "yyyy-MM-dd"),
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: TimeLogFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Time Entry" : "Edit Time Entry"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Log time spent on a project." : "Update time entry details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div>
            <Label>Project *</Label>
            <select {...register("projectId")} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && <p className="text-xs text-red-600 mt-1">{errors.projectId.message}</p>}
          </div>

          <div>
            <Label>Description *</Label>
            <Input {...register("description")} placeholder="What did you work on?" />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes) *</Label>
              <Input type="number" {...register("duration", { valueAsNumber: true })} />
              {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <Label>Hourly Rate</Label>
              <Input type="number" {...register("hourlyRate", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <Label>Date *</Label>
            <Input type="date" {...register("date")} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("billable")} className="rounded" />
            Billable
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Add Entry" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
