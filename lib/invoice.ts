import { format, parseISO, isValid, addDays } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import type {
  Currency,
  DisplayStatus,
  Invoice,
  InvoiceLanguage,
  LineItem,
  PaymentStage,
  Settings,
} from "@/types/invoice";

// --- ids & dates ---

export function uid(): string {
  // crypto.randomUUID is missing on plain-http origins (e.g. testing on a phone via LAN IP),
  // but getRandomValues is not — build a v4 UUID from it.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Today as yyyy-MM-dd in the user's local timezone. */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysISO(dateStr: string, days: number): string {
  const base = parseISO(dateStr);
  return format(addDays(isValid(base) ? base : new Date(), days), "yyyy-MM-dd");
}

/** parseISO treats date-only strings as local dates, so "2026-03-15" never shifts a day. */
export function formatDate(dateStr: string, lang: InvoiceLanguage = "id"): string {
  if (!dateStr) return "-";
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, "d MMM yyyy", { locale: lang === "id" ? idLocale : enUS });
}

// --- money ---

export const CURRENCY_LOCALE: Record<Currency, string> = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  SGD: "en-SG",
  MYR: "ms-MY",
  AUD: "en-AU",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  IDR: "IDR — Rupiah",
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  SGD: "SGD — Singapore Dollar",
  MYR: "MYR — Ringgit",
  AUD: "AUD — Australian Dollar",
};

export function currencyDecimals(currency: Currency): number {
  return currency === "IDR" ? 0 : 2;
}

export function currencySymbol(currency: Currency): string {
  const parts = new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(amount: number, currency: Currency): string {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
}

// --- totals ---

export function lineTotal(item: Pick<LineItem, "quantity" | "unitPrice">): number {
  return (item.quantity || 0) * (item.unitPrice || 0);
}

export function stageAmount(stage: PaymentStage, total: number): number {
  return stage.type === "percentage" ? total * ((stage.value || 0) / 100) : stage.value || 0;
}

export function calculateTotals(invoice: Invoice) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + lineTotal(item), 0);

  const rawDiscount =
    invoice.discountType === "percentage"
      ? subtotal * ((invoice.discountValue || 0) / 100)
      : invoice.discountValue || 0;
  const discount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const afterDiscount = subtotal - discount;

  const tax =
    invoice.taxType === "percentage"
      ? afterDiscount * ((invoice.taxRate || 0) / 100)
      : invoice.taxRate || 0;

  const total = afterDiscount + tax;

  const scheduled = invoice.paymentScheduleType === "scheduled" && invoice.paymentStages.length > 0;
  const paid =
    invoice.status === "Paid"
      ? total
      : scheduled
        ? invoice.paymentStages.filter((s) => s.isPaid).reduce((sum, s) => sum + stageAmount(s, total), 0)
        : 0;
  const balance = Math.max(total - paid, 0);

  return { subtotal, discount, afterDiscount, tax, total, paid, balance };
}

// --- status ---

export function displayStatus(invoice: Invoice): DisplayStatus {
  if (invoice.status === "Sent" && invoice.dueDate && invoice.dueDate < todayISO()) return "Overdue";
  return invoice.status;
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  Draft: "Draft",
  Sent: "Terkirim",
  Overdue: "Terlambat",
  Paid: "Lunas",
};

// --- numbering ---

export function nextInvoiceNumber(prefix: string, existing: Pick<Invoice, "invoiceNumber">[]): string {
  const cleanPrefix = (prefix || "INV").trim();
  const year = new Date().getFullYear();
  const head = `${cleanPrefix}-${year}-`;
  const max = existing.reduce((m, inv) => {
    if (!inv.invoiceNumber?.startsWith(head)) return m;
    const n = parseInt(inv.invoiceNumber.slice(head.length), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${head}${String(max + 1).padStart(3, "0")}`;
}

// --- factories ---

export function emptyLineItem(): LineItem {
  return { id: uid(), description: "", notes: "", quantity: 1, unitPrice: 0 };
}

export function createInvoice(settings: Settings, existing: Invoice[]): Invoice {
  const { profile, defaults } = settings;
  const today = todayISO();
  const now = new Date().toISOString();
  return {
    id: uid(),
    invoiceNumber: nextInvoiceNumber(defaults.prefix, existing),
    invoiceDate: today,
    dueDate: addDaysISO(today, defaults.paymentTermsDays),
    currency: defaults.currency,
    status: "Draft",
    language: defaults.language,
    freelancerName: profile.name,
    freelancerEmail: profile.email,
    freelancerPhone: profile.phone,
    freelancerAddress: profile.address,
    freelancerBankName: profile.bankName,
    freelancerBankAccount: profile.bankAccount,
    freelancerBankAccountName: profile.bankAccountName,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientCountry: "",
    lineItems: [emptyLineItem()],
    discountType: "percentage",
    discountValue: 0,
    taxType: "percentage",
    taxRate: defaults.taxRate,
    paymentScheduleType: "full",
    paymentStages: [],
    notes: defaults.notes,
    paymentMethod: defaults.paymentMethod,
    theme: defaults.theme,
    createdAt: now,
    updatedAt: now,
  };
}

/** A fresh unsaved copy: new id/number/dates, status reset, payments reset. */
export function duplicateInvoice(source: Invoice, settings: Settings, existing: Invoice[]): Invoice {
  const base = createInvoice(settings, existing);
  return {
    ...source,
    id: base.id,
    invoiceNumber: base.invoiceNumber,
    invoiceDate: base.invoiceDate,
    dueDate: base.dueDate,
    status: "Draft",
    paidAt: undefined,
    lineItems: source.lineItems.map((li) => ({ ...li, id: uid() })),
    paymentStages: source.paymentStages.map((s) => ({ ...s, id: uid(), isPaid: false, dueDate: "" })),
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

// --- sharing ---

export function invoiceShareText(invoice: Invoice): string {
  const { balance } = calculateTotals(invoice);
  const lang = invoice.language;
  const greet = invoice.clientName ? (lang === "id" ? `Halo ${invoice.clientName},` : `Hi ${invoice.clientName},`) : lang === "id" ? "Halo," : "Hi,";
  const lines =
    lang === "id"
      ? [
          greet,
          "",
          `Berikut invoice ${invoice.invoiceNumber} sebesar ${formatCurrency(balance, invoice.currency)}, jatuh tempo ${formatDate(invoice.dueDate, "id")}.`,
        ]
      : [
          greet,
          "",
          `Here is invoice ${invoice.invoiceNumber} for ${formatCurrency(balance, invoice.currency)}, due ${formatDate(invoice.dueDate, "en")}.`,
        ];
  if (invoice.freelancerBankAccount) {
    lines.push(
      "",
      lang === "id" ? "Pembayaran ke:" : "Payment to:",
      [invoice.freelancerBankName, invoice.freelancerBankAccount].filter(Boolean).join(" "),
      invoice.freelancerBankAccountName ? (lang === "id" ? `a.n. ${invoice.freelancerBankAccountName}` : `Account name: ${invoice.freelancerBankAccountName}`) : ""
    );
  }
  lines.push("", lang === "id" ? "Terima kasih!" : "Thank you!", invoice.freelancerName);
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}
