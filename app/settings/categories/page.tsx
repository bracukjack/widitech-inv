"use client";

import { useEffect, useState, useCallback } from "react";
import { useCategoryStore } from "@/lib/categoryStore";
import { formatIDR } from "@/lib/constants";
import { ProjectCategoryFull, RateUnit, SubCategory } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Breadcrumb from "@/components/layout/Breadcrumb";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Globe,
  Smartphone,
  Code2,
  Camera,
  ImageIcon,
  Video,
  Music,
  Palette,
  PenTool,
  FileText,
  BarChart,
  ShoppingCart,
  Building,
  Headphones,
  Cpu,
  Database,
  Shield,
  Mail,
  Megaphone,
  Film,
  Layout,
  Package,
  Wrench,
  Layers,
  type LucideIcon,
} from "lucide-react";

// ── Icon picker map ────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Smartphone,
  Code2,
  Camera,
  ImageIcon,
  Video,
  Music,
  Palette,
  PenTool,
  FileText,
  BarChart,
  ShoppingCart,
  Building,
  Headphones,
  Cpu,
  Database,
  Shield,
  Mail,
  Megaphone,
  Film,
  Layout,
  Package,
  Wrench,
  Layers,
};

const ICON_KEYS = Object.keys(ICON_MAP);

// ── Preset color swatches ──────────────────────────────────────
const COLOR_SWATCHES = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6366F1", "#14B8A6", "#A855F7",
];

// ── Rate unit options ──────────────────────────────────────────
const RATE_UNITS: { value: RateUnit; label: string }[] = [
  { value: "per_hour", label: "/hr" },
  { value: "per_session", label: "/session" },
  { value: "per_project", label: "/project" },
  { value: "per_day", label: "/day" },
];

// ── Helpers ────────────────────────────────────────────────────
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderIcon(name: string, className?: string) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ── Form state type ────────────────────────────────────────────
interface FormState {
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultRate: string;
  rateUnit: RateUnit;
  subCategories: { name: string; defaultRate: string }[];
}

const emptyForm: FormState = {
  name: "",
  description: "",
  icon: "Globe",
  color: COLOR_SWATCHES[0],
  defaultRate: "",
  rateUnit: "per_hour",
  subCategories: [],
};

// ════════════════════════════════════════════════════════════════
export default function CategoriesSettingsPage() {
  const [mounted, setMounted] = useState(false);

  const getCategories = useCategoryStore((s) => s.getCategories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const softDelete = useCategoryStore((s) => s.softDelete);
  const addSubCategory = useCategoryStore((s) => s.addSubCategory);
  const updateSubCategory = useCategoryStore((s) => s.updateSubCategory);
  const deleteSubCategory = useCategoryStore((s) => s.deleteSubCategory);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ProjectCategoryFull | null>(null);

  useEffect(() => {
    useCategoryStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const categories = getCategories().sort((a, b) => a.sortOrder - b.sortOrder);

  // ── Open modal ───────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((cat: ProjectCategoryFull) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      icon: cat.icon,
      color: cat.color,
      defaultRate: String(cat.defaultRate),
      rateUnit: cat.rateUnit,
      subCategories: cat.subCategories.map((s) => ({
        name: s.name,
        defaultRate: s.defaultRate != null ? String(s.defaultRate) : "",
      })),
    });
    setModalOpen(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const rate = Number(form.defaultRate) || 0;
    const slug = slugify(form.name);

    if (!form.name.trim()) return;

    if (editingId) {
      // update category fields
      updateCategory(editingId, {
        name: form.name.trim(),
        slug,
        description: form.description.trim() || undefined,
        icon: form.icon,
        color: form.color,
        defaultRate: rate,
        rateUnit: form.rateUnit,
      });

      // reconcile sub-categories
      const existing = getCategories().find((c) => c.id === editingId);
      if (existing) {
        // remove subs that no longer appear
        existing.subCategories.forEach((s) => {
          if (!form.subCategories.some((fs) => fs.name === s.name)) {
            deleteSubCategory(editingId, s.id);
          }
        });
        // add / update
        form.subCategories.forEach((fs) => {
          const match = existing.subCategories.find((s) => s.name === fs.name);
          if (match) {
            updateSubCategory(editingId, match.id, {
              name: fs.name,
              defaultRate: fs.defaultRate ? Number(fs.defaultRate) : undefined,
            });
          } else if (fs.name.trim()) {
            addSubCategory(editingId, {
              name: fs.name.trim(),
              defaultRate: fs.defaultRate ? Number(fs.defaultRate) : undefined,
            });
          }
        });
      }
    } else {
      addCategory({
        name: form.name.trim(),
        slug,
        description: form.description.trim() || undefined,
        icon: form.icon,
        color: form.color,
        defaultRate: rate,
        rateUnit: form.rateUnit,
        subCategories: form.subCategories
          .filter((s) => s.name.trim())
          .map((s) => ({
            id: crypto.randomUUID(),
            name: s.name.trim(),
            defaultRate: s.defaultRate ? Number(s.defaultRate) : undefined,
            createdAt: new Date().toISOString(),
          })),
        isDefault: false,
        sortOrder: categories.length,
      });
    }

    setModalOpen(false);
  }, [form, editingId, categories.length, getCategories, addCategory, updateCategory, addSubCategory, updateSubCategory, deleteSubCategory]);

  // ── Delete ───────────────────────────────────────────────────
  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      softDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, softDelete]);

  // ── Sub-category helpers ─────────────────────────────────────
  const addSub = () =>
    setForm((f) => ({
      ...f,
      subCategories: [...f.subCategories, { name: "", defaultRate: "" }],
    }));

  const removeSub = (idx: number) =>
    setForm((f) => ({
      ...f,
      subCategories: f.subCategories.filter((_, i) => i !== idx),
    }));

  const updateSub = (idx: number, key: "name" | "defaultRate", value: string) =>
    setForm((f) => ({
      ...f,
      subCategories: f.subCategories.map((s, i) =>
        i === idx ? { ...s, [key]: value } : s
      ),
    }));

  if (!mounted) return null;

  // ════════════════════════════════════════════════════════════
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Categories" },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define project types, default rates, and sub-categories.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          New Category
        </Button>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {categories.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No categories yet. Create one to get started.
          </div>
        )}

        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group"
          >
            {/* Number */}
            <span className="text-xs text-muted-foreground font-medium mt-1 w-5 text-right shrink-0">
              {idx + 1}.
            </span>

            {/* Color dot */}
            <span
              className="size-3 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: cat.color }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {renderIcon(cat.icon, "size-4 text-muted-foreground")}
                <span className="font-semibold text-foreground truncate">
                  {cat.name}
                </span>
                {cat.isDefault && (
                  <span className="text-[12px] uppercase tracking-wider font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    default
                  </span>
                )}
              </div>

              {cat.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {cat.description}
                </p>
              )}

              {/* Rate */}
              <p className="text-sm mt-1 font-[DM_Mono,monospace] text-foreground">
                {formatIDR(cat.defaultRate)}{" "}
                <span className="text-muted-foreground text-xs">
                  {RATE_UNITS.find((r) => r.value === cat.rateUnit)?.label}
                </span>
              </p>

              {/* Sub-categories */}
              {cat.subCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {cat.subCategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(cat)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="size-4" />
              </button>

              {!cat.isDefault && (
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Form Modal ─────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this work category."
                : "Create a new work category for your projects."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Icon Picker */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Icon
              </Label>
              <div className="grid grid-cols-8 gap-1.5 mt-2">
                {ICON_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: key }))}
                    className={cn(
                      "size-9 rounded-lg flex items-center justify-center border transition-colors",
                      form.icon === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent hover:bg-muted text-muted-foreground"
                    )}
                    title={key}
                  >
                    {renderIcon(key, "size-4")}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + slug preview */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Video Editing"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              {form.name && (
                <p className="text-xs text-muted-foreground">
                  Slug: <span className="font-mono">{slugify(form.name)}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  ({form.description.length}/100)
                </span>
              </Label>
              <textarea
                id="cat-desc"
                rows={2}
                maxLength={100}
                placeholder="Short description of this category"
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Color Picker */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Color
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      "size-7 rounded-full border-2 transition-transform",
                      form.color === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Default Rate */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-rate">Default Rate (IDR)</Label>
              <Input
                id="cat-rate"
                type="number"
                min={0}
                placeholder="500000"
                value={form.defaultRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultRate: e.target.value }))
                }
              />
            </div>

            {/* Rate Unit Segmented Control */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Rate Unit
              </Label>
              <div className="flex rounded-lg border border-border overflow-hidden mt-1">
                {RATE_UNITS.map((ru) => (
                  <button
                    key={ru.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, rateUnit: ru.value }))
                    }
                    className={cn(
                      "flex-1 text-sm py-2 transition-colors text-center",
                      form.rateUnit === ru.value
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {ru.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Sub-categories
                </Label>
                <button
                  type="button"
                  onClick={addSub}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add
                </button>
              </div>

              {form.subCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No sub-categories. Click Add to create one.
                </p>
              )}

              {form.subCategories.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Sub-category name"
                    value={sub.name}
                    onChange={(e) => updateSub(idx, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Rate"
                    value={sub.defaultRate}
                    onChange={(e) =>
                      updateSub(idx, "defaultRate", e.target.value)
                    }
                    className="w-28"
                  />
                  <button
                    type="button"
                    onClick={() => removeSub(idx)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────── */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This category will be moved to trash. You can restore it later from the Trash page."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
