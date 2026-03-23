"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseFormData } from "@/lib/schemas";
import { ExpenseCategory } from "@/types";
import { EXPENSE_CATEGORY_CONFIG } from "@/lib/constants";
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

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormData) => void;
  defaultValues?: Partial<ExpenseFormData>;
  mode: "create" | "edit";
}

export default function ExpenseForm({ open, onOpenChange, onSubmit, defaultValues, mode }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "software",
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: ExpenseFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Expense" : "Edit Expense"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Record a new business expense." : "Update expense details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label>Category</Label>
            <select {...register("category")} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              {(Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Description *</Label>
            <Input {...register("description")} placeholder="What was this expense for?" />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <Label>Amount (IDR) *</Label>
            <Input type="number" {...register("amount", { valueAsNumber: true })} placeholder="0" />
            {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <Label>Date *</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Add Expense" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
