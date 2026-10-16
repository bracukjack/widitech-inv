import {
  CURRENCIES,
  PAYMENT_METHODS,
  type BusinessProfile,
  type Currency,
  type Invoice,
  type InvoiceDefaults,
  type InvoiceStatus,
  type PaymentMethod,
  type Settings,
} from "@/types/invoice";
import { uid } from "@/lib/invoice";
import { DEFAULT_TEMPLATE_ID } from "@/lib/themes";

// Shared by the server (sanitising input) and the client (importing old browser data).

export const DEFAULT_PROFILE: BusinessProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  bankName: "",
  bankAccount: "",
  bankAccountName: "",
  logo: "",
};

export const DEFAULT_DEFAULTS: InvoiceDefaults = {
  currency: "IDR",
  taxRate: 0,
  paymentTermsDays: 14,
  prefix: "INV",
  theme: DEFAULT_TEMPLATE_ID,
  language: "id",
  paymentMethod: "Bank Transfer",
  notes: "Terima kasih atas kerja samanya. Mohon lakukan pembayaran sebelum tanggal jatuh tempo.",
};

// --- normalisation (also migrates data from older app versions) ---

export type Loose = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;

export function normalizeInvoice(raw: Loose): Invoice {
  const now = new Date().toISOString();
  const items = Array.isArray(raw.lineItems) ? (raw.lineItems as Loose[]) : [];
  const stages = Array.isArray(raw.paymentStages) ? (raw.paymentStages as Loose[]) : [];
  return {
    id: str(raw.id) || uid(),
    invoiceNumber: str(raw.invoiceNumber),
    invoiceDate: str(raw.invoiceDate),
    dueDate: str(raw.dueDate),
    currency: oneOf<Currency>(raw.currency, CURRENCIES, "IDR"),
    status: oneOf<InvoiceStatus>(raw.status, ["Draft", "Sent", "Paid"], "Draft"),
    language: oneOf(raw.language, ["id", "en"] as const, "en"),
    freelancerName: str(raw.freelancerName),
    freelancerEmail: str(raw.freelancerEmail),
    freelancerPhone: str(raw.freelancerPhone),
    freelancerAddress: str(raw.freelancerAddress),
    freelancerBankAccount: str(raw.freelancerBankAccount),
    freelancerBankName: str(raw.freelancerBankName),
    freelancerBankAccountName: str(raw.freelancerBankAccountName),
    clientName: str(raw.clientName),
    clientCompany: str(raw.clientCompany),
    clientEmail: str(raw.clientEmail),
    clientPhone: str(raw.clientPhone),
    clientAddress: str(raw.clientAddress),
    clientCountry: str(raw.clientCountry),
    lineItems: items.map((li) => ({
      id: str(li.id) || uid(),
      description: str(li.description),
      notes: str(li.notes),
      quantity: num(li.quantity, 1),
      unitPrice: num(li.unitPrice),
    })),
    discountType: oneOf(raw.discountType, ["percentage", "fixed"] as const, "percentage"),
    discountValue: num(raw.discountValue),
    taxType: oneOf(raw.taxType, ["percentage", "fixed"] as const, "percentage"),
    taxRate: num(raw.taxRate),
    paymentScheduleType: oneOf(raw.paymentScheduleType, ["full", "scheduled"] as const, "full"),
    paymentStages: stages.map((s) => ({
      id: str(s.id) || uid(),
      name: str(s.name),
      type: oneOf(s.type, ["percentage", "fixed"] as const, "percentage"),
      value: num(s.value),
      dueDate: str(s.dueDate),
      isPaid: s.isPaid === true,
    })),
    notes: str(raw.notes),
    paymentMethod: oneOf<PaymentMethod>(raw.paymentMethod, PAYMENT_METHODS, "Bank Transfer"),
    theme: str(raw.theme) || DEFAULT_TEMPLATE_ID,
    createdAt: str(raw.createdAt, now),
    updatedAt: str(raw.updatedAt, now),
    paidAt: str(raw.paidAt) || undefined,
  };
}

export function normalizeSettings(raw: Loose | null): Settings {
  const profile = (raw?.profile ?? {}) as Loose;
  const defaults = (raw?.defaults ?? {}) as Loose;
  return {
    profile: {
      name: str(profile.name),
      email: str(profile.email),
      phone: str(profile.phone),
      address: str(profile.address),
      bankName: str(profile.bankName),
      bankAccount: str(profile.bankAccount),
      bankAccountName: str(profile.bankAccountName),
      logo: str(profile.logo),
    },
    defaults: {
      currency: oneOf<Currency>(defaults.currency, CURRENCIES, DEFAULT_DEFAULTS.currency),
      taxRate: num(defaults.taxRate, DEFAULT_DEFAULTS.taxRate),
      paymentTermsDays: num(defaults.paymentTermsDays, DEFAULT_DEFAULTS.paymentTermsDays),
      prefix: str(defaults.prefix) || DEFAULT_DEFAULTS.prefix,
      theme: str(defaults.theme) || DEFAULT_DEFAULTS.theme,
      language: oneOf(defaults.language, ["id", "en"] as const, DEFAULT_DEFAULTS.language),
      paymentMethod: oneOf<PaymentMethod>(defaults.paymentMethod, PAYMENT_METHODS, DEFAULT_DEFAULTS.paymentMethod),
      notes: str(defaults.notes, DEFAULT_DEFAULTS.notes),
    },
  };
}

export function isProfileComplete(profile: BusinessProfile): boolean {
  return Boolean(profile.name && (profile.bankAccount || profile.email));
}
