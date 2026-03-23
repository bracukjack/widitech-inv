import { z } from 'zod';

// ====== PROJECT SCHEMA ======

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  clientId: z.string().min(1, 'Client is required'),
  category: z.enum(['web_dev', 'mobile_app', 'software', 'photography', 'photo_editing']),
  status: z.enum(['lead', 'negotiation', 'dp_paid', 'in_progress', 'revision', 'pending', 'done', 'cancelled']),
  description: z.string().optional(),
  contractValue: z.number().min(0, 'Must be positive'),
  dpAmount: z.number().min(0, 'Must be positive'),
  dpPaid: z.boolean(),
  dpPaidDate: z.string().optional(),
  finalPaid: z.boolean(),
  finalPaidDate: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  hourlyRate: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ====== CLIENT SCHEMA ======

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  company: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  tags: z.array(z.string()),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ====== EXPENSE SCHEMA ======

export const expenseSchema = z.object({
  category: z.enum(['software', 'hardware', 'marketing', 'education', 'operational', 'outsource', 'tax', 'other']),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  projectId: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// ====== TIME LOG SCHEMA ======

export const timeLogSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  description: z.string().min(1, 'Description is required').max(200),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  hourlyRate: z.number().min(0),
  billable: z.boolean(),
  date: z.string().min(1, 'Date is required'),
});

export type TimeLogFormData = z.infer<typeof timeLogSchema>;

// ====== MANUAL INCOME SCHEMA ======

export const manualIncomeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  category: z.enum(['web_dev', 'mobile_app', 'software', 'photography', 'photo_editing']),
  clientId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export type ManualIncomeFormData = z.infer<typeof manualIncomeSchema>;

// ====== TASK SCHEMA ======

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
