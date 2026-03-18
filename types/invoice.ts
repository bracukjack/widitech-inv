export type Currency = "IDR" | "USD" | "EUR";

export type InvoiceStatus = "Draft" | "Sent" | "Paid";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: Currency;
  status: InvoiceStatus;

  // Freelancer info
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerAddress: string;
  freelancerBankAccount: string;
  freelancerBankName: string;

  // Client info
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCountry: string;

  // Line items
  lineItems: LineItem[];

  // Financials
  discountType: "percentage" | "fixed";
  discountValue: number;
  taxType: "percentage" | "fixed";
  taxRate: number;

  // Additional
  notes: string;
  paymentMethod: "Bank Transfer" | "PayPal" | "Wise" | "Other";

  // Theme
  theme: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  bankAccount: string;
  bankName: string;
  logo: string;
}

export const LINE_ITEM_TEMPLATES = [
  "UI/UX Design",
  "Frontend Development",
  "Backend Development",
  "API Integration",
  "Website Redesign",
  "Plugin / License",
  "Maintenance & Support",
  "Consulting",
] as const;
