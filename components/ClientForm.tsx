"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormData } from "@/lib/schemas";
import { useState } from "react";
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
import { Star, X, Plus } from "lucide-react";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: Partial<ClientFormData>;
  mode: "create" | "edit";
}

export default function ClientForm({ open, onOpenChange, onSubmit, defaultValues, mode }: ClientFormProps) {
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      instagram: "",
      address: "",
      rating: 3,
      tags: [],
      ...defaultValues,
    },
  });

  const tags = watch("tags");
  const rating = watch("rating");

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue("tags", tags.filter((t) => t !== tag));
  };

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new client to your CRM." : "Update client information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div>
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="Client name" />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Company</Label>
            <Input {...register("company")} placeholder="Company name" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="email@example.com" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+62 812..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Instagram</Label>
              <Input {...register("instagram")} placeholder="@handle" />
            </div>
            <div>
              <Label>Address</Label>
              <Input {...register("address")} placeholder="City, Country" />
            </div>
          </div>

          <div>
            <Label>Rating</Label>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setValue("rating", (i + 1) as 1 | 2 | 3 | 4 | 5)}
                >
                  <Star className={`size-5 cursor-pointer transition-colors ${i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1"
              />
              <Button type="button" size="sm" variant="outline" onClick={addTag}>
                <Plus className="size-3.5" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Add Client" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
