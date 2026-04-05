import { Invoice, FreelancerProfile } from "@/types/invoice";
import { v4 as uuidv4 } from "uuid";

const INVOICES_KEY = "widitech-invoices";
const PROFILE_KEY = "widitech-profile";
const COUNTER_KEY = "widitech-invoice-counter";
const LOGO_KEY = "widitech-logo";

// --- Invoice helpers ---

function getAllInvoicesRaw(): Invoice[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(INVOICES_KEY);
  if (!data) return [];
  try {
    const invoices = JSON.parse(data) as Invoice[];
    // migrate soft delete fields
    return invoices.map((inv) => ({
      ...inv,
      isDeleted: inv.isDeleted ?? false,
      deletedAt: inv.deletedAt ?? null,
    }));
  } catch {
    return [];
  }
}

export function getInvoices(): Invoice[] {
  return getAllInvoicesRaw().filter((inv) => !inv.isDeleted);
}

export function getDeletedInvoices(): Invoice[] {
  return getAllInvoicesRaw().filter((inv) => inv.isDeleted);
}

export function getInvoiceById(id: string): Invoice | undefined {
  const inv = getAllInvoicesRaw().find((inv) => inv.id === id);
  if (!inv) return undefined;
  // Migrate older invoices missing new fields
  const defaults: Partial<Invoice> = {
    clientPhone: "",
    clientCountry: "",
    taxType: "percentage",
    paymentMethod: "Bank Transfer",
  };
  return { ...defaults, ...inv };
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getAllInvoicesRaw();
  const idx = invoices.findIndex((inv) => inv.id === invoice.id);
  if (idx >= 0) {
    invoices[idx] = { ...invoice, updatedAt: new Date().toISOString() };
  } else {
    invoices.push({
      ...invoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function deleteInvoice(id: string): void {
  softDeleteInvoice(id);
}

export function softDeleteInvoice(id: string): void {
  const invoices = getAllInvoicesRaw().map((inv) =>
    inv.id === id ? { ...inv, isDeleted: true, deletedAt: new Date().toISOString() } : inv
  );
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function restoreInvoice(id: string): void {
  const invoices = getAllInvoicesRaw().map((inv) =>
    inv.id === id ? { ...inv, isDeleted: false, deletedAt: null } : inv
  );
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function permanentDeleteInvoice(id: string): void {
  const invoices = getAllInvoicesRaw().filter((inv) => inv.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

// --- Invoice number generation ---

export function generateInvoiceNumber(): string {
  if (typeof window === "undefined") return "INV-2026-001";
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10) + 1;
  localStorage.setItem(COUNTER_KEY, counter.toString());
  const year = new Date().getFullYear();
  return `INV-${year}-${counter.toString().padStart(3, "0")}`;
}

// --- Profile helpers ---

export function getProfile(): FreelancerProfile {
  if (typeof window === "undefined") {
    return { name: "", email: "", phone: "", address: "", bankAccount: "", bankName: "", bankAccountName: "", logo: "" };
  }
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return { name: "", email: "", phone: "", address: "", bankAccount: "", bankName: "", bankAccountName: "", logo: "" };
  try {
    return JSON.parse(data) as FreelancerProfile;
  } catch {
    return { name: "", email: "", phone: "", address: "", bankAccount: "", bankName: "", bankAccountName: "", logo: "" };
  }
}

export function saveProfile(profile: FreelancerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// --- Default/sample data ---

export function createEmptyInvoice(profile?: FreelancerProfile): Invoice {
  const p = profile || getProfile();
  return {
    id: uuidv4(),
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    currency: "IDR",
    status: "Draft",
    freelancerName: p.name,
    freelancerEmail: p.email,
    freelancerPhone: p.phone,
    freelancerAddress: p.address,
    freelancerBankAccount: p.bankAccount,
    freelancerBankName: p.bankName,
    freelancerBankAccountName: p.bankAccountName || "",
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientCountry: "",
    lineItems: [
      { id: uuidv4(), description: "", quantity: 1, unitPrice: 0 },
    ],
    discountType: "percentage",
    discountValue: 0,
    taxType: "percentage",
    taxRate: 0,
    paymentScheduleType: "full",
    paymentStages: [],
    notes: "Payment is due within 30 days of the invoice date.\nPlease transfer to the bank account listed above.",
    paymentMethod: "Bank Transfer",
    theme: "professional",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  };
}

export function getSampleInvoice(): Invoice {
  return {
    id: "sample-001",
    invoiceNumber: "INV-2026-001",
    invoiceDate: "2026-03-15",
    dueDate: "2026-04-14",
    currency: "IDR",
    status: "Sent",
    freelancerName: "Andi Pratama",
    freelancerEmail: "andi@devstudio.id",
    freelancerPhone: "+62 812 3456 7890",
    freelancerAddress: "Jl. Sudirman No. 45, Jakarta Selatan, 12190",
    freelancerBankAccount: "1234567890",
    freelancerBankName: "Bank Central Asia (BCA)",
    freelancerBankAccountName: "Andi Pratama",
    clientName: "Budi Santoso",
    clientCompany: "PT Nusantara Digital",
    clientEmail: "budi@nusantaradigital.co.id",
    clientPhone: "+62 811 2345 678",
    clientAddress: "Jl. Gatot Subroto Kav. 21, Jakarta Pusat, 10270",
    clientCountry: "Indonesia",
    lineItems: [
      { id: "item-1", description: "Website Redesign", quantity: 1, unitPrice: 5000000 },
      { id: "item-2", description: "Frontend Development", quantity: 1, unitPrice: 8000000 },
      { id: "item-3", description: "Backend Development", quantity: 1, unitPrice: 7000000 },
      { id: "item-4", description: "API Integration", quantity: 2, unitPrice: 2500000 },
    ],
    discountType: "percentage",
    discountValue: 5,
    taxType: "percentage",
    taxRate: 11,
    paymentScheduleType: "scheduled",
    paymentStages: [
      { id: "stage-1", name: "Down Payment (50%)", type: "percentage", value: 50, dueDate: "2026-03-15", isPaid: true },
      { id: "stage-2", name: "Final Payment (50%)", type: "percentage", value: 50, dueDate: "2026-04-14", isPaid: false },
    ],
    notes: "Payment is due within 30 days of the invoice date.\nPlease transfer to the BCA account listed above.\nThank you for choosing our services.",
    paymentMethod: "Bank Transfer",
    theme: "professional",
    createdAt: "2026-03-15T08:00:00.000Z",
    updatedAt: "2026-03-15T08:00:00.000Z",
    isDeleted: false,
    deletedAt: null,
  };
}

export function ensureSampleData(): void {
  if (typeof window === "undefined") return;
  const invoices = getAllInvoicesRaw();
  if (invoices.length === 0) {
    saveInvoice(getSampleInvoice());
    // Set counter so next is 002
    localStorage.setItem(COUNTER_KEY, "1");
  }
}

export function duplicateInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    id: uuidv4(),
    invoiceNumber: generateInvoiceNumber(),
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  };
}

export function getLogo(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LOGO_KEY) || "";
}

export function saveLogo(base64: string): void {
  localStorage.setItem(LOGO_KEY, base64);
}

export function removeLogo(): void {
  localStorage.removeItem(LOGO_KEY);
}
