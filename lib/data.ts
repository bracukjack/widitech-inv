import "server-only";
import { asc, count, desc, eq } from "drizzle-orm";
import type { Invoice, Settings } from "@/types/invoice";
import { BUILTIN_TEMPLATES, type TemplateConfig } from "@/lib/themes";
import { db, schema } from "@/lib/db";
import { DEFAULT_BRANDING, DEFAULT_DEFAULTS, DEFAULT_PROFILE, normalizeSettings } from "@/lib/normalize";
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
    decoration: row.design.decoration ?? "none",
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
    branding: { ...DEFAULT_BRANDING },
  };
}

export async function getSettings(user: SessionUser): Promise<Settings> {
  const [row] = await db().select().from(schema.userSettings).where(eq(schema.userSettings.userId, user.id)).limit(1);
  return row ? normalizeSettings({ profile: row.profile, defaults: row.defaults, branding: row.branding }) : defaultSettingsFor(user);
}

/** site_settings row that remembers which built-in templates were already added once. */
const TEMPLATE_SYNC_ROW = 3;
let templatesSynced = false;

/**
 * Adds built-in templates that are new in this version of the code, once.
 * Ids already added before are remembered, so templates an admin deleted stay deleted.
 */
async function syncBuiltinTemplates(): Promise<void> {
  if (templatesSynced) return;
  templatesSynced = true;
  try {
    const [row] = await db().select().from(schema.siteSettings).where(eq(schema.siteSettings.id, TEMPLATE_SYNC_ROW)).limit(1);
    const seen = new Set<string>(Array.isArray(row?.data?.seeded) ? (row.data.seeded as string[]) : []);
    const fresh = BUILTIN_TEMPLATES.filter((t) => !seen.has(t.id));
    if (!fresh.length) return;
    const base = (await db().select({ n: count() }).from(schema.templates))[0]?.n ?? 0;
    for (const [i, t] of fresh.entries()) {
      const { id, name, description, isActive, sortOrder, ...design } = t;
      await db()
        .insert(schema.templates)
        .values({ id, name, description, design, isActive, sortOrder: row ? Number(base) + i : sortOrder })
        .onConflictDoNothing();
    }
    const seeded = [...seen, ...fresh.map((t) => t.id)];
    await db()
      .insert(schema.siteSettings)
      .values({ id: TEMPLATE_SYNC_ROW, data: { seeded }, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: { seeded }, updatedAt: new Date() } });
  } catch (e) {
    templatesSynced = false; // try again on the next request
    const reason = (e as Error).message.split("\n")[0];
    console.warn(`[templates] sinkronisasi template bawaan gagal: ${reason}`);
  }
}

export async function getAllTemplates(): Promise<TemplateConfig[]> {
  await syncBuiltinTemplates();
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
