"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectFormData } from "@/lib/schemas";
import { Project, ProjectCategory, ProjectStatus } from "@/types";
import { useClientStore } from "@/lib/clientStore";
import { STATUS_CONFIG, CATEGORY_CONFIG, PROJECT_STATUSES } from "@/lib/constants";
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
import { Textarea } from "@/components/ui/textarea";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => void;
  defaultValues?: Partial<ProjectFormData>;
  mode: "create" | "edit";
}

export default function ProjectForm({ open, onOpenChange, onSubmit, defaultValues, mode }: ProjectFormProps) {
  const clients = useClientStore((s) => s.clients).filter((c) => !c.isDeleted);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      clientId: "",
      category: "web_dev",
      status: "lead",
      description: "",
      contractValue: 0,
      dpAmount: 0,
      dpPaid: false,
      finalPaid: false,
      startDate: new Date().toISOString().split("T")[0],
      deadline: "",
      hourlyRate: 100000,
      estimatedHours: 0,
      notes: "",
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: ProjectFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Project" : "Edit Project"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new project to your workspace." : "Update project details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Project Name *</Label>
              <Input {...register("name")} placeholder="E.g. Company Website Redesign" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Client *</Label>
              <select {...register("clientId")} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>}
            </div>

            <div>
              <Label>Category</Label>
              <select {...register("category")} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                {(Object.keys(CATEGORY_CONFIG) as ProjectCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Status</Label>
              <select {...register("status")} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Contract Value (IDR) *</Label>
              <Input type="number" {...register("contractValue", { valueAsNumber: true })} placeholder="0" />
              {errors.contractValue && <p className="text-xs text-red-600 mt-1">{errors.contractValue.message}</p>}
            </div>

            <div>
              <Label>Down Payment Amount</Label>
              <Input type="number" {...register("dpAmount", { valueAsNumber: true })} placeholder="0" />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("dpPaid")} className="rounded" />
                DP Paid
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("finalPaid")} className="rounded" />
                Final Paid
              </label>
            </div>

            <div>
              <Label>Start Date *</Label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <Label>Deadline *</Label>
              <Input type="date" {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-red-600 mt-1">{errors.deadline.message}</p>}
            </div>

            <div>
              <Label>Hourly Rate</Label>
              <Input type="number" {...register("hourlyRate", { valueAsNumber: true })} />
            </div>

            <div>
              <Label>Estimated Hours</Label>
              <Input type="number" {...register("estimatedHours", { valueAsNumber: true })} />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Brief project description..." rows={2} />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Internal notes..." rows={2} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
