// Re-export existing invoice types
export * from './invoice';

// ====== SOFT DELETE ======

export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt: string | null;
}

// ====== PROJECT TYPES ======

export type ProjectStatus =
  | 'lead'
  | 'negotiation'
  | 'dp_paid'
  | 'in_progress'
  | 'revision'
  | 'pending'
  | 'done'
  | 'cancelled';

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
  dueDate?: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  category: ProjectCategory;
  status: ProjectStatus;
  description?: string;
  progress: number;
  contractValue: number;
  dpAmount: number;
  dpPaid: boolean;
  dpPaidDate?: string;
  finalPaid: boolean;
  finalPaidDate?: string;
  startDate: string;
  deadline: string;
  deliveredDate?: string;
  tasks: Task[];
  notes?: string;
  attachments: string[];
  hourlyRate?: number;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

// ====== CLIENT TYPES ======

export interface MeetingNote {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  address?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: MeetingNote[];
  tags: string[];
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

// ====== EXPENSE TYPES ======

export type ExpenseCategory =
  | 'software'
  | 'hardware'
  | 'marketing'
  | 'education'
  | 'operational'
  | 'outsource'
  | 'tax'
  | 'other';

export interface Expense {
  id: string;
  projectId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

// ====== MANUAL INCOME ======

export interface ManualIncome {
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

// ====== TIME LOG TYPES ======

export interface TimeLog {
  id: string;
  projectId: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number;
  billable: boolean;
  hourlyRate: number;
  billableAmount: number;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

// ====== USER SETTINGS ======

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
  defaultPaymentTerms: number;
}
