# 🎨 PROMPT — UI Polish, UX Improvements & New Features
> Continuation prompt #3. Base app + CRUD + Soft Delete sudah implemented.
> Paste ke Cursor dan bilang: "Implement this on top of the existing codebase."

---

## OBJECTIVE

Three goals in one prompt:
1. **Fix typography & spacing** — consistent scale, proportional sizing, proper rhythm
2. **Improve UX** — skeleton states, keyboard shortcuts, breadcrumbs, empty states, onboarding
3. **Add new features** — Category CRUD, Notification Center, Global Search (Cmd+K), Activity Log, Pinned Projects

Do NOT change the tech stack, routing, or design system colors. Only refine and extend.

---

## PART 1 — TYPOGRAPHY & SPACING SYSTEM FIX

### Problem
Font sizes are inconsistent. Some labels too small (10px), some headings too large. Spacing between sections is uneven — sometimes too tight, sometimes too loose.

### Solution: Enforce a strict type scale and spacing scale

#### Typography Scale (apply globally via Tailwind classes — fix all existing components)

```
Page Title (h1):       text-xl     = 20px, font-semibold, tracking-tight (-0.4px)
Section Title (h2):    text-base   = 16px, font-semibold, tracking-tight (-0.2px)
Card Title (h3):       text-sm     = 14px, font-medium
Body default:          text-sm     = 14px, font-normal, leading-relaxed
Body secondary:        text-sm     = 14px, color text-secondary
Label / form label:    text-xs     = 12px, font-medium, color text-secondary, uppercase, tracking-wide (0.05em)
Caption / meta info:   text-xs     = 12px, color text-muted
Badge text:            text-xs     = 11px, font-medium
Stat value (number):   text-2xl    = 24px, font-semibold, DM Mono
Stat label:            text-xs     = 12px, font-medium, uppercase, tracking-wide
Table header:          text-xs     = 12px, font-medium, uppercase, tracking-wide, color text-muted
Table cell:            text-sm     = 14px
Sidebar nav item:      text-sm     = 13.5px
Sidebar section label: text-[12px] = 10px, uppercase, tracking-widest, color text-muted
Button (default):      text-sm     = 14px, font-medium
Button (sm):           text-xs     = 12px, font-medium
Input:                 text-sm     = 14px
Modal title:           text-base   = 16px, font-semibold
```

#### Spacing Scale — apply consistently everywhere

```
Page padding:              px-8 py-8         = 32px all sides
Page header margin-bottom: mb-7              = 28px
Section gap:               gap-6             = 24px between major sections
Card padding:              p-5               = 20px
Card padding (compact):    p-4               = 16px
Stats grid gap:            gap-3.5           = 14px
Form field gap:            gap-4             = 16px between fields
Form label → input gap:    gap-1.5           = 6px
Table row height:          h-11              = 44px (min)
Table cell padding:        px-4 py-3         = 16px horizontal, 12px vertical
Table header padding:      px-4 py-2.5       = 16px horizontal, 10px vertical
Sidebar nav item padding:  px-3 py-2         = 12px horizontal, 8px vertical
Modal padding:             p-6               = 24px
Modal header margin:       mb-5              = 20px
Button padding (default):  px-3.5 py-2       = 14px horizontal, 8px vertical
Button padding (sm):       px-2.5 py-1.5     = 10px horizontal, 6px vertical
Badge padding:             px-2 py-0.5       = 8px horizontal, 2px vertical
```

#### Specific fixes to apply to EVERY component

```
SIDEBAR:
- Brand section: padding 20px 18px, brand name text-[15px] font-semibold
- Nav section labels: text-[12px] uppercase tracking-widest, margin-top 20px first occurrence
- Nav items: text-[13.5px], icon size exactly 15x15px, gap 9px, height 34px
- Footer avatar: 30x30px circle, name text-[13px], role text-[11px]

DASHBOARD STATS:
- Stat label: text-[11px] uppercase tracking-wider font-medium text-muted
- Stat value: text-[26px] font-semibold DM Mono letter-spacing -0.5px
- Stat sublabel: text-xs text-secondary margin-top 4px
- Card: padding 18px, min-height 88px

PAGE HEADERS:
- Title: text-xl font-semibold tracking-tight
- Subtitle: text-sm text-secondary margin-top 2px
- Action buttons: aligned to vertical center of title

TABLES:
- Header: bg-surface-2, text-[11px] uppercase tracking-wider font-medium text-muted
- Header padding: px-4 py-2.5
- Body row: text-sm, border-bottom border, hover bg-surface-2/50
- Cell padding: px-4 py-3
- First column: font-medium text-primary
- Other columns: text-secondary

CARDS (project cards, client cards):
- Title: text-sm font-semibold (NOT font-bold, NOT text-base)
- Meta info below title: text-xs text-muted, margin-top 2px
- Card body text: text-sm
- Footer / action area: border-top, padding-top 12px, margin-top 12px

FORMS:
- Field label: text-xs font-medium uppercase tracking-wide text-secondary, display block, margin-bottom 6px
- Input: text-sm h-9 (36px)
- Select: text-sm h-9
- Textarea: text-sm min-h-[80px]
- Helper text below input: text-xs text-muted margin-top 4px
- Error text: text-xs text-red margin-top 4px
- Form section divider: border-top margin 20px 0, with section label text-xs font-medium

BADGES / STATUS PILLS:
- Font: text-[11px] font-medium
- Padding: px-2 py-0.5
- No uppercase, use sentence case (e.g. "In progress" not "IN PROGRESS")
- Line-height: 1 (prevent weird vertical padding)

MODALS / DIALOGS:
- Title: text-base font-semibold
- Description: text-sm text-secondary margin-top 2px
- Content padding: p-6
- Footer: border-top pt-4 mt-4, flex justify-end gap-2
- Max-width: max-w-lg (default), max-w-2xl (large forms like Invoice)
```

---

## PART 2 — LOADING & SKELETON STATES

Create `src/components/ui/skeleton.tsx` (if not already from shadcn):
```tsx
// Pulse skeleton using Tailwind animate-pulse
// bg-surface-2 rounded for blocks
```

### Skeleton components to create

```
src/components/skeletons/
├── DashboardSkeleton.tsx   — 4 stat cards + 2 column layout
├── ProjectListSkeleton.tsx — 6 table rows with varying widths
├── ProjectKanbanSkeleton.tsx — 8 columns, 2-3 cards each
├── ClientListSkeleton.tsx  — 6 card grid items
├── InvoiceListSkeleton.tsx — 5 table rows
├── FinanceSkeleton.tsx     — stat row + chart placeholder + table
└── GenericTableSkeleton.tsx — configurable rows prop (default 5)
```

### Skeleton design rules

```tsx
// Stat card skeleton
<div className="card animate-pulse">
  <div className="h-3 w-20 bg-surface-2 rounded mb-3" />  {/* label */}
  <div className="h-7 w-32 bg-surface-2 rounded mb-2" />  {/* value */}
  <div className="h-3 w-16 bg-surface-2 rounded" />       {/* sublabel */}
</div>

// Table row skeleton — vary widths to look realistic
<tr className="animate-pulse">
  <td><div className="h-4 w-36 bg-surface-2 rounded" /></td>
  <td><div className="h-4 w-24 bg-surface-2 rounded" /></td>
  <td><div className="h-5 w-16 bg-surface-2 rounded-full" /></td>  {/* badge */}
  <td><div className="h-4 w-20 bg-surface-2 rounded" /></td>
  <td><div className="h-4 w-12 bg-surface-2 rounded" /></td>
</tr>
```

### When to show skeletons

```typescript
// In each page, use a local isHydrated state:
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  setIsHydrated(true);
}, []);

if (!isHydrated) return <DashboardSkeleton />;
// This prevents localStorage hydration flash (SSR → client mismatch)
```

---

## PART 3 — EMPTY STATES

Every list/table/kanban must have a designed empty state. NO plain "No data found" text.

### Empty state component

```tsx
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';  // sm for table empty, lg for full page
}

// Design: centered vertically in container
// Icon: 40x40px, color text-muted, stroke-width 1.5
// Title: text-sm font-medium text-primary
// Description: text-sm text-secondary max-w-xs text-center
// Button: mt-4, btn-secondary
```

### Empty states per module

```
Projects list:
  Icon: FolderOpen
  Title: "No projects yet"
  Description: "Start by creating your first project to track work and progress."
  Action: "New Project"

Projects kanban (per column):
  Icon: (none — keep it minimal)
  Text: "No [status] projects" — small, centered, text-muted text-xs

Clients:
  Icon: Users
  Title: "No clients yet"
  Description: "Add your first client to start associating projects and invoices."
  Action: "Add Client"

Invoices:
  Icon: FileText
  Title: "No invoices yet"
  Description: "Generate your first invoice to start tracking payments."
  Action: "Generate Invoice"

Finance - Expenses:
  Icon: Receipt
  Title: "No expenses recorded"
  Description: "Track your business expenses to see accurate profit figures."
  Action: "Add Expense"

Time Tracker:
  Icon: Clock
  Title: "No time logged today"
  Description: "Start a timer or add a manual entry to track your work hours."
  Action: "Start Timer"

Trash (each tab):
  Icon: Trash2
  Title: "Trash is empty"
  Description: "Deleted [projects/clients/invoices] will appear here."
  (no action button)

Search results:
  Icon: SearchX
  Title: "No results for "[query]""
  Description: "Try different keywords or check the spelling."
  (no action button)
```

---

## PART 4 — ONBOARDING FLOW

Show a welcome screen ONCE on first launch (no existing data in localStorage).

### First launch detection

```typescript
// In root layout or dashboard page:
const hasCompletedOnboarding = useSettingsStore(s => s.hasCompletedOnboarding);
if (!hasCompletedOnboarding) redirect('/onboarding');
```

### Onboarding page: `src/app/onboarding/page.tsx`

**Step 1 of 3 — Welcome & Business Profile**
```
Large centered layout, no sidebar
Headline: "Welcome to your Business OS"
Subtext: "Let's set up your profile so invoices and reports are ready to go."

Fields:
- Your name *
- Business name *
- Email *
- Phone
- Address
- Default currency (IDR / USD) *

Progress: "Step 1 of 3"
Button: "Continue →"
```

**Step 2 of 3 — Invoice & Payment Setup**
```
Headline: "Invoice settings"
Subtext: "These will auto-fill on every invoice you create."

Fields:
- Bank name *
- Account number *
- Account holder name *
- Default tax rate (%) — default 11
- Payment terms (days) — default 14
- Invoice prefix — default "INV"

Button: "Continue →" | "← Back"
```

**Step 3 of 3 — Work Categories**
```
Headline: "Your work categories"
Subtext: "Add the types of work you do and your default rates."

Pre-filled with 5 defaults (editable, deletable):
- Web Development    | Rp 150.000/hr | 💻
- Mobile App         | Rp 200.000/hr | 📱
- Software           | Rp 175.000/hr | ⚙️
- Photography        | Rp 500.000/session | 📷
- Photo Editing      | Rp 100.000/hr | 🖼️

"+ Add Category" to add more
Each row: name, rate, rate unit (per hour / per session / per project), icon picker, color picker

Button: "Finish Setup →"
On finish: set hasCompletedOnboarding=true, seed sample data, redirect to /dashboard
```

**Onboarding design:**
- Clean centered card, max-width 520px
- Progress indicator: 3 dots at top, filled = completed
- Smooth step transition (slide left animation)
- "Skip setup" link bottom-right (skips to dashboard with defaults)

---

## PART 5 — PROJECT CATEGORY CRUD (Full)

### Data model

```typescript
// Add to types/index.ts
export type RateUnit = 'per_hour' | 'per_session' | 'per_project' | 'per_day';

export interface ProjectCategory {
  id: string;
  name: string;              // e.g. "Web Development"
  slug: string;              // auto-generated: "web_development" (used as key)
  description?: string;      // e.g. "Frontend & backend web apps"
  color: string;             // hex color e.g. "#2563eb"
  icon: string;              // Lucide icon name e.g. "Globe"
  defaultRate: number;       // e.g. 150000
  rateUnit: RateUnit;        // per_hour / per_session / per_project / per_day
  subCategories: SubCategory[];
  isDefault: boolean;        // true = cannot be deleted (only edited)
  isDeleted: boolean;
  deletedAt: string | null;
  sortOrder: number;         // for drag-to-reorder
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;             // e.g. "E-commerce", "Landing Page", "Company Profile"
  defaultRate?: number;     // overrides parent rate if set
  createdAt: string;
}
```

### Zustand store: `src/store/categoryStore.ts`

```typescript
interface CategoryStore {
  categories: ProjectCategory[];

  // READ
  getCategories: () => ProjectCategory[];           // excludes deleted
  getCategoryById: (id: string) => ProjectCategory | undefined;
  getCategoryBySlug: (slug: string) => ProjectCategory | undefined;

  // CREATE
  addCategory: (data: Omit<ProjectCategory, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) => ProjectCategory;

  // UPDATE
  updateCategory: (id: string, updates: Partial<ProjectCategory>) => void;
  reorderCategories: (orderedIds: string[]) => void;  // drag to reorder

  // SUB-CATEGORY CRUD
  addSubCategory: (categoryId: string, name: string, defaultRate?: number) => void;
  updateSubCategory: (categoryId: string, subId: string, updates: Partial<SubCategory>) => void;
  deleteSubCategory: (categoryId: string, subId: string) => void;  // hard delete (nested)

  // SOFT DELETE
  softDelete: (id: string) => void;   // blocked if isDefault=true
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  getDeleted: () => ProjectCategory[];
}
```

### Default categories (seeded on first install)

```typescript
const DEFAULT_CATEGORIES: Omit<ProjectCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Web Development',
    slug: 'web_development',
    description: 'Frontend, backend, and full-stack web applications',
    color: '#2563eb',
    icon: 'Globe',
    defaultRate: 150000,
    rateUnit: 'per_hour',
    subCategories: [
      { id: '...', name: 'Landing Page', createdAt: '...' },
      { id: '...', name: 'Company Profile', createdAt: '...' },
      { id: '...', name: 'E-commerce', createdAt: '...' },
      { id: '...', name: 'Web App / SaaS', createdAt: '...' },
    ],
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: 'Mobile App',
    slug: 'mobile_app',
    description: 'iOS and Android application development',
    color: '#7c3aed',
    icon: 'Smartphone',
    defaultRate: 200000,
    rateUnit: 'per_hour',
    subCategories: [
      { id: '...', name: 'iOS App', createdAt: '...' },
      { id: '...', name: 'Android App', createdAt: '...' },
      { id: '...', name: 'Cross-platform (React Native / Flutter)', createdAt: '...' },
    ],
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: 'Software Engineering',
    slug: 'software_engineering',
    description: 'Desktop apps, APIs, automation, and custom software',
    color: '#0f766e',
    icon: 'Code2',
    defaultRate: 175000,
    rateUnit: 'per_hour',
    subCategories: [
      { id: '...', name: 'Desktop Application', createdAt: '...' },
      { id: '...', name: 'REST API / Backend', createdAt: '...' },
      { id: '...', name: 'Automation / Script', createdAt: '...' },
    ],
    isDefault: true,
    sortOrder: 2,
  },
  {
    name: 'Photography',
    slug: 'photography',
    description: 'Commercial, portrait, and event photography',
    color: '#d97706',
    icon: 'Camera',
    defaultRate: 500000,
    rateUnit: 'per_session',
    subCategories: [
      { id: '...', name: 'Product Photography', createdAt: '...' },
      { id: '...', name: 'Portrait / Headshot', createdAt: '...' },
      { id: '...', name: 'Event Photography', createdAt: '...' },
      { id: '...', name: 'Real Estate / Architecture', createdAt: '...' },
    ],
    isDefault: true,
    sortOrder: 3,
  },
  {
    name: 'Photo Editing',
    slug: 'photo_editing',
    description: 'Retouching, color grading, and photo manipulation',
    color: '#db2777',
    icon: 'ImageIcon',
    defaultRate: 100000,
    rateUnit: 'per_hour',
    subCategories: [
      { id: '...', name: 'Basic Retouching', createdAt: '...' },
      { id: '...', name: 'Color Grading', createdAt: '...' },
      { id: '...', name: 'Composite / Manipulation', createdAt: '...' },
    ],
    isDefault: true,
    sortOrder: 4,
  },
];
```

### Category management UI: `src/app/settings/categories/page.tsx`

**Layout** — full settings sub-page (or tab within Settings):

```
Page title: "Work Categories"
Subtitle: "Manage your service categories, rates, and sub-types."
Right: "+ New Category" button

List of categories (drag-to-reorder via @dnd-kit):
┌─────────────────────────────────────────────────────────────┐
│ ⠿  🔵  Web Development                          Rp 150k/hr │
│       Frontend, backend, and full-stack...       [Edit] [⋯] │
│       Sub: Landing Page · Company Profile · E-commerce +2   │
└─────────────────────────────────────────────────────────────┘

Left: drag handle (⠿ icon, GripVertical)
Color dot: 12px circle in category color
Name: text-sm font-medium
Rate: text-xs text-muted DM Mono (right-aligned)
Description: text-xs text-secondary (truncated 1 line)
Sub-categories: text-xs badges below, showing first 3 then "+N more"
Actions: Edit button + ⋯ dropdown (Edit / Delete)

Default categories: show a lock icon (🔒) instead of ⋯ — can edit but not delete
```

**Category Form Modal** (create & edit):

```
Fields:
1. Icon picker *
   — Grid of 24 relevant Lucide icons to choose from:
     Globe, Smartphone, Code2, Camera, ImageIcon, Video, Music,
     Palette, PenTool, FileText, BarChart, ShoppingCart, Building,
     Headphones, Cpu, Database, Shield, Mail, Megaphone, Film,
     Layout, Package, Wrench, Layers
   — Clicking selects it, shows selected state with accent border

2. Category name * (text input)
   — Auto-generates slug preview below: "slug: web_development"

3. Description (textarea, max 100 chars, optional)

4. Color picker *
   — 12 preset swatches (not free input — keeps design consistent):
     #2563eb (blue) | #7c3aed (purple) | #0f766e (teal)
     #d97706 (amber) | #db2777 (pink) | #dc2626 (red)
     #16a34a (green) | #ea580c (orange) | #0284c7 (sky)
     #4f46e5 (indigo) | #0d9488 (cyan) | #6b7280 (gray)
   — Display as clickable circles, selected = ring border

5. Default rate * (number input — IDR, DM Mono)

6. Rate unit * (segmented control):
   [Per Hour] [Per Session] [Per Project] [Per Day]

7. Sub-categories (dynamic list):
   Label: "Sub-categories (optional)"
   — Each row: text input for name + optional rate input + × button
   — "+ Add sub-category" link below list
   — Max 10 sub-categories

[Cancel] [Save Category]
```

**Delete category guard:**
```
If category has projects assigned:
  "This category is used by [N] project(s).
   Deleting it will set those projects' category to 'Uncategorized'.
   Are you sure?"

If isDefault === true:
  Delete option is hidden entirely. Show tooltip: "Default categories cannot be deleted."
```

---

## PART 6 — NOTIFICATION CENTER

### Data model

```typescript
// Add to types/index.ts
export type NotificationType =
  | 'deadline_warning'   // project deadline in X days
  | 'deadline_overdue'   // project deadline passed
  | 'invoice_overdue'    // invoice past due date
  | 'invoice_due_soon'   // invoice due in X days
  | 'payment_received'   // invoice marked as paid
  | 'project_completed'; // project status changed to 'done'

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId: string;        // projectId or invoiceId
  entityType: 'project' | 'invoice';
  isRead: boolean;
  createdAt: string;
  link: string;            // e.g. "/projects/abc123"
}
```

### Notification store: `src/store/notificationStore.ts`

```typescript
interface NotificationStore {
  notifications: AppNotification[];

  // Auto-generate notifications (call on app load + on store changes)
  generateNotifications: (projects: Project[], invoices: Invoice[]) => void;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;       // removes from list
  clearAll: () => void;

  getUnread: () => AppNotification[];
  getUnreadCount: () => number;
}
```

### Notification generation logic

```typescript
// Call this in root layout useEffect, and whenever projects/invoices change
function generateNotifications(projects: Project[], invoices: Invoice[]): AppNotification[] {
  const now = new Date();
  const notifications: AppNotification[] = [];

  // Project deadlines
  projects
    .filter(p => !p.isDeleted && p.status !== 'done' && p.status !== 'cancelled')
    .forEach(project => {
      const deadline = new Date(project.deadline);
      const daysUntil = differenceInDays(deadline, now);

      if (daysUntil < 0) {
        notifications.push({
          type: 'deadline_overdue',
          title: 'Deadline overdue',
          message: `"${project.name}" was due ${Math.abs(daysUntil)} day(s) ago.`,
          link: `/projects/${project.id}`,
          // ...
        });
      } else if (daysUntil <= 3) {
        notifications.push({
          type: 'deadline_warning',
          title: 'Deadline in 3 days',
          message: `"${project.name}" is due ${daysUntil === 0 ? 'today' : `in ${daysUntil} day(s)`}.`,
          link: `/projects/${project.id}`,
        });
      } else if (daysUntil <= 7) {
        notifications.push({
          type: 'deadline_warning',
          title: 'Deadline this week',
          message: `"${project.name}" is due in ${daysUntil} days.`,
          link: `/projects/${project.id}`,
        });
      }
    });

  // Invoice overdue
  invoices
    .filter(i => !i.isDeleted && ['sent', 'unpaid'].includes(i.status))
    .forEach(invoice => {
      const due = new Date(invoice.dueDate);
      const daysOverdue = differenceInDays(now, due);

      if (daysOverdue > 0) {
        notifications.push({
          type: 'invoice_overdue',
          title: 'Invoice overdue',
          message: `${invoice.invoiceNumber} is ${daysOverdue} day(s) overdue.`,
          link: `/invoices/${invoice.id}`,
        });
      } else if (daysOverdue >= -3) {
        notifications.push({
          type: 'invoice_due_soon',
          title: 'Invoice due soon',
          message: `${invoice.invoiceNumber} is due in ${Math.abs(daysOverdue)} day(s).`,
          link: `/invoices/${invoice.id}`,
        });
      }
    });

  return notifications;
}
```

### Notification Bell UI (in sidebar footer or sidebar top-right)

```
Bell icon (Lucide: Bell)
If unread count > 0: red dot badge with count (max "9+")

Click → opens Notification Panel (not a page — a popover/sheet from the right):

┌─────────────────────────────────┐
│ Notifications          Mark all │
│─────────────────────────────────│
│ 🔴 Deadline overdue             │
│    "Client App" was due 2d ago  │
│    2 hours ago          →       │
│─────────────────────────────────│
│ 🟡 Invoice due soon             │
│    INV-2025-012 due in 2 days   │
│    1 day ago            →       │
│─────────────────────────────────│
│ ✅ Payment received             │
│    INV-2025-010 paid            │
│    3 days ago           →       │
└─────────────────────────────────┘

Each item:
- Color-coded left border (red=overdue, amber=warning, green=success)
- Click → navigate to entity page + mark as read
- × button on hover → dismiss

Empty state: Bell icon + "All caught up!" text
```

**Notification type colors:**
```
deadline_overdue  → red left border, red dot
deadline_warning  → amber left border, amber dot
invoice_overdue   → red left border
invoice_due_soon  → amber left border
payment_received  → green left border
project_completed → green left border
```

---

## PART 7 — GLOBAL SEARCH (Cmd+K)

### Search store: `src/store/searchStore.ts`

```typescript
interface SearchStore {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
}
```

### Search component: `src/components/GlobalSearch.tsx`

```tsx
// Triggered by: Cmd+K (Mac) / Ctrl+K (Windows)
// Renders as a full-screen overlay with centered modal
// Uses shadcn Command component (cmdk)

// Global keyboard listener in root layout:
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchStore.open();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Search behavior

```
Input placeholder: "Search projects, clients, invoices..."

Results grouped by type, shown as user types (min 1 character):

PROJECTS (up to 5 results)
  ○ Website Redesign PT Maju      In Progress  →
  ○ Mobile App Tokobuku           Lead         →

CLIENTS (up to 3 results)
  👤 Budi Santoso · PT Maju Jaya              →
  👤 Sarah Chen · Personal                    →

INVOICES (up to 3 results)
  🧾 INV-2025-001 · Rp 5.000.000  Unpaid      →
  🧾 INV-2025-002 · Rp 2.500.000  Paid        →

QUICK ACTIONS (always shown at bottom)
  + New Project
  + New Client
  + New Invoice
  + Log Time

No results state:
  SearchX icon + "No results for '[query]'"
```

**Search logic:**
```typescript
function globalSearch(query: string, projects: Project[], clients: Client[], invoices: Invoice[]) {
  const q = query.toLowerCase().trim();
  if (!q) return { projects: [], clients: [], invoices: [] };

  return {
    projects: projects
      .filter(p => !p.isDeleted)
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
      .slice(0, 5),

    clients: clients
      .filter(c => !c.isDeleted)
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      .slice(0, 3),

    invoices: invoices
      .filter(i => !i.isDeleted)
      .filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
      .slice(0, 3),
  };
}
```

**Search modal design:**
```
Overlay: bg-black/40 backdrop-blur-sm (fixed, full screen)
Modal: centered, max-w-xl w-full, bg-surface, rounded-xl, shadow-xl
Input: borderless, text-base, h-12, pl-4 pr-4, focus:outline-none
Divider below input: border-b
Results: max-h-96, overflow-y-auto, py-2
Result item: flex items-center px-3 py-2 rounded-lg hover:bg-surface-2 cursor-pointer
Keyboard hint footer: "↑↓ navigate  ↵ open  esc close" — text-xs text-muted
```

**Keyboard navigation:**
- Arrow Up / Down → highlight result
- Enter → navigate to highlighted result, close modal
- Escape → close modal

---

## PART 8 — ACTIVITY LOG (per project)

### Data model

```typescript
// Add to types/index.ts
export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'status_changed'
  | 'progress_updated'
  | 'task_added'
  | 'task_completed'
  | 'task_deleted'
  | 'invoice_created'
  | 'invoice_paid'
  | 'time_logged'
  | 'note_added'
  | 'file_attached';

export interface ActivityLog {
  id: string;
  projectId: string;
  type: ActivityType;
  description: string;      // human-readable e.g. "Status changed from In Progress to Revision"
  meta?: Record<string, any>; // extra context: { from: 'in_progress', to: 'revision' }
  createdAt: string;
}
```

### Activity store (or add to projectStore)

```typescript
// Add to projectStore or create src/store/activityStore.ts
interface ActivityActions {
  logActivity: (projectId: string, type: ActivityType, description: string, meta?: Record<string, any>) => void;
  getActivities: (projectId: string) => ActivityLog[];
  clearActivities: (projectId: string) => void;  // for testing only
}
```

### Auto-log triggers (call logActivity inside these store actions)

```typescript
// In projectStore:
updateStatus: (id, status) => {
  const old = get().getProjectById(id);
  // ... update status ...
  get().logActivity(id, 'status_changed',
    `Status changed from "${STATUS_CONFIG[old.status].label}" to "${STATUS_CONFIG[status].label}"`,
    { from: old.status, to: status }
  );
}

updateProgress: (id, progress) => {
  const old = get().getProjectById(id);
  get().logActivity(id, 'progress_updated',
    `Progress updated from ${old.progress}% to ${progress}%`,
    { from: old.progress, to: progress }
  );
}

toggleTask: (projectId, taskId) => {
  const task = // find task
  get().logActivity(projectId,
    task.completed ? 'task_completed' : 'task_added',
    task.completed ? `Task completed: "${task.title}"` : `Task reopened: "${task.title}"`
  );
}

// In invoiceStore (cross-store):
markAsPaid: (id, paidDate) => {
  // ... mark paid ...
  // find linked project and log:
  projectStore.logActivity(invoice.projectId, 'invoice_paid',
    `Invoice ${invoice.invoiceNumber} marked as paid — ${formatIDR(invoice.total)}`
  );
}
```

### Activity Log UI (in Project detail — "Activity" tab)

```
Timeline layout — vertical line on the left:

│  ◉  Status changed to "Revision"              2 hours ago
│     Previously: In Progress
│
│  ◉  Task completed: "Design mockups"          5 hours ago
│
│  ◉  Progress updated: 45% → 60%              Yesterday
│
│  ◉  Invoice INV-2025-003 marked as paid       2 days ago
│     Rp 7.500.000 received
│
│  ◉  Project created                           Mar 10, 2025

Design:
- Timeline line: 1px left border, color border
- Dot: 8px circle, color based on activity type
  (status change = blue, task = green, invoice = amber, created = gray)
- Description: text-sm text-primary
- Meta line: text-xs text-muted
- Timestamp: text-xs text-muted (relative for < 7 days, absolute after)

Empty state: "No activity yet. Actions you take will be recorded here."
```

---

## PART 9 — PINNED / STARRED PROJECTS

### Store update

```typescript
// Add to projectStore:
togglePin: (id: string) => void;
getPinnedProjects: () => Project[];

// Add to Project interface:
isPinned: boolean;  // default false
```

### UI changes

**Dashboard — Pinned Projects section:**
```
Show ABOVE the "Active Projects" section
Title: "Pinned" with a pin icon (Lucide: Pin)
Horizontal scroll row of compact cards (not full table)
Max 8 pinned projects shown

Compact pinned card (180px wide, 100px tall):
- Category color left border (3px)
- Project name: text-sm font-medium (truncate 1 line)
- Client name: text-xs text-muted
- Progress bar: 4px height, full width, bottom of card
- Status badge: top-right, tiny

If no pinned projects: hide section entirely (no empty state)
```

**How to pin:**
- Star/pin icon on each project card and project detail header
- ⋯ menu on list rows: "Pin to Dashboard" / "Unpin"
- Filled pin icon = pinned (amber color), outline = not pinned
- Toast on pin: "📌 Pinned to dashboard"
- Toast on unpin: "Unpinned from dashboard"
- Max 8 pins — if exceeded: "You can pin up to 8 projects. Unpin one first."

---

## PART 10 — BREADCRUMB NAVIGATION

### Component: `src/components/layout/Breadcrumb.tsx`

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;  // if undefined = current page (not clickable)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

// Design:
// Projects  /  Website Redesign PT Maju  /  Tasks
// text-xs text-muted, separator: / with mx-1.5
// Links: hover:text-primary transition
// Current page: text-primary (not a link)
// Show below page header, above main content
// margin-bottom: 20px
```

### Where to add breadcrumbs

```
/projects/[id]           → Projects / [Project Name]
/projects/[id]#tasks     → Projects / [Project Name] / Tasks
/clients/[id]            → Clients / [Client Name]
/invoices/[id]           → Invoices / [Invoice Number]
/settings/categories     → Settings / Work Categories
/trash                   → Trash
/onboarding              → (no breadcrumb)
/dashboard               → (no breadcrumb — it IS the root)
```

---

## PART 11 — KEYBOARD SHORTCUTS

### Shortcuts registry: `src/lib/shortcuts.ts`

```typescript
export const SHORTCUTS = {
  // Global
  SEARCH:          { key: 'k',         meta: true,  description: 'Open search' },
  NEW_PROJECT:     { key: 'p',         meta: true, shift: true, description: 'New project' },
  NEW_CLIENT:      { key: 'c',         meta: true, shift: true, description: 'New client' },
  NEW_INVOICE:     { key: 'i',         meta: true, shift: true, description: 'New invoice' },
  GO_DASHBOARD:    { key: '1',         meta: true,  description: 'Go to Dashboard' },
  GO_PROJECTS:     { key: '2',         meta: true,  description: 'Go to Projects' },
  GO_CLIENTS:      { key: '3',         meta: true,  description: 'Go to Clients' },
  GO_FINANCE:      { key: '4',         meta: true,  description: 'Go to Finance' },
  GO_INVOICES:     { key: '5',         meta: true,  description: 'Go to Invoices' },
  GO_TIME:         { key: '6',         meta: true,  description: 'Go to Time Tracker' },

  // Project detail
  EDIT_PROJECT:    { key: 'e',         meta: true,  description: 'Edit project' },
  TOGGLE_VIEW:     { key: '\\',        meta: true,  description: 'Toggle list/kanban' },

  // Help
  SHOW_SHORTCUTS:  { key: '?',         description: 'Show keyboard shortcuts' },
};
```

### Shortcuts Help Modal

```
Triggered by pressing "?" (question mark) anywhere

Modal: max-w-md, two-column layout

NAVIGATION                    ACTIONS
⌘1  Dashboard                ⌘⇧P  New project
⌘2  Projects                 ⌘⇧C  New client
⌘3  Clients                  ⌘⇧I  New invoice
⌘4  Finance                  ⌘K   Search
⌘5  Invoices
⌘6  Time Tracker

CURRENT PAGE
⌘E  Edit current item
⌘\  Toggle view

Press ? to close
```

**Show keyboard shortcut hints in the UI:**
- Sidebar nav items: show shortcut on the right when hovering (e.g. "⌘2")
- Button tooltips: include shortcut if one exists (e.g. "+ New Project  ⌘⇧P")

---

## PART 12 — SIDEBAR ENHANCEMENTS

```
1. Notification bell in sidebar header (top-right of brand area)
   — Red dot badge with unread count
   — Click opens notification panel

2. Running timer indicator
   — If timer is active: show pulsing green dot next to "Time Tracker" nav item
   — Show elapsed time in small text: "02:34:11" (DM Mono, text-xs, text-muted)
   — Click nav item navigates to Time Tracker

3. Trash nav item with count badge
   — Show count of all soft-deleted records
   — Grey badge (not red — it's not urgent)
   — Only show badge if count > 0

4. Cmd+K hint
   — Below search icon or in sidebar footer:
     "⌘K Search" in text-xs text-muted
     Clicking it opens the Global Search modal

5. User settings quick access
   — Avatar in sidebar footer is clickable
   — Click → dropdown: "Settings", "Work Categories", "Export Data", separator, "Clear All Data"
```

---

## IMPORTANT CONSTRAINTS

```
✅ DO:
- Keep all existing functionality intact
- Use the exact same color variables and design tokens
- Add animations only where they aid comprehension (not decorative)
- Use DM Mono for ALL numbers, currencies, timestamps, durations
- Keep every new modal Escape-closeable
- Add aria-labels to all new icon-only buttons

❌ DO NOT:
- Change the existing routing structure
- Remove or rename existing Zustand store methods
- Add any API calls or backend dependencies
- Change the sidebar width (220px)
- Add dark mode (out of scope)
- Change the font families
- Use any icon library other than Lucide React
- Add new npm packages beyond: cmdk (for Cmd+K), @dnd-kit additions if needed
```

---

## IMPLEMENTATION ORDER

1. **Typography & spacing fix** — global pass through all components (start here, biggest visual impact)
2. **Skeleton states** — add isHydrated pattern to all pages
3. **Empty states** — replace all bare "no data" text with EmptyState component
4. **Breadcrumbs** — add to detail pages
5. **Category store + types** — new categoryStore with default data
6. **Category settings page** — CRUD UI with drag-to-reorder
7. **Update Project form** — replace hardcoded category enum with dynamic categoryStore
8. **Pinned projects** — store update + dashboard section + pin UI
9. **Activity log** — store + auto-log in existing actions + Activity tab UI
10. **Notification store** — generateNotifications logic + bell UI
11. **Global search** — Cmd+K modal with cmdk
12. **Keyboard shortcuts** — registry + listeners + help modal
13. **Sidebar enhancements** — timer indicator, notification bell, Trash badge
14. **Onboarding flow** — first-launch detection + 3-step wizard

---

*Continuation prompt #3 for: Freelance Business OS*
*Features: UI Polish · Skeleton States · Empty States · Onboarding · Category CRUD · Notifications · Global Search · Activity Log · Pinned Projects · Breadcrumbs · Keyboard Shortcuts*
*Stack: Next.js 14 · TypeScript · Tailwind CSS · Zustand · localStorage*
