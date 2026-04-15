"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Sparkles,
  GripVertical,
  Settings,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Invoice, Currency, LINE_ITEM_TEMPLATES } from "@/types/invoice";
import { useInvoiceDraftStore } from "@/lib/invoiceDraftStore";
import { getLogo } from "@/lib/invoiceStore";
import { formatCurrency } from "@/lib/formatCurrency";
import { THEME_IDS } from "@/lib/themes";
import Link from "next/link";

// --- Zod schema ---

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Required"),
  notes: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const paymentStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
  dueDate: z.string(),
  isPaid: z.boolean(),
});

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1, "Required"),
  dueDate: z.string().min(1, "Required"),
  currency: z.enum(["IDR", "USD", "EUR"]),
  status: z.enum(["Draft", "Sent", "Paid"]),
  freelancerName: z.string().min(1, "Required"),
  freelancerEmail: z.string().email("Invalid email"),
  freelancerPhone: z.string(),
  freelancerAddress: z.string(),
  freelancerBankAccount: z.string(),
  freelancerBankName: z.string(),
  freelancerBankAccountName: z.string(),
  clientName: z.string().min(1, "Required"),
  clientCompany: z.string(),
  clientEmail: z.string(),
  clientPhone: z.string(),
  clientAddress: z.string(),
  clientCountry: z.string(),
  lineItems: z.array(lineItemSchema).min(1, "At least one item required"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  taxType: z.enum(["percentage", "fixed"]),
  taxRate: z.number().min(0),
  paymentScheduleType: z.enum(["full", "scheduled"]),
  paymentStages: z.array(paymentStageSchema),
  notes: z.string(),
  paymentMethod: z.enum(["Bank Transfer", "PayPal", "Wise", "Other"]),
  theme: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// --- Sortable row ---

function SortableLineItemRow({
  id,
  index,
  register,
  remove,
  canRemove,
}: {
  id: string;
  index: number;
  register: ReturnType<typeof useForm<InvoiceFormData>>["register"];
  remove: (index: number) => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border">
      <td className="p-2 w-8">
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="p-2">
        <Input
          {...register(`lineItems.${index}.description`)}
          placeholder="Scope of Work"
          className="min-w-[180px]"
        />
      </td>
      <td className="p-2">
        <Input
          {...register(`lineItems.${index}.notes`)}
          placeholder="Description"
          className="min-w-[180px]"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
          min={0}
          className="w-32"
        />
      </td>
      <td className="p-2">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => remove(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}

// --- Tab config ---

const TABS = [
  { id: "details", label: "Invoice Details" },
  { id: "yourInfo", label: "Your Info" },
  { id: "client", label: "Client" },
  { id: "lineItems", label: "Line Items" },
  { id: "financial", label: "Discount & Tax" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// --- Main form ---

interface InvoiceFormProps {
  invoice: Invoice;
  onSave: (data: Invoice) => void;
  saveLabel?: string;
  onCancel?: () => void;
}

export default function InvoiceForm({
  invoice,
  onSave,
  saveLabel = "Save Invoice",
  onCancel,
}: InvoiceFormProps) {
  const setDraft = useInvoiceDraftStore((s) => s.setDraft);
  const [logo, setLogoState] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const normalizedInvoice: InvoiceFormData = {
    ...invoice,
    clientPhone: invoice.clientPhone || "",
    clientCountry: invoice.clientCountry || "",
    taxType: invoice.taxType || "percentage",
    paymentMethod: invoice.paymentMethod || "Bank Transfer",
    paymentScheduleType: invoice.paymentScheduleType || "full",
    paymentStages: invoice.paymentStages || [],
  };

  const {
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: normalizedInvoice,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "lineItems",
  });

  const {
    fields: stageFields,
    append: appendStage,
    remove: removeStage,
    replace: replaceStages,
  } = useFieldArray({
    control,
    name: "paymentStages",
  });

  // Sync form → Zustand store on every change
  useEffect(() => {
    const subscription = watch((value) => {
      setDraft(value as Invoice);
    });
    return () => subscription.unsubscribe();
  }, [watch, setDraft]);

  // Initial sync
  useEffect(() => {
    setDraft(invoice);
    setLogoState(getLogo());
  }, [invoice, setDraft]);

  const currency = watch("currency");
  const lineItems = watch("lineItems");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const taxType = watch("taxType");
  const taxRate = watch("taxRate");
  const freelancerName = watch("freelancerName");
  const freelancerEmail = watch("freelancerEmail");
  const clientName = watch("clientName");
  const paymentScheduleType = watch("paymentScheduleType");
  const watchedStages = watch("paymentStages");

  // Tab validation state
  const tabErrors = useMemo(() => {
    const e = errors;
    return {
      details: !!(e.invoiceNumber || e.invoiceDate || e.dueDate),
      yourInfo: !!(e.freelancerName || e.freelancerEmail),
      client: !!(e.clientName),
      lineItems: !!(e.lineItems),
      financial: false,
    };
  }, [errors]);

  const tabComplete = useMemo(() => {
    const vals = getValues();
    return {
      details: !!(vals.invoiceDate && vals.dueDate && vals.invoiceNumber),
      yourInfo: !!(vals.freelancerName && vals.freelancerEmail),
      client: !!(vals.clientName),
      lineItems:
        (vals.lineItems?.length ?? 0) > 0 &&
        vals.lineItems?.every((li) => li.description && li.unitPrice > 0),
      financial: true,
    };
  }, [getValues, lineItems, freelancerName, freelancerEmail, clientName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subtotal calculation
  const subtotal = useMemo(
    () =>
      (lineItems || []).reduce(
        (sum, item) => sum + (item?.unitPrice || 0),
        0
      ),
    [lineItems]
  );

  const discountAmount = useMemo(() => {
    if (discountType === "percentage") return subtotal * ((discountValue || 0) / 100);
    return discountValue || 0;
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = subtotal - discountAmount;

  const taxAmount = useMemo(() => {
    if (taxType === "percentage") return afterDiscount * ((taxRate || 0) / 100);
    return taxRate || 0;
  }, [afterDiscount, taxType, taxRate]);

  const grandTotal = afterDiscount + taxAmount;

  const onSubmit = (data: InvoiceFormData) => {
    onSave(data as Invoice);
  };

  const addQuickItem = (description: string) => {
    append({ id: uuidv4(), description, notes: "", quantity: 1, unitPrice: 0 });
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const current = getValues("lineItems");
      replace(arrayMove(current, oldIndex, newIndex));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Pill-style tab bar */}
      <div className="sticky top-0 z-10 bg-card pb-3 -mx-5 px-5 pt-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasError = tabErrors[tab.id];
            const isComplete = tabComplete[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 snap-start min-w-[140px] px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isActive
                    ? "bg-[#0D7377] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
                {hasError && <span className="size-2 rounded-full bg-red-500 shrink-0" />}
                {!hasError && isComplete && <span className="size-2 rounded-full bg-green-500 shrink-0" />}
                {!hasError && !isComplete && <span className="size-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 mt-2">
        {/* Tab 1: Invoice Details */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input id="invoiceNumber" {...register("invoiceNumber")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input id="invoiceDate" type="date" {...register("invoiceDate")} />
              {errors.invoiceDate && (
                <p className="text-xs text-destructive mt-1">{errors.invoiceDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-xs text-destructive mt-1">{errors.dueDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as Currency)}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="theme">Invoice Theme</Label>
              <Controller
                control={control}
                name="theme"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_IDS.map((tid) => (
                        <SelectItem key={tid} value={tid}>
                          {tid.charAt(0).toUpperCase() + tid.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Your Information */}
        {activeTab === "yourInfo" && (
          <div className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Settings className="size-4" />
              Loaded from your profile · Override below for this invoice only
            </span>
            <Link href="/settings" className="text-primary font-medium hover:underline text-xs">
              Edit in Settings →
            </Link>
          </div>
          {logo && (
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="size-12 rounded-lg object-cover border border-border" />
              <span className="text-xs text-muted-foreground">Logo from Settings</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="freelancerName">Name</Label>
              <Input id="freelancerName" {...register("freelancerName")} placeholder="Your name" />
              {errors.freelancerName && (
                <p className="text-xs text-destructive mt-1">{errors.freelancerName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerEmail">Email</Label>
              <Input id="freelancerEmail" type="email" {...register("freelancerEmail")} placeholder="your@email.com" />
              {errors.freelancerEmail && (
                <p className="text-xs text-destructive mt-1">{errors.freelancerEmail.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerPhone">Phone</Label>
              <Input id="freelancerPhone" {...register("freelancerPhone")} placeholder="+62 xxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerAddress">Address</Label>
              <Input id="freelancerAddress" {...register("freelancerAddress")} placeholder="Street address, City" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerBankName">Bank Name</Label>
              <Input id="freelancerBankName" {...register("freelancerBankName")} placeholder="Bank name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerBankAccount">Bank Account Number</Label>
              <Input id="freelancerBankAccount" {...register("freelancerBankAccount")} placeholder="Account number" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freelancerBankAccountName">Account Holder Name</Label>
              <Input id="freelancerBankAccountName" {...register("freelancerBankAccountName")} placeholder="Account holder name" />
            </div>
          </div>
          </div>
        )}

        {/* Tab 3: Client Information */}
        {activeTab === "client" && (
          <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" {...register("clientName")} placeholder="Client name" />
              {errors.clientName && (
                <p className="text-xs text-destructive mt-1">{errors.clientName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientCompany">Company</Label>
              <Input id="clientCompany" {...register("clientCompany")} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientEmail">Email</Label>
              <Input id="clientEmail" type="email" {...register("clientEmail")} placeholder="client@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientPhone">Phone</Label>
              <Input id="clientPhone" {...register("clientPhone")} placeholder="+62 xxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientAddress">Address</Label>
              <Input id="clientAddress" {...register("clientAddress")} placeholder="Client address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientCountry">Country</Label>
              <Input id="clientCountry" {...register("clientCountry")} placeholder="Country" />
            </div>
          </div>
          </div>
        )}

        {/* Tab 4: Line Items */}
        {activeTab === "lineItems" && (
          <div className="space-y-4">
          {/* Quick-add templates */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
              <Sparkles className="size-3" /> Quick add:
            </span>
            {LINE_ITEM_TEMPLATES.map((tmpl) => (
              <Button key={tmpl} type="button" variant="outline" size="xs" onClick={() => addQuickItem(tmpl)}>
                {tmpl}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-2 w-8"></th>
                    <th className="p-2 font-medium">Scope of Work</th>
                    <th className="p-2 font-medium">Description</th>
                    <th className="p-2 font-medium w-32">Harga</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {fields.map((field, index) => (
                      <SortableLineItemRow
                        key={field.id}
                        id={field.id}
                        index={index}
                        register={register}
                        remove={remove}
                        canRemove={fields.length > 1}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: uuidv4(), description: "", notes: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="size-4 mr-1" /> Add Item
            </Button>
            <div className="text-sm text-muted-foreground">
              Subtotal: <span className="font-semibold text-foreground">{formatCurrency(subtotal, currency || "IDR")}</span>
            </div>
          </div>
          </div>
        )}

        {/* Tab 5: Discount & Tax */}
        {activeTab === "financial" && (
          <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discountType">Discount Type</Label>
              <Controller
                control={control}
                name="discountType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="discountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input
                id="discountValue"
                type="number"
                {...register("discountValue", { valueAsNumber: true })}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxType">Tax / PPN Type</Label>
              <Controller
                control={control}
                name="taxType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="taxType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax Value</Label>
              <Input
                id="taxRate"
                type="number"
                {...register("taxRate", { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="paymentMethod" className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Wise">Wise</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / Payment Terms</Label>
            <Textarea id="notes" {...register("notes")} rows={4} placeholder="Payment terms, notes..." />
          </div>

          <Separator />

          {/* Payment Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Payment Schedule</Label>
              <div className="flex rounded-lg overflow-hidden border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setValue("paymentScheduleType", "full")}
                  className={`px-3 py-1.5 transition-colors ${paymentScheduleType === "full" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  Full Payment
                </button>
                <button
                  type="button"
                  onClick={() => setValue("paymentScheduleType", "scheduled")}
                  className={`px-3 py-1.5 border-l border-border transition-colors ${paymentScheduleType === "scheduled" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  Payment Schedule
                </button>
              </div>
            </div>

            {paymentScheduleType === "scheduled" && (
              <div className="space-y-3">
                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                    <Sparkles className="size-3" /> Presets:
                  </span>
                  <Button type="button" variant="outline" size="xs"
                    onClick={() => replaceStages([
                      { id: uuidv4(), name: "Down Payment", type: "percentage", value: 50, dueDate: getValues("invoiceDate"), isPaid: false },
                      { id: uuidv4(), name: "Final Payment", type: "percentage", value: 50, dueDate: getValues("dueDate"), isPaid: false },
                    ])}>50% / 50%</Button>
                  <Button type="button" variant="outline" size="xs"
                    onClick={() => replaceStages([
                      { id: uuidv4(), name: "Down Payment", type: "percentage", value: 30, dueDate: getValues("invoiceDate"), isPaid: false },
                      { id: uuidv4(), name: "Final Payment", type: "percentage", value: 70, dueDate: getValues("dueDate"), isPaid: false },
                    ])}>30% / 70%</Button>
                  <Button type="button" variant="outline" size="xs"
                    onClick={() => replaceStages([
                      { id: uuidv4(), name: "Down Payment", type: "percentage", value: 33, dueDate: getValues("invoiceDate"), isPaid: false },
                      { id: uuidv4(), name: "Midpoint", type: "percentage", value: 33, dueDate: "", isPaid: false },
                      { id: uuidv4(), name: "Final Payment", type: "percentage", value: 34, dueDate: getValues("dueDate"), isPaid: false },
                    ])}>3 Milestones</Button>
                </div>

                {/* Stage rows */}
                <div className="space-y-2">
                  {stageFields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          {...register(`paymentStages.${index}.name`)}
                          placeholder="Stage name (e.g. Down Payment)"
                          className="flex-1 text-sm"
                        />
                        <Controller
                          control={control}
                          name={`paymentStages.${index}.isPaid`}
                          render={({ field: f }) => (
                            <button
                              type="button"
                              onClick={() => f.onChange(!f.value)}
                              title={f.value ? "Mark as unpaid" : "Mark as paid"}
                              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${f.value ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                            >
                              {f.value ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                              {f.value ? "Paid" : "Unpaid"}
                            </button>
                          )}
                        />
                        {stageFields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeStage(index)} className="shrink-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name={`paymentStages.${index}.type`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">% of total</SelectItem>
                                <SelectItem value="fixed">Fixed amount</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Input
                          type="number"
                          {...register(`paymentStages.${index}.value`, { valueAsNumber: true })}
                          min={0}
                          placeholder={watchedStages?.[index]?.type === "percentage" ? "50" : "0"}
                          className="w-24 text-sm"
                        />
                        <Input
                          type="date"
                          {...register(`paymentStages.${index}.dueDate`)}
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" size="sm"
                  onClick={() => appendStage({ id: uuidv4(), name: "", type: "percentage", value: 0, dueDate: "", isPaid: false })}>
                  <Plus className="size-4 mr-1" /> Add Stage
                </Button>

                {/* Allocation hint (% mode) */}
                {watchedStages?.every((s) => s?.type === "percentage") && (
                  (() => {
                    const total = watchedStages.reduce((s, st) => s + (st?.value || 0), 0);
                    const ok = Math.abs(total - 100) < 0.01;
                    return (
                      <p className={`text-xs ${ok ? "text-green-600" : "text-amber-600"}`}>
                        {total.toFixed(0)}% allocated{ok ? " ✓" : " — should equal 100%"}
                      </p>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal, currency || "IDR")}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Discount{discountType === "percentage" ? ` (${discountValue}%)` : ""}
                </span>
                <span className="font-medium text-red-500">-{formatCurrency(discountAmount, currency || "IDR")}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax{taxType === "percentage" ? ` (${taxRate}%)` : ""}
                </span>
                <span className="font-medium">{formatCurrency(taxAmount, currency || "IDR")}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal, currency || "IDR")}</span>
            </div>
            {paymentScheduleType === "scheduled" && watchedStages && watchedStages.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Schedule</p>
                {watchedStages.map((stage, i) => {
                  const amt = stage?.type === "percentage"
                    ? grandTotal * ((stage?.value || 0) / 100)
                    : (stage?.value || 0);
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full inline-block ${stage?.isPaid ? "bg-green-500" : "bg-amber-400"}`} />
                        {stage?.name || `Stage ${i + 1}`}
                      </span>
                      <span className={stage?.isPaid ? "text-green-600 line-through" : "font-medium"}>
                        {formatCurrency(amt, currency || "IDR")}
                      </span>
                    </div>
                  );
                })}
                {(() => {
                  const paid = watchedStages.reduce((sum, s) => {
                    if (!s?.isPaid) return sum;
                    return sum + (s.type === "percentage" ? grandTotal * (s.value / 100) : s.value);
                  }, 0);
                  const balance = grandTotal - paid;
                  return paid > 0 ? (
                    <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-1">
                      <span>Balance Due</span>
                      <span className="text-primary">{formatCurrency(balance, currency || "IDR")}</span>
                    </div>
                  ) : null;
                })()}
              </>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Always-visible action bar */}
      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border">
        <Button type="submit" className="flex-1 sm:flex-none">
          {saveLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
