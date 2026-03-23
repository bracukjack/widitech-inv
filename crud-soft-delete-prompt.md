# 🔄 PROMPT — Full CRUD + Soft Delete for All Modules
> This is a continuation prompt. The base app (Next.js 14, Tailwind, Zustand, localStorage) is already implemented.
> Paste this into Cursor or your AI tool and say: "Implement this on top of the existing codebase."

---

## OBJECTIVE

Implement **complete CRUD operations** across all modules with a **soft delete pattern** for all delete actions.

No record is ever permanently removed from localStorage. Deleted records are hidden from the UI but preserved in the store with `deletedAt` and `isDeleted` flags. A "Trash" section allows viewing and restoring deleted records.

---

## PART 1 — UPDATE ALL TYPE INTERFACES

Add soft delete fields to every interface in `src/types/index.ts`.

```typescript
// Add these fields to EVERY interface: Project, Task, Client, MeetingNote,
// Invoice, InvoiceItem, Expense, TimeLog

interface SoftDeletable {
  isDeleted: boolean;       // false by default
  deletedAt: string | null; // ISO timestamp, null if not deleted
}

// Updated interfaces — add SoftDeletable fields at the bottom of each:

export interface Project extends SoftDeletable {
  // ... all existing fields unchanged ...
  updatedAt: string;
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Task extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Client extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface MeetingNote extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Invoice extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Expense extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface TimeLog extends SoftDeletable {
  // ... all existing fields unchanged ...
  // new:
  isDeleted: boolean;
  deletedAt: string | null;
}
```

**Migration helper** — add to `src/lib/storage.ts`:
```typescript
// Migrate existing records that don't have soft delete fields yet
export function migrateSoftDelete<T extends object>(records: T[]): (T & { isDeleted: boolean; deletedAt: string | null })[] {
  return records.map(record => ({
    isDeleted: false,
    deletedAt: null,
    ...record,
  }));
}
```

Call `migrateSoftDelete()` inside each Zustand store's `onRehydrateStorage` callback to handle existing localStorage data gracefully.

---

## PART 2 — UPDATE ALL ZUSTAND STORES

### Pattern to apply to ALL stores

Every store must follow this pattern:

```typescript
// RULE 1: All queries/selectors must filter out deleted records by default
const activeRecords = state.records.filter(r => !r.isDeleted);

// RULE 2: softDelete replaces hardDelete everywhere
softDelete: (id: string) => set(state => ({
  records: state.records.map(r =>
    r.id === id
      ? { ...r, isDeleted: true, deletedAt: new Date().toISOString() }
      : r
  )
})),

// RULE 3: restore brings a record back
restore: (id: string) => set(state => ({
  records: state.records.map(r =>
    r.id === id
      ? { ...r, isDeleted: false, deletedAt: null }
      : r
  )
})),

// RULE 4: permanentDelete is only callable from the Trash view
permanentDelete: (id: string) => set(state => ({
  records: state.records.filter(r => r.id !== id)
})),

// RULE 5: getDeleted selector for Trash view
getDeleted: () => get().records.filter(r => r.isDeleted),
```

---

### `src/store/projectStore.ts` — full updated signature

```typescript
interface ProjectStore {
  projects: Project[];

  // CREATE
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) => Project;

  // READ (always exclude isDeleted by default)
  getProjects: () => Project[];                          // all active
  getProjectById: (id: string) => Project | undefined;  // only if not deleted
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  getProjectsByClient: (clientId: string) => Project[];
  getProjectsByCategory: (category: ProjectCategory) => Project[];
  searchProjects: (query: string) => Project[];

  // UPDATE
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: ProjectStatus) => void;

  // TASK CRUD (nested inside project)
  addTask: (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  softDeleteTask: (projectId: string, taskId: string) => void;
  restoreTask: (projectId: string, taskId: string) => void;
  permanentDeleteTask: (projectId: string, taskId: string) => void;
  getActiveTasks: (projectId: string) => Task[];
  getDeletedTasks: (projectId: string) => Task[];

  // DELETE (soft)
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => Project[];

  // AUTO-PROGRESS: recalculate progress from task completion %
  recalculateProgress: (projectId: string) => void;
}
```

---

### `src/store/clientStore.ts` — full updated signature

```typescript
interface ClientStore {
  clients: Client[];

  // CREATE
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => Client;

  // READ
  getClients: () => Client[];
  getClientById: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  getClientsByTag: (tag: string) => Client[];

  // UPDATE
  updateClient: (id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>) => void;
  updateRating: (id: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;

  // MEETING NOTES CRUD
  addNote: (clientId: string, data: Omit<MeetingNote, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateNote: (clientId: string, noteId: string, content: string) => void;
  softDeleteNote: (clientId: string, noteId: string) => void;
  restoreNote: (clientId: string, noteId: string) => void;
  permanentDeleteNote: (clientId: string, noteId: string) => void;
  getActiveNotes: (clientId: string) => MeetingNote[];

  // DELETE (soft)
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => Client[];
}
```

---

### `src/store/invoiceStore.ts` — full updated signature

```typescript
interface InvoiceStore {
  invoices: Invoice[];
  invoiceCounter: number;

  // CREATE
  addInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => Invoice;
  duplicateInvoice: (id: string) => Invoice; // clone as new draft

  // READ
  getInvoices: () => Invoice[];
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getInvoicesByClient: (clientId: string) => Invoice[];
  getInvoicesByProject: (projectId: string) => Invoice[];
  getOverdueInvoices: () => Invoice[];
  getUnpaidTotal: () => number;
  generateInvoiceNumber: () => string;

  // UPDATE
  updateInvoice: (id: string, updates: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>>) => void;
  updateStatus: (id: string, status: InvoiceStatus) => void;
  markAsSent: (id: string) => void;
  markAsPaid: (id: string, paidDate: string, paymentMethod?: string) => void;
  markAsOverdue: () => void; // auto-check all invoices past due date

  // DELETE (soft)
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => Invoice[];
}
```

---

### `src/store/financeStore.ts` — full updated signature

```typescript
interface FinanceStore {
  expenses: Expense[];
  manualIncomes: ManualIncome[]; // for cash payments outside invoices

  // EXPENSE CRUD
  addExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  softDeleteExpense: (id: string) => void;
  restoreExpense: (id: string) => void;
  permanentDeleteExpense: (id: string) => void;
  getExpenses: () => Expense[];
  getDeletedExpenses: () => Expense[];

  // MANUAL INCOME CRUD
  addManualIncome: (data: Omit<ManualIncome, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  updateManualIncome: (id: string, updates: Partial<ManualIncome>) => void;
  softDeleteManualIncome: (id: string) => void;
  restoreManualIncome: (id: string) => void;
  permanentDeleteManualIncome: (id: string) => void;
  getManualIncomes: () => ManualIncome[];

  // COMPUTED (always exclude deleted records)
  getTotalRevenue: (month?: number, year?: number) => number;
  getTotalExpenses: (month?: number, year?: number) => number;
  getNetProfit: (month?: number, year?: number) => number;
  getExpensesByCategory: (month?: number, year?: number) => Record<ExpenseCategory, number>;
  getMonthlyData: (year: number) => MonthlyFinanceData[];
}

// Add ManualIncome type to types/index.ts:
export interface ManualIncome extends SoftDeletable {
  id: string;
  description: string;
  amount: number;
  category: ProjectCategory;
  clientId?: string;
  date: string;
  notes?: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}
```

---

### `src/store/timeStore.ts` — full updated signature

```typescript
interface TimeStore {
  timeLogs: TimeLog[];
  activeTimer: ActiveTimer | null;

  // CREATE
  addManualLog: (data: Omit<TimeLog, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>) => void;
  startTimer: (projectId: string, description: string, hourlyRate: number) => void;
  stopTimer: (billable: boolean) => TimeLog;

  // READ
  getTimeLogs: (projectId?: string) => TimeLog[];
  getTimeLogById: (id: string) => TimeLog | undefined;
  getTimeLogsByDate: (date: string) => TimeLog[];
  getTodayLogs: () => TimeLog[];
  getThisWeekLogs: () => TimeLog[];

  // UPDATE
  updateTimeLog: (id: string, updates: Partial<Omit<TimeLog, 'id' | 'createdAt'>>) => void;
  toggleBillable: (id: string) => void;

  // DELETE (soft)
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => TimeLog[];

  // COMPUTED (exclude deleted)
  getTotalMinutes: (projectId?: string) => number;
  getTotalHours: (projectId?: string) => number;
  getBillableAmount: (projectId?: string) => number;
  getHoursByProject: (month?: number, year?: number) => Record<string, number>;
}
```

---

## PART 3 — CRUD UI REQUIREMENTS PER MODULE

### Global rules for all CRUD forms

```
CREATE:
- Triggered by a "+" or "New [Entity]" button
- Opens as a shadcn/ui Dialog (modal) — NOT a new page (except Project which can be full page)
- Form uses React Hook Form + Zod schema
- All required fields marked with *
- Submit button disabled while form is invalid
- On success: toast "✓ [Entity] created", modal closes, list refreshes

EDIT (Update):
- Each row/card has an Edit button (pencil icon) or accessible from detail page
- Pre-fills all current values into the same form component (reuse, pass initialData prop)
- Submit button label changes to "Save Changes"
- On success: toast "✓ Changes saved", form closes

SOFT DELETE:
- Triggered by a trash icon button on each row/card
- Shows a confirmation Dialog BEFORE deleting:
    Title: "Delete [Entity name]?"
    Body: "This will move [entity] to Trash. You can restore it anytime."
    Buttons: "Cancel" (secondary) | "Move to Trash" (destructive, red)
- On confirm: record gets isDeleted=true, deletedAt=now()
- Toast: "Moved to Trash · Undo" (the Undo button calls restore() immediately)
- Record disappears from the active list instantly
- The Undo window is 5 seconds — after 5s the toast dismisses naturally

RESTORE (from Trash):
- "Restore" button in Trash view
- Confirmation NOT required (non-destructive)
- Toast: "✓ Restored successfully"

PERMANENT DELETE (from Trash only):
- "Delete Forever" button — red, only visible in Trash view
- Confirmation Dialog required:
    Title: "Permanently delete [Entity name]?"
    Body: "This cannot be undone. The record will be gone forever."
    Buttons: "Cancel" | "Delete Forever" (red)
- This calls permanentDelete() from the store
```

---

### Projects CRUD

**Create** — "New Project" button in page header
```
Form fields (in order):
1. Project Name * (text)
2. Client * (searchable Select — shows active clients only)
3. Category * (Select: Web Dev / Mobile App / Software / Photography / Photo Editing)
4. Status * (Select: default "lead")
5. Contract Value * (number, IDR)
6. DP Amount (number, IDR, optional)
7. Start Date * (DatePicker)
8. Deadline * (DatePicker, must be after start date)
9. Estimated Hours (number, optional)
10. Hourly Rate (number, optional — if billing by hour)
11. Description (Textarea, optional)
12. Notes (Textarea, optional — internal only)
```

**Edit** — from project detail header (Edit button) or from list row (⋯ menu → Edit)
- Same form, pre-filled

**Delete** — from project detail header (⋯ menu → Move to Trash) or from list row (⋯ menu → Move to Trash)
- Soft deletes the project AND all its tasks (set isDeleted=true on all nested tasks)
- Does NOT soft delete linked invoices — invoices remain but show "Project deleted" label

**Inline edits** (no modal, direct on detail page):
- Progress: drag slider or click to set %
- Status: click badge → dropdown changes instantly
- Task completion: click checkbox → immediate toggle

---

### Tasks CRUD (nested in Project detail)

**Create** — "+ Add Task" button in Tasks tab
```
Inline form that appears below task list (not a modal):
1. Title * (text, autofocus)
2. Priority (toggle: Low / Medium / High — default Medium)
3. Due Date (DatePicker, optional)
4. Description (expandable Textarea, optional)
[Enter] to save, [Escape] to cancel
```

**Edit** — click task row to expand, shows edit fields inline

**Delete** — trash icon on hover, soft deletes only
- Soft deleted tasks hidden from active list
- Auto-recalculates project progress after delete (only count active tasks)

---

### Clients CRUD

**Create** — "New Client" button
```
Form fields:
1. Full Name * (text)
2. Company (text, optional)
3. Email (email input, optional)
4. Phone (text, optional)
5. Instagram (text, optional — with @ prefix display)
6. Address (textarea, optional)
7. Rating * (star selector 1-5, default 3)
8. Tags (tag input — type and press Enter to add, × to remove)
```

**Edit** — Edit button on client detail or client card

**Delete** — from client detail or client list (⋯ menu)
- Soft deletes client
- Projects linked to this client remain — they show "[Client deleted]" label in grey
- Client does NOT appear in project form's client dropdown after deletion

**Meeting Notes CRUD** (within Client detail):
- **Create**: click "+ Add Note", shows inline textarea with date picker, Enter to save
- **Edit**: click note text → turns into inline editable textarea, save on blur or Enter
- **Delete**: × button on hover → soft delete (no confirmation needed for notes, just undo toast)

---

### Invoices CRUD

**Create** — "Generate Invoice" button
```
Form fields:
1. Invoice Type * (DP / Final / Full)
2. Client * (Select — active clients only)
3. Project (Select — filtered by selected client, optional)
4. Issue Date * (DatePicker, default today)
5. Due Date * (DatePicker, default today + 14 days)
6. Line Items * (dynamic table):
   - Add row button
   - Per row: Description*, Qty*, Unit Price*, Total (auto)
   - Remove row button
7. Tax Rate (number %, default from settings)
8. Subtotal (auto-calculated, read-only)
9. Tax Amount (auto-calculated, read-only)
10. Grand Total (auto-calculated, read-only, DM Mono, large)
11. Notes / Payment instructions (textarea, pre-filled from settings)
```

**Edit** — only allowed when status is `draft` or `sent`
- If status is `paid` or `cancelled`, Edit button is hidden, show "View Only" label instead

**Delete** — soft delete only
- Paid invoices: show warning "This invoice is marked as paid. Moving to Trash will affect your financial reports." — still allow but warn
- Cancelled invoices: no warning

---

### Finance (Expenses) CRUD

**Create** — "+ Add Expense" button
```
Form fields:
1. Date * (DatePicker, default today)
2. Category * (Select: Software/Hardware/Marketing/Education/Operational/Outsource/Tax/Other)
3. Description * (text)
4. Amount * (number, IDR)
5. Project (Select — optional, links expense to a project)
6. Receipt/Note (text, optional — just a filename or note, no actual upload)
```

**Edit** — edit icon on expense row

**Delete** — soft delete from expense row

**Manual Income CRUD**:
- Same pattern — separate section below expenses
- Fields: Date, Description, Amount, Category, Client (optional), Notes

---

### Time Logs CRUD

**Create (Manual)** — "+ Manual Entry" button
```
Form fields:
1. Project * (Select — active projects only)
2. Description * (text)
3. Date * (DatePicker, default today)
4. Start Time * (time input HH:MM)
5. End Time * (time input HH:MM, must be after start)
6. Duration (auto-calculated from start/end, read-only display)
7. Billable (toggle, default true)
8. Hourly Rate (number, pre-filled from project's rate or category default)
9. Billable Amount (auto-calculated, read-only)
```

**Edit** — edit icon on log row
- Cannot edit if timer is currently running for that log

**Delete** — soft delete from log row

---

## PART 4 — TRASH PAGE

Add a new route: `src/app/trash/page.tsx`

Add to sidebar under Settings:
```
  Trash      → /trash   (with count badge if items exist)
```

### Trash page layout

```
Page header: "Trash" + "Empty Trash" button (far right, red, only if items exist)

Tabs: Projects | Tasks | Clients | Invoices | Expenses | Time Logs

Each tab shows a table of soft-deleted records for that entity:
Columns: [Entity name/title] | Deleted on | [Restore button] | [Delete Forever button]

"Deleted on" formatted as: "2 days ago" (relative) + tooltip showing full date

Empty state per tab: "No deleted [entities]" with ghost icon

"Empty Trash" button:
- Deletes ALL records across all tabs permanently
- Requires confirmation: "Permanently delete all X items in Trash? This cannot be undone."
- Only shows count of items actually in trash

Auto-purge policy (optional, implement in Settings):
- Setting: "Auto-permanently delete trash items older than [30/60/90/never] days"
- Default: never (manual only)
- Runs check on app load via useEffect in root layout
```

---

## PART 5 — FORM COMPONENTS ARCHITECTURE

Create reusable form components to avoid duplication:

```
src/components/forms/
├── ProjectForm.tsx      # Used for both create and edit
├── ClientForm.tsx
├── InvoiceForm.tsx
├── ExpenseForm.tsx
├── TimeLogForm.tsx
├── ManualIncomeForm.tsx
└── shared/
    ├── FormModal.tsx    # shadcn Dialog wrapper with consistent header/footer
    ├── DeleteConfirmDialog.tsx   # reusable soft delete confirmation
    ├── PermanentDeleteDialog.tsx # reusable permanent delete confirmation
    ├── CurrencyInput.tsx         # IDR formatted number input
    ├── DatePickerField.tsx       # wrapped shadcn DatePicker with RHF
    ├── StarRating.tsx            # 1-5 star interactive selector
    └── TagInput.tsx              # tag creation with × removal
```

### FormModal.tsx pattern
```tsx
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}
// Renders shadcn Dialog with consistent padding, title, and footer slot
// Always closeable with Escape key
// Clicking backdrop closes modal (unless form is dirty — then show "Discard changes?" prompt)
```

### DeleteConfirmDialog.tsx pattern
```tsx
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;       // e.g. "Website Redesign" or "Budi Santoso"
  entityType: string;       // e.g. "project" or "client"
  onConfirm: () => void;
  warningMessage?: string;  // optional extra warning (e.g. for paid invoices)
}
```

---

## PART 6 — ZOD VALIDATION SCHEMAS

Create `src/lib/schemas.ts` with Zod schemas for all forms:

```typescript
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  clientId: z.string().min(1, 'Client is required'),
  category: z.enum(['web_dev', 'mobile_app', 'software', 'photography', 'photo_editing']),
  status: z.enum(['lead', 'negotiation', 'dp_paid', 'in_progress', 'revision', 'pending', 'done', 'cancelled']),
  contractValue: z.number({ invalid_type_error: 'Must be a number' }).min(0),
  dpAmount: z.number().min(0).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  estimatedHours: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
}).refine(data => new Date(data.deadline) >= new Date(data.startDate), {
  message: 'Deadline must be after start date',
  path: ['deadline'],
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  instagram: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()),
});

export const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.enum(['software', 'hardware', 'marketing', 'education', 'operational', 'outsource', 'tax', 'other']),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number({ invalid_type_error: 'Must be a number' }).min(1, 'Amount must be greater than 0'),
  projectId: z.string().optional(),
  receipt: z.string().optional(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  total: z.number(),
});

export const invoiceSchema = z.object({
  type: z.enum(['dp', 'final', 'full']),
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().optional(),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional(),
}).refine(data => new Date(data.dueDate) >= new Date(data.issueDate), {
  message: 'Due date must be on or after issue date',
  path: ['dueDate'],
});

export const timeLogSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  billable: z.boolean(),
  hourlyRate: z.number().min(0),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

// Type inference
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type TimeLogFormData = z.infer<typeof timeLogSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
```

---

## PART 7 — TOAST / NOTIFICATION PATTERN

Use shadcn/ui `useToast` hook consistently across all CRUD operations:

```typescript
// src/lib/toasts.ts — centralized toast messages
import { toast } from '@/components/ui/use-toast';

export const toasts = {
  created: (entity: string) =>
    toast({ title: `${entity} created`, description: 'Record added successfully.' }),

  updated: (entity: string) =>
    toast({ title: `${entity} updated`, description: 'Changes saved successfully.' }),

  softDeleted: (entity: string, onUndo: () => void) =>
    toast({
      title: `Moved to Trash`,
      description: `${entity} was moved to Trash.`,
      action: <ToastAction altText="Undo" onClick={onUndo}>Undo</ToastAction>,
      duration: 5000,
    }),

  restored: (entity: string) =>
    toast({ title: `${entity} restored`, description: 'Record moved back from Trash.' }),

  permanentlyDeleted: (entity: string) =>
    toast({
      title: `Permanently deleted`,
      description: `${entity} has been removed forever.`,
      variant: 'destructive',
    }),

  error: (message: string) =>
    toast({ title: 'Something went wrong', description: message, variant: 'destructive' }),
};
```

---

## PART 8 — GUARD RAILS & EDGE CASES

Handle these specific scenarios:

```
1. DELETING A CLIENT WITH ACTIVE PROJECTS
   - Show warning in confirmation dialog:
     "This client has [N] active project(s). The client will be archived
      but their projects will remain. Projects will show [Client deleted]."
   - Allow proceed — do NOT cascade delete projects

2. DELETING A PROJECT WITH UNPAID INVOICES
   - Show warning:
     "This project has [N] unpaid invoice(s) totaling Rp X.
      Invoices will remain but show [Project deleted]."
   - Allow proceed

3. DELETING A PROJECT WITH RUNNING TIMER
   - Block deletion:
     "Cannot delete this project while a timer is running.
      Stop the active timer first."
   - Show error toast, close dialog

4. EDITING A PAID INVOICE
   - Edit button is disabled (grayed out)
   - Tooltip on hover: "Paid invoices cannot be edited"
   - Allow duplicate as new draft instead

5. RESTORING A PROJECT WHOSE CLIENT WAS ALSO DELETED
   - Restore the project normally
   - Show info toast: "Project restored. Note: the linked client is in Trash.
      Restore them too to re-link properly."

6. EMPTY TRASH — CONFIRMATION COUNT
   - Count ALL soft-deleted records across all entities
   - "Permanently delete 14 items? This cannot be undone."

7. RECALCULATE PROGRESS ON TASK SOFT DELETE
   - When a task is soft-deleted, recalculate project progress:
     progress = (completedActiveTasks / totalActiveTasks) * 100
   - If all tasks are deleted and project had tasks, keep last known progress
```

---

## IMPLEMENTATION ORDER FOR THIS FEATURE

1. Update `types/index.ts` — add `isDeleted` + `deletedAt` to all interfaces
2. Add `migrateSoftDelete()` to `storage.ts`
3. Update all Zustand stores — add soft/restore/permanent delete methods + fix all queries to filter `isDeleted`
4. Create `src/lib/schemas.ts` — all Zod schemas
5. Create shared form components (`FormModal`, `DeleteConfirmDialog`, `PermanentDeleteDialog`, `CurrencyInput`, etc.)
6. Create `src/lib/toasts.ts` — centralized toast helpers
7. Build entity forms: `ProjectForm` → `ClientForm` → `InvoiceForm` → `ExpenseForm` → `TimeLogForm`
8. Wire CRUD to existing list/detail pages (add create/edit/delete buttons)
9. Build `src/app/trash/page.tsx` — Trash page with all tabs
10. Add Trash to sidebar with item count badge
11. Test edge cases (items 1-7 in Part 8)
12. Run migration on any existing localStorage data

---

## DO NOT CHANGE

- Do NOT change the existing routing structure
- Do NOT change the design system, colors, or typography
- Do NOT remove any existing features — only ADD to them
- Do NOT change the tech stack
- Do NOT add a backend or API calls
- Keep all existing Zustand store method names — only ADD new ones

---

*Continuation prompt for: Freelance Business OS*
*Feature: Full CRUD + Soft Delete across all modules*
*Stack: Next.js 14 · TypeScript · Tailwind CSS · Zustand · localStorage*
