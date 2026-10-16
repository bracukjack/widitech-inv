export const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type InvoiceStatus = "Draft" | "Sent" | "Paid";
/** Status shown in the UI — "Overdue" is derived from a Sent invoice past its due date. */
export type DisplayStatus = InvoiceStatus | "Overdue";

export type InvoiceLanguage = "id" | "en";

export const PAYMENT_METHODS = ["Bank Transfer", "QRIS", "E-Wallet", "PayPal", "Wise", "Cash", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface LineItem {
  id: string;
  description: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentStage {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  dueDate: string;
  isPaid: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: Currency;
  status: InvoiceStatus;
  language: InvoiceLanguage;

  // Sender ("from") — snapshot of the business profile at the time of writing
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerAddress: string;
  freelancerBankAccount: string;
  freelancerBankName: string;
  freelancerBankAccountName: string;

  // Client ("bill to")
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCountry: string;

  lineItems: LineItem[];

  discountType: "percentage" | "fixed";
  discountValue: number;
  taxType: "percentage" | "fixed";
  taxRate: number;

  paymentScheduleType: "full" | "scheduled";
  paymentStages: PaymentStage[];

  notes: string;
  paymentMethod: PaymentMethod;

  /** Template id, see lib/themes.ts */
  theme: string;

  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  /** Base64 data URL */
  logo: string;
}

export interface InvoiceDefaults {
  currency: Currency;
  taxRate: number;
  paymentTermsDays: number;
  prefix: string;
  theme: string;
  language: InvoiceLanguage;
  paymentMethod: PaymentMethod;
  notes: string;
}

/** Per-user look applied on top of whichever template an invoice uses. Empty string = keep the template's own. */
export interface InvoiceBranding {
  color: string;
  font: string;
  decoration: string;
  /** Faint logo in the page background. */
  watermark: boolean;
  /** PNG data URLs */
  signature: string;
  stamp: string;
  signatureName: string;
  signatureTitle: string;
  /** Replaces the default "thank you" line. */
  footerText: string;
}

export interface Settings {
  profile: BusinessProfile;
  defaults: InvoiceDefaults;
  branding: InvoiceBranding;
}
