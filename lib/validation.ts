import { z } from "zod";
import { CURRENCIES, PAYMENT_METHODS } from "@/types/invoice";
import { FEATURE_ICONS, LANDING_SECTIONS } from "@/lib/landing";
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

export const siteSettingsSchema = z.object({
  siteName: text(60).trim().min(1, "Nama website wajib diisi"),
  tagline: text(120),
  siteUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(200)
      .regex(/^https?:\/\/[^\s/]+$/i, "URL situs harus seperti https://domain.com (tanpa / di akhir)"),
  ]),
  metaTitle: text(120),
  metaDescription: text(320),
  keywords: text(500),
  allowIndexing: z.boolean(),
  primaryColor: hex,
});

/** Max base64 length per uploaded site image (images are resized in the browser first). */
export const SITE_ASSET_LIMITS = { logo: 600_000, favicon: 150_000, og: 1_500_000 } as const;

export const siteAssetSchema = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Format gambar tidak valid");

const line = (max: number) => z.string().max(max);
const enabled = z.boolean();

export const landingSchema = z.object({
  order: z.array(z.enum(LANDING_SECTIONS)).max(LANDING_SECTIONS.length),
  hero: z.object({
    enabled,
    badge: line(80),
    title: line(140),
    subtitle: line(400),
    primaryCta: line(40),
    secondaryCta: line(40),
    bullets: z.array(line(60)).max(6),
    audiences: z.array(line(40)).max(20),
  }),
  stats: z.object({ enabled, items: z.array(z.object({ value: line(20), label: line(60) })).max(6) }),
  features: z.object({
    enabled,
    eyebrow: line(40),
    title: line(140),
    subtitle: line(300),
    items: z.array(z.object({ icon: z.enum(FEATURE_ICONS), title: line(80), text: line(300) })).max(18),
  }),
  demo: z.object({ enabled, eyebrow: line(40), title: line(140), subtitle: line(300), buttonLabel: line(40) }),
  templates: z.object({ enabled, eyebrow: line(40), title: line(140), subtitle: line(300), buttonLabel: line(40) }),
  steps: z.object({ enabled, eyebrow: line(40), title: line(140), items: z.array(z.object({ title: line(80), text: line(300) })).max(8) }),
  pricing: z.object({
    enabled,
    eyebrow: line(40),
    title: line(140),
    subtitle: line(300),
    planName: line(40),
    badge: line(40),
    price: line(30),
    period: line(30),
    features: z.array(line(100)).max(16),
    buttonLabel: line(40),
    note: line(140),
  }),
  faq: z.object({ enabled, eyebrow: line(40), title: line(140), items: z.array(z.object({ q: line(200), a: line(1000) })).max(20) }),
  cta: z.object({ enabled, title: line(140), subtitle: line(300), buttonLabel: line(40) }),
  footer: z.object({
    text: line(200),
    contactEmail: z.union([z.literal(""), z.string().trim().email("Email kontak tidak valid").max(200)]),
  }),
});
