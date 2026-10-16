import type { Invoice } from "@/types/invoice";

/** Realistic demo invoice used for previews on the landing page. */
export function sampleInvoice(status: Invoice["status"] = "Sent"): Invoice {
  return {
    id: "landing",
    invoiceNumber: "INV-2026-018",
    invoiceDate: "2026-10-16",
    dueDate: "2026-10-30",
    currency: "IDR",
    status,
    language: "id",
    freelancerName: "Studio Kreatif",
    freelancerEmail: "halo@studiokreatif.id",
    freelancerPhone: "+62 812 3456 7890",
    freelancerAddress: "Jakarta",
    freelancerBankName: "BCA",
    freelancerBankAccount: "1234567890",
    freelancerBankAccountName: "Studio Kreatif",
    clientName: "Budi Santoso",
    clientCompany: "PT Nusantara Digital",
    clientEmail: "budi@nusantara.co.id",
    clientPhone: "",
    clientAddress: "Jakarta Pusat",
    clientCountry: "",
    lineItems: [
      { id: "1", description: "Desain logo & identitas", notes: "3 konsep, 2x revisi", quantity: 1, unitPrice: 4_500_000 },
      { id: "2", description: "Website company profile", quantity: 1, unitPrice: 9_000_000 },
      { id: "3", description: "Maintenance bulanan", quantity: 3, unitPrice: 750_000 },
    ],
    discountType: "percentage",
    discountValue: 0,
    taxType: "percentage",
    taxRate: 11,
    paymentScheduleType: "full",
    paymentStages: [],
    notes: "Terima kasih atas kerja samanya!",
    paymentMethod: "Bank Transfer",
    theme: "",
    createdAt: "",
    updatedAt: "",
  };
}
