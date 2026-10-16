import { z } from "zod";
import { CURRENCIES, PAYMENT_METHODS } from "@/types/invoice";
import { COLOR_KEYS, FONT_STACKS, HEADER_LAYOUTS, TABLE_STYLES, TOTAL_STYLES, type FontKey } from "@/lib/themes";

// Everything that crosses from the browser into a server action is parsed with these.

const text = (max: number) => z.string().max(max);
const money = z.number().finite().min(-1e13).max(1e13);
const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")]);

export const lineItemSchema = z.object({
  id: text(64).min(1),
  description: text(500),
  notes: text(2000).optional(),
  quantity: money,
  unitPrice: money,
});

export const paymentStageSchema = z.object({
  id: text(64).min(1),
  name: text(120),
  type: z.enum(["percentage", "fixed"]),
  value: money,
  dueDate: isoDate,
  isPaid: z.boolean(),
});

export const invoiceSchema = z.object({
  id: text(64).min(1),
  invoiceNumber: text(64).trim().min(1, "Nomor invoice wajib diisi"),
  invoiceDate: isoDate,
  dueDate: isoDate,
  currency: z.enum(CURRENCIES),
  status: z.enum(["Draft", "Sent", "Paid"]),
  language: z.enum(["id", "en"]),
  freelancerName: text(200),
  freelancerEmail: text(200),
  freelancerPhone: text(60),
  freelancerAddress: text(500),
  freelancerBankAccount: text(80),
  freelancerBankName: text(120),
  freelancerBankAccountName: text(200),
  clientName: text(200),
  clientCompany: text(200),
  clientEmail: text(200),
  clientPhone: text(60),
  clientAddress: text(500),
  clientCountry: text(100),
  lineItems: z.array(lineItemSchema).max(300),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: money,
  taxType: z.enum(["percentage", "fixed"]),
  taxRate: money,
  paymentScheduleType: z.enum(["full", "scheduled"]),
  paymentStages: z.array(paymentStageSchema).max(24),
  notes: text(4000),
  paymentMethod: z.enum(PAYMENT_METHODS),
  theme: text(64),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  paidAt: z.string().optional(),
});

// Logos are downscaled to a small PNG in the browser before upload.
const logoSchema = z.union([
  z.literal(""),
  z
    .string()
    .max(700_000, "Logo terlalu besar")
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Format logo tidak valid"),
]);

export const settingsSchema = z.object({
  profile: z.object({
    name: text(200),
    email: text(200),
    phone: text(60),
    address: text(500),
    bankName: text(120),
    bankAccount: text(80),
    bankAccountName: text(200),
    logo: logoSchema,
  }),
  defaults: z.object({
    currency: z.enum(CURRENCIES),
    taxRate: z.number().finite().min(0).max(100),
    paymentTermsDays: z.number().int().min(0).max(365),
    prefix: text(16).regex(/^[A-Za-z0-9._/-]*$/, "Awalan hanya boleh huruf, angka, . _ / -"),
    theme: text(64),
    language: z.enum(["id", "en"]),
    paymentMethod: z.enum(PAYMENT_METHODS),
    notes: text(4000),
  }),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB");

export const templateSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "ID hanya huruf kecil, angka dan tanda -"),
  name: text(40).trim().min(1, "Nama wajib diisi"),
  description: text(120),
  layout: z.enum(HEADER_LAYOUTS),
  table: z.enum(TABLE_STYLES),
  totalStyle: z.enum(TOTAL_STYLES),
  colors: z.object(Object.fromEntries(COLOR_KEYS.map((k) => [k, hex])) as Record<(typeof COLOR_KEYS)[number], typeof hex>),
  font: z.enum(Object.keys(FONT_STACKS) as [FontKey, ...FontKey[]]),
  headingWeight: z.number().int().min(400).max(900),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
});

export const emailSchema = z.string().trim().toLowerCase().email("Email tidak valid").max(200);
export const passwordSchema = z.string().min(8, "Password minimal 8 karakter").max(200);
