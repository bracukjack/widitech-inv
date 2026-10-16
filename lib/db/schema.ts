import { boolean, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { BusinessProfile, Invoice, InvoiceBranding, InvoiceDefaults } from "@/types/invoice";
import type { TemplateConfig } from "@/lib/themes";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const userRole = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lower-cased. */
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("user"),
  disabled: boolean("disabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token — the raw token is never stored. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)]
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  profile: jsonb("profile").$type<BusinessProfile>().notNull(),
  defaults: jsonb("defaults").$type<InvoiceDefaults>().notNull(),
  branding: jsonb("branding").$type<InvoiceBranding>().notNull().default({} as InvoiceBranding),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The full invoice document lives in `data`; the columns next to it are
 * copies of the fields needed for listing, filtering and the admin panel.
 */
export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull(),
    clientName: text("client_name").notNull().default(""),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    invoiceDate: date("invoice_date", { mode: "string" }),
    dueDate: date("due_date", { mode: "string" }),
    data: jsonb("data").$type<Invoice>().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("invoices_user_date_idx").on(t.userId, t.invoiceDate)]
);

export type TemplateDesign = Omit<TemplateConfig, "id" | "name" | "description" | "isActive" | "sortOrder">;

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  design: jsonb("design").$type<TemplateDesign>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Admin-editable site content: row 1 = site settings, row 2 = landing page content. */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Uploaded site images (logo, favicon, social share image), served by app/site-asset/[key]. */
export const siteAssets = pgTable("site_assets", {
  key: text("key").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
