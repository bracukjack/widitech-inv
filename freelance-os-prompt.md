# 🧠 MASTER PROMPT — Freelance Business OS
> Copy-paste prompt ini ke Cursor, v0.dev, ChatGPT, Claude, atau AI coding tool favoritmu.

---

## ROLE & CONTEXT

You are a senior full-stack engineer and product designer with 10+ years of experience building SaaS tools for freelancers and agencies. Your task is to build a **production-grade Personal Business OS** — a complete web application for a freelance web developer, software engineer, mobile app developer, and photographer to manage their entire business in one place.

This is NOT a simple todo app. This is a **professional business management system** with project tracking, financial management, client CRM, invoice generation, and time tracking — all in one cohesive application.

---

## TECH STACK (mandatory, do not deviate)

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3
- **UI Components**: shadcn/ui (use `npx shadcn-ui@latest add` for components)
- **State Management**: Zustand with persist middleware (localStorage)
- **Data Persistence**: localStorage only (no backend, no database)
- **PDF Generation**: `@react-pdf/renderer` for invoice PDF export
- **Charts**: Recharts for financial graphs
- **Date Utilities**: date-fns
- **Icons**: Lucide React
- **Fonts**: DM Sans (body) + DM Mono (numbers/code) via next/font/google
- **Form Handling**: React Hook Form + Zod validation
- **Drag & Drop**: @dnd-kit/core for Kanban board

---

## DESIGN SYSTEM & AESTHETIC

**Philosophy**: Refined minimalism. Clean, professional, and calm. Every pixel is intentional. Think Linear.app meets Notion meets a premium accounting tool.

**Color Palette**:
```css
:root {
  --bg: #f9f8f6;           /* warm off-white page background */
  --surface: #ffffff;       /* card & sidebar background */
  --surface-2: #f4f3f0;    /* hover states, secondary surfaces */
  --border: rgba(0,0,0,0.07);
  --border-md: rgba(0,0,0,0.12);
  --text-primary: #1a1917;
  --text-secondary: #6b6a67;
  --text-muted: #a09f9c;
  --accent: #1a1917;        /* primary CTA - near black */
  --blue: #2563eb;
  --green: #16a34a;
  --amber: #d97706;
  --red: #dc2626;
  --purple: #7c3aed;
}
```

**Typography**:
- Headings: DM Sans, weight 600, letter-spacing -0.5px
- Body: DM Sans, weight 400
- Numbers/Currency: DM Mono, weight 500
- All font sizes via Tailwind scale

**Layout**:
- Fixed left sidebar: 220px wide
- Main content: fluid, max-width 1100px
- Sidebar has fixed position, main content has `margin-left: 220px`
- Consistent spacing: 32px page padding

**Component Rules**:
- Card border-radius: 12px
- Button border-radius: 8px
- Input border-radius: 8px
- All borders: 1px solid var(--border)
- No drop shadows except modals (subtle: `0 8px 32px rgba(0,0,0,0.08)`)
- Hover transitions: 120ms ease
- No gradients on UI elements
- Status badges: pill shape, color-coded, 20px border-radius

---

## APPLICATION ARCHITECTURE

### File Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Dashboard (redirect)
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx            # Project list + Kanban
│   │   └── [id]/page.tsx       # Project detail
│   ├── clients/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── finance/page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── time-tracker/page.tsx
│   └── reports/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectKanban.tsx
│   │   ├── TaskList.tsx
│   │   └── ProjectForm.tsx
│   ├── finance/
│   │   ├── RevenueChart.tsx
│   │   ├── ExpenseList.tsx
│   │   └── FinanceSummary.tsx
│   ├── invoices/
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoicePDF.tsx
│   │   └── InvoiceCard.tsx
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   └── ClientForm.tsx
│   ├── time-tracker/
│   │   ├── TimerWidget.tsx
│   │   └── TimeLogList.tsx
│   └── ui/                     # shadcn/ui components
├── store/
│   ├── index.ts                # Root store export
│   ├── projectStore.ts
│   ├── clientStore.ts
│   ├── financeStore.ts
│   ├── invoiceStore.ts
│   └── timeStore.ts
├── types/
│   └── index.ts                # All TypeScript interfaces
├── lib/
│   ├── utils.ts                # cn(), formatCurrency(), formatDate()
│   ├── constants.ts            # STATUS_CONFIG, CATEGORY_CONFIG
│   └── storage.ts              # localStorage helpers
└── hooks/
    ├── useProjects.ts
    ├── useFinance.ts
    └── useTimer.ts
```

---

## DATA MODELS (TypeScript Interfaces)

```typescript
// types/index.ts

export type ProjectStatus =
  | 'lead'        // Prospek/belum deal
  | 'negotiation' // Negosiasi harga
  | 'dp_paid'     // Down payment sudah masuk
  | 'in_progress' // Sedang dikerjakan
  | 'revision'    // Tahap revisi
  | 'pending'     // Menunggu feedback client
  | 'done'        // Selesai & paid
  | 'cancelled';  // Dibatalkan

export type ProjectCategory =
  | 'web_dev'
  | 'mobile_app'
  | 'software'
  | 'photography'
  | 'photo_editing';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string; // ISO string
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  category: ProjectCategory;
  status: ProjectStatus;
  description?: string;
  progress: number;        // 0-100
  contractValue: number;   // Total agreed price
  dpAmount: number;        // Down payment amount
  dpPaid: boolean;
  dpPaidDate?: string;
  finalPaid: boolean;
  finalPaidDate?: string;
  startDate: string;
  deadline: string;
  deliveredDate?: string;
  tasks: Task[];
  notes?: string;          // Internal notes
  attachments: string[];   // File names/URLs
  hourlyRate?: number;     // If billing by hour
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  address?: string;
  rating: 1 | 2 | 3 | 4 | 5; // Client satisfaction rating
  notes: MeetingNote[];
  tags: string[];           // e.g. ["repeat", "referral", "difficult"]
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;   // e.g. "INV-2024-001"
  projectId: string;
  clientId: string;
  status: InvoiceStatus;
  type: 'dp' | 'final' | 'full'; // Down payment or final invoice
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;         // e.g. 11 for 11% PPN
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;          // Payment instructions / notes
  paymentMethod?: string;
  bankAccount?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'software'       // Subscriptions, licenses
  | 'hardware'       // Equipment, gear
  | 'marketing'      // Ads, promotion
  | 'education'      // Courses, presets, plugins
  | 'operational'    // Internet, electricity, etc.
  | 'outsource'      // Paying sub-contractors
  | 'tax'            // Tax payments
  | 'other';

export interface Expense {
  id: string;
  projectId?: string;      // Optional - can be general expense
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;        // file name
  createdAt: string;
}

export interface TimeLog {
  id: string;
  projectId: string;
  description: string;
  startTime: string;       // ISO string
  endTime?: string;        // ISO if stopped
  duration: number;        // minutes
  billable: boolean;
  hourlyRate: number;
  billableAmount: number;
  createdAt: string;
}

export interface UserSettings {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  taxNumber?: string;
  logoUrl?: string;
  defaultTaxRate: number;
  defaultCurrency: 'IDR' | 'USD';
  defaultPaymentTerms: number; // days
}
```

---

## ZUSTAND STORES

### projectStore.ts
```typescript
interface ProjectStore {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (projectId: string, task: Omit<Task, 'id' | 'projectId' | 'createdAt'>) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  getProjectsByClient: (clientId: string) => Project[];
}
```

### financeStore.ts
```typescript
interface FinanceStore {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getTotalRevenue: (month?: number, year?: number) => number;
  getTotalExpenses: (month?: number, year?: number) => number;
  getNetProfit: (month?: number, year?: number) => number;
  getRevenueByCategory: (year?: number) => Record<ProjectCategory, number>;
  getMonthlyRevenue: (year: number) => { month: string; revenue: number; expenses: number }[];
}
```

### invoiceStore.ts
```typescript
interface InvoiceStore {
  invoices: Invoice[];
  invoiceCounter: number;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markAsPaid: (id: string, paidDate: string) => void;
  getOverdueInvoices: () => Invoice[];
  getUnpaidTotal: () => number;
  generateInvoiceNumber: () => string;
}
```

### timeStore.ts
```typescript
interface TimeStore {
  timeLogs: TimeLog[];
  activeTimer: { projectId: string; startTime: string; description: string } | null;
  startTimer: (projectId: string, description: string) => void;
  stopTimer: (hourlyRate: number, billable: boolean) => void;
  addManualLog: (log: Omit<TimeLog, 'id' | 'createdAt'>) => void;
  deleteLog: (id: string) => void;
  getTotalHours: (projectId?: string) => number;
  getBillableAmount: (projectId?: string) => number;
}
```

---

## PAGE-BY-PAGE SPECIFICATIONS

### 1. DASHBOARD (`/dashboard`)

**Top stats row** (4 cards):
- Total Revenue This Month (IDR, formatted with DM Mono)
- Active Projects (count, with mini progress bars)
- Unpaid Invoices (count + total amount, red if overdue)
- Net Profit This Month (revenue - expenses, green/red)

**Layout below stats**:
- Left column (60%): Active Projects list — show top 5 by deadline proximity, each with progress bar, status badge, deadline countdown ("3 days left" in red if <7 days)
- Right column (40%): 
  - Upcoming Deadlines (next 30 days, sorted)
  - Recent Invoices (last 5, with status)
  - Overdue invoices alert banner (red, dismissible)

**Quick Actions bar** below header:
- "+ New Project", "+ New Invoice", "+ Log Time", "+ Add Expense"

---

### 2. PROJECTS (`/projects`)

**Two views** (toggle: List / Kanban):

**Kanban View**:
- 8 columns for each status: Lead → Negotiation → DP Paid → In Progress → Revision → Pending → Done → Cancelled
- Each card shows: project name, client name, category badge, progress %, deadline, contract value
- Drag & drop between columns using @dnd-kit
- Click card → navigate to project detail

**List View**:
- Table with sortable columns: Name, Client, Category, Status, Progress, Deadline, Value, Actions
- Filter bar: by status, category, date range
- Search by project name or client

**Project Detail (`/projects/[id]`)**:
- Header: project name, client, status selector (dropdown), category, deadline countdown
- Progress slider (0-100%) with auto-calculation from completed tasks
- Tab navigation:
  - **Overview**: description, dates (start/deadline/delivered), contract value, DP status, notes
  - **Tasks**: Add/edit/delete tasks with priority, due date, completion toggle. Group by: all / pending / completed
  - **Finance**: Contract value, DP amount & status, final payment status, linked invoices
  - **Time Logs**: Logged hours for this project, billable amount, start timer button
  - **Files**: List of attached file names (no actual upload, just filename tracking)
  - **Activity**: Auto-generated timeline of changes (status changes, task completions, etc.)

---

### 3. CLIENTS (`/clients`)

**Client List**:
- Card grid (3 columns) showing: name, company, rating stars, active project count, total revenue from client
- Search bar + filter by tag

**Client Detail (`/clients/[id]`)**:
- Header: name, company, contact info (email, phone, instagram), rating (1-5 stars, editable)
- Tags (e.g. "repeat client", "referral", "pays on time")
- Project History: all projects from this client with status, value, dates
- Meeting Notes: chronological notes with date, add new note button
- Financial summary: total revenue, total invoiced, outstanding balance

---

### 4. FINANCE (`/finance`)

**Summary bar** (4 stats): Total Revenue YTD, Total Expenses YTD, Net Profit YTD, Tax Estimate (10% of profit)

**Revenue vs Expenses Chart**: Recharts BarChart, monthly, current year. Toggle: bar chart / line chart.

**Revenue by Category**: Recharts PieChart — web dev, mobile, software, photography, photo editing.

**Expense List**: 
- Table: date, category, description, project (if linked), amount
- Filter by: category, month, project
- Add expense button → modal form
- Total at bottom

**Income Records**:
- Auto-populated from paid invoices
- Manual income entry option (for cash payments outside invoices)

---

### 5. INVOICES (`/invoices`)

**Invoice List**:
- Table: invoice number, client, project, type (DP/Final/Full), amount, status badge, due date, actions
- Status filter tabs: All / Draft / Sent / Unpaid / Overdue / Paid
- Overdue invoices highlighted with red left border
- "Generate Invoice" button → opens form

**Invoice Form** (modal or full page):
- Auto-generated invoice number (INV-2025-001, sequential)
- Select client + project (linked)
- Invoice type: DP / Final Payment / Full Invoice
- Line items table: description, qty, unit price, total (auto-calculated)
- Tax rate field (default 11% PPN, editable)
- Subtotal, tax, grand total (auto-calculated, DM Mono font)
- Due date (default: issueDate + 14 days, configurable)
- Payment instructions / bank account (from user settings)
- Notes field

**Invoice Detail (`/invoices/[id]`)**:
- Preview of the invoice (styled like a real invoice)
- Status management: Mark as Sent, Mark as Paid, Cancel
- "Download PDF" button → generates PDF using @react-pdf/renderer
- Edit button (only for draft/sent status)

**PDF Invoice Layout**:
- Your business name + logo (from settings) top left
- "INVOICE" title top right
- Invoice number, date, due date
- Bill To: client name, company, address
- Line items table
- Subtotal / Tax / Total
- Payment instructions
- Professional, clean layout with your color scheme

---

### 6. TIME TRACKER (`/time-tracker`)

**Active Timer widget** (top of page, always visible if timer running):
- Large timer display (HH:MM:SS) using DM Mono
- Project selector + description field
- Start / Stop / Pause buttons
- Running timer shows in sidebar as a pulsing dot indicator

**Time Log List**:
- Grouped by date (today, yesterday, this week)
- Each entry: project name, description, duration, billable toggle, rate, amount
- Edit / Delete actions
- "Add Manual Entry" button for logging past work

**Summary stats**:
- Today's hours, This week's hours, This month's hours
- Total billable amount this month
- Hours breakdown by project (mini bar chart)

---

### 7. REPORTS (`/reports`)

**Date range selector**: This Month / Last Month / This Quarter / This Year / Custom Range

**Financial Report**:
- Revenue, Expenses, Net Profit, Profit Margin %
- Month-by-month breakdown table (DM Mono for numbers)
- Best month, worst month callout

**Project Report**:
- Total projects by status (donut chart)
- Average project value
- On-time delivery rate %
- Most profitable category

**Client Report**:
- Top clients by revenue (bar chart)
- Client retention rate
- Average project value per client

**Export options**:
- Export financial data as CSV
- Export project summary as CSV
- Print-friendly report view

---

### 8. SETTINGS (`/settings`)

- **Business Profile**: Name, business name, email, phone, address
- **Invoice Settings**: Default tax rate, payment terms (days), bank account details, invoice prefix
- **Work Categories**: Custom hourly rates per category (web dev: Rp X/hr, photography: Rp Y/hr)
- **Notifications**: Browser notification for upcoming deadlines (X days before)
- **Data Management**: Export all data as JSON, Import from JSON backup, Clear all data (with confirmation)

---

## UI COMPONENT SPECIFICATIONS

### Status Badge Colors
```typescript
const STATUS_CONFIG = {
  lead:        { label: 'Lead',        color: 'purple', bg: '#f5f3ff', text: '#6d28d9' },
  negotiation: { label: 'Negotiation', color: 'amber',  bg: '#fffbeb', text: '#b45309' },
  dp_paid:     { label: 'DP Paid',     color: 'violet', bg: '#fdf4ff', text: '#7e22ce' },
  in_progress: { label: 'In Progress', color: 'blue',   bg: '#eff6ff', text: '#1d4ed8' },
  revision:    { label: 'Revision',    color: 'orange', bg: '#fff7ed', text: '#c2410c' },
  pending:     { label: 'Pending',     color: 'gray',   bg: '#f9fafb', text: '#374151' },
  done:        { label: 'Done',        color: 'green',  bg: '#f0fdf4', text: '#15803d' },
  cancelled:   { label: 'Cancelled',   color: 'red',    bg: '#fef2f2', text: '#b91c1c' },
};

const CATEGORY_CONFIG = {
  web_dev:       { label: 'Web Dev',       icon: 'Globe' },
  mobile_app:    { label: 'Mobile App',    icon: 'Smartphone' },
  software:      { label: 'Software',      icon: 'Code2' },
  photography:   { label: 'Photography',   icon: 'Camera' },
  photo_editing: { label: 'Photo Editing', icon: 'ImageIcon' },
};
```

### Currency Formatting
```typescript
// Always use this for IDR display
const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
// Output: "Rp 15.000.000"
```

### Sidebar Navigation Items
```
Dashboard    → /dashboard
───────────────────────────
WORK
  Projects   → /projects
  Clients    → /clients
  Time Track → /time-tracker
───────────────────────────
MONEY
  Finance    → /finance
  Invoices   → /invoices
  Reports    → /reports
───────────────────────────
  Settings   → /settings
```

---

## SEED / SAMPLE DATA

On first launch (empty localStorage), populate with realistic sample data:
- 3 clients (Budi Santoso - PT Maju Jaya, Sarah Chen - Personal, Andi Wijaya - CV Digital Kreatif)
- 6 projects across different statuses and categories
- 3 invoices (1 paid, 1 unpaid, 1 overdue)
- 5 expenses
- 10 time logs
- Include realistic IDR amounts (Rp 3.000.000 - Rp 25.000.000 range)

---

## PERFORMANCE REQUIREMENTS

- All pages must render in < 100ms (client-side navigation)
- No layout shift on load
- Sidebar navigation is instant (no loading states between pages)
- localStorage reads/writes are synchronous and batched
- Zustand store hydration uses `skipHydration: true` pattern to avoid SSR mismatch
- Use `React.memo()` for Kanban cards and list items
- Virtualize lists with 50+ items using `@tanstack/react-virtual`

---

## ACCESSIBILITY

- All interactive elements are keyboard navigable
- Focus rings visible (2px solid, offset 2px)
- Color contrast ratio minimum 4.5:1 for all text
- Form labels properly associated with inputs
- Modal dialogs trap focus correctly
- Status badges include text (not color-only)

---

## IMPLEMENTATION ORDER

Build in this sequence to ensure each feature is testable:

1. **Setup**: Next.js project + Tailwind + shadcn/ui + Zustand + TypeScript config
2. **Types & Stores**: All TypeScript interfaces + all Zustand stores with localStorage persistence
3. **Layout**: Sidebar + root layout + routing structure
4. **Dashboard**: Stats cards + active projects list (hardcoded sample data first)
5. **Projects**: List view → Kanban view → Project detail with tabs
6. **Clients**: List + detail with meeting notes
7. **Finance**: Charts + expense management
8. **Invoices**: Form + list + status management
9. **Time Tracker**: Timer widget + log list
10. **Reports**: Charts + export
11. **Settings**: User profile + data management
12. **Invoice PDF**: @react-pdf/renderer integration
13. **Sample Data**: Seed realistic data on first launch
14. **Polish**: Animations, transitions, empty states, loading states

---

## IMPORTANT NOTES FOR THE AI

- Every number displayed must be formatted (never show raw floats)
- Empty states must be designed (not just "No data found") — include a relevant icon and helpful CTA
- All forms must have validation with clear error messages
- Destructive actions (delete) must have confirmation dialogs
- Mobile responsiveness is NOT required — desktop-only is fine
- Do NOT add authentication — this is a local-only personal tool
- Do NOT add any API calls — everything is localStorage
- The app should feel like a premium SaaS tool, not a side project
- Use Lucide icons consistently throughout (never mix icon libraries)
- Every modal should be closeable with Escape key
- Toasts/notifications for success and error states (use shadcn/ui Toaster)

---

*Generated for: Freelance Business OS — Personal Project Management & Financial Tracker*
*Stack: Next.js 14 · TypeScript · Tailwind CSS · Zustand · localStorage*
