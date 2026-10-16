import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import type { Invoice, Settings } from "@/types/invoice";
import type { TemplateConfig } from "@/lib/themes";
import { db, schema } from "@/lib/db";
import { DEFAULT_DEFAULTS, DEFAULT_PROFILE, normalizeSettings } from "@/lib/normalize";
import type { SessionUser } from "@/lib/auth";

export interface AppData {
  user: SessionUser;
  invoices: Invoice[];
  settings: Settings;
  templates: TemplateConfig[];
}

export function rowToInvoice(row: typeof schema.invoices.$inferSelect): Invoice {
  return {
    ...row.data,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
  };
}

export function rowToTemplate(row: typeof schema.templates.$inferSelect): TemplateConfig {
  return {
    ...row.design,
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export function defaultSettingsFor(user: Pick<SessionUser, "name" | "email">): Settings {
  return {
    profile: { ...DEFAULT_PROFILE, name: user.name, email: user.email },
    defaults: { ...DEFAULT_DEFAULTS },
  };
}

export async function getSettings(user: SessionUser): Promise<Settings> {
  const [row] = await db().select().from(schema.userSettings).where(eq(schema.userSettings.userId, user.id)).limit(1);
  return row ? normalizeSettings({ profile: row.profile, defaults: row.defaults }) : defaultSettingsFor(user);
}

export async function getAllTemplates(): Promise<TemplateConfig[]> {
  const rows = await db().select().from(schema.templates).orderBy(asc(schema.templates.sortOrder), asc(schema.templates.name));
  return rows.map(rowToTemplate);
}

export async function getAppData(user: SessionUser): Promise<AppData> {
  const [invoiceRows, settings, templates] = await Promise.all([
    db()
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.userId, user.id))
      .orderBy(desc(schema.invoices.invoiceDate), desc(schema.invoices.createdAt)),
    getSettings(user),
    getAllTemplates(),
  ]);
  return { user, invoices: invoiceRows.map(rowToInvoice), settings, templates };
}
