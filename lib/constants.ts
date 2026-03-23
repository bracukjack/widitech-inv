import { ProjectStatus, ProjectCategory, ExpenseCategory } from '@/types';

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; text: string }> = {
  lead:        { label: 'Lead',        color: 'purple', bg: '#f5f3ff', text: '#6d28d9' },
  negotiation: { label: 'Negotiation', color: 'amber',  bg: '#fffbeb', text: '#b45309' },
  dp_paid:     { label: 'DP Paid',     color: 'violet', bg: '#fdf4ff', text: '#7e22ce' },
  in_progress: { label: 'In Progress', color: 'blue',   bg: '#eff6ff', text: '#1d4ed8' },
  revision:    { label: 'Revision',    color: 'orange', bg: '#fff7ed', text: '#c2410c' },
  pending:     { label: 'Pending',     color: 'gray',   bg: '#f9fafb', text: '#374151' },
  done:        { label: 'Done',        color: 'green',  bg: '#f0fdf4', text: '#15803d' },
  cancelled:   { label: 'Cancelled',   color: 'red',    bg: '#fef2f2', text: '#b91c1c' },
};

export const CATEGORY_CONFIG: Record<ProjectCategory, { label: string; icon: string }> = {
  web_dev:       { label: 'Web Dev',       icon: 'Globe' },
  mobile_app:    { label: 'Mobile App',    icon: 'Smartphone' },
  software:      { label: 'Software',      icon: 'Code2' },
  photography:   { label: 'Photography',   icon: 'Camera' },
  photo_editing: { label: 'Photo Editing', icon: 'ImageIcon' },
};

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string }> = {
  software:    { label: 'Software',    icon: 'Monitor' },
  hardware:    { label: 'Hardware',    icon: 'Cpu' },
  marketing:   { label: 'Marketing',  icon: 'Megaphone' },
  education:   { label: 'Education',  icon: 'GraduationCap' },
  operational: { label: 'Operational', icon: 'Wrench' },
  outsource:   { label: 'Outsource',  icon: 'Users' },
  tax:         { label: 'Tax',        icon: 'Receipt' },
  other:       { label: 'Other',      icon: 'MoreHorizontal' },
};

export const PROJECT_STATUSES: ProjectStatus[] = [
  'lead', 'negotiation', 'dp_paid', 'in_progress', 'revision', 'pending', 'done', 'cancelled'
];

export const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
