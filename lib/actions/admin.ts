"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { TemplateConfig } from "@/lib/themes";
import { DEFAULT_TEMPLATE_ID } from "@/lib/themes";
import { db, schema } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { destroyAllSessions, hashPassword, requireAdmin } from "@/lib/auth";
import { getAllTemplates, rowToTemplate } from "@/lib/data";
import { landingSchema, passwordSchema, SITE_ASSET_LIMITS, siteAssetSchema, siteSettingsSchema, templateSchema } from "@/lib/validation";
import { SITE_ASSET_KEYS, type SiteAssetKey, type SiteSettings } from "@/lib/site-config";
import type { LandingContent } from "@/lib/landing";
import { LANDING_ROW, SITE_ROW } from "@/lib/site";
import { run, UserError, type ActionResult } from "@/lib/actions/result";

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const id = z.string().uuid().parse(userId);
    if (id === admin.id) throw new UserError("Tidak bisa menonaktifkan akun sendiri");
    await db().update(schema.users).set({ disabled, updatedAt: new Date() }).where(eq(schema.users.id, id));
    if (disabled) await destroyAllSessions(id);
    revalidatePath("/admin", "layout");
    return null;
  });
}

/**
 * Creates or updates a template. `originalId` is the id being edited (null when
 * creating); ids are immutable once created because invoices reference them.
 */
export async function saveTemplateAction(input: unknown, originalId: string | null): Promise<ActionResult<TemplateConfig>> {
  return run(async () => {
    await requireAdmin();
    const t = templateSchema.parse(input);
    if (originalId !== null && originalId !== t.id) throw new UserError("ID template tidak bisa diubah");
    if (originalId === DEFAULT_TEMPLATE_ID && !t.isActive) {
      throw new UserError("Template default tidak bisa dinonaktifkan");
    }

    const { id, name, description, isActive, sortOrder, ...design } = t;
    const values = { name, description, design, isActive, sortOrder, updatedAt: new Date() };

    const [existing] = await db().select({ id: schema.templates.id }).from(schema.templates).where(eq(schema.templates.id, id)).limit(1);
    if (originalId === null && existing) throw new UserError(`ID "${id}" sudah dipakai template lain`);

    const [row] = existing
      ? await db().update(schema.templates).set(values).where(eq(schema.templates.id, id)).returning()
      : await db().insert(schema.templates).values({ id, ...values }).returning();
    return rowToTemplate(row);
  });
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (id === DEFAULT_TEMPLATE_ID) throw new UserError("Template default tidak bisa dihapus");
    // Invoices that used it fall back to the default template when rendered.
    await db().delete(schema.templates).where(eq(schema.templates.id, z.string().max(40).parse(id)));
    return null;
  });
}

/** Moves a template one place up or down and renumbers all of them. */
export async function moveTemplateAction(id: string, direction: -1 | 1): Promise<ActionResult<TemplateConfig[]>> {
  return run(async () => {
    await requireAdmin();
    const rows = await db().select({ id: schema.templates.id }).from(schema.templates).orderBy(asc(schema.templates.sortOrder), asc(schema.templates.name));
    const order = rows.map((r) => r.id);
    const from = order.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return getAllTemplates();
    [order[from], order[to]] = [order[to], order[from]];
    await db().transaction(async (tx) => {
      for (const [i, tid] of order.entries()) {
        await tx.update(schema.templates).set({ sortOrder: i }).where(eq(schema.templates.id, tid));
      }
    });
    return getAllTemplates();
  });
}

export async function saveSiteSettingsAction(input: unknown): Promise<ActionResult<SiteSettings>> {
  return run(async () => {
    await requireAdmin();
    const data = siteSettingsSchema.parse(input);
    await db()
      .insert(schema.siteSettings)
      .values({ id: SITE_ROW, data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data, updatedAt: new Date() } });
    // Metadata, colours and branding are rendered in layouts — refresh everything.
    revalidatePath("/", "layout");
    return data;
  });
}

/** Uploads (data URL) or removes (null) the logo, favicon or social share image. */
export async function saveSiteAssetAction(key: SiteAssetKey, dataUrl: string | null): Promise<ActionResult<number | null>> {
  return run(async () => {
    await requireAdmin();
    const k = z.enum(SITE_ASSET_KEYS).parse(key);
    if (dataUrl === null) {
      await db().delete(schema.siteAssets).where(eq(schema.siteAssets.key, k));
      revalidatePath("/", "layout");
      return null;
    }
    const url = siteAssetSchema.parse(dataUrl);
    if (url.length > SITE_ASSET_LIMITS[k]) throw new UserError("Ukuran gambar terlalu besar");
    const [, mime, data] = /^data:(image\/[a-z]+);base64,(.+)$/.exec(url)!;
    const now = new Date();
    await db()
      .insert(schema.siteAssets)
      .values({ key: k, mime, data, updatedAt: now })
      .onConflictDoUpdate({ target: schema.siteAssets.key, set: { mime, data, updatedAt: now } });
    revalidatePath("/", "layout");
    return now.getTime();
  });
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Readable random password (no 0/O, 1/l/I) for handing to a user. */
function generatePassword(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
}

/**
 * Sets a new password for a user — the given one, or a generated one when null —
 * and signs them out everywhere. Returns the password so the admin can pass it on.
 */
export async function resetUserPasswordAction(
  userId: string,
  newPassword: string | null
): Promise<ActionResult<{ password: string; email: string }>> {
  return run(async () => {
    const admin = await requireAdmin();
    const id = z.string().uuid().parse(userId);
    if (id === admin.id) throw new UserError("Ganti password Anda sendiri lewat menu Pengaturan");
    const password = newPassword === null ? generatePassword() : passwordSchema.parse(newPassword);
    const [user] = await db()
      .update(schema.users)
      .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({ email: schema.users.email });
    if (!user) throw new UserError("Pengguna tidak ditemukan");
    await destroyAllSessions(id);
    return { password, email: user.email };
  });
}

export async function saveLandingAction(input: unknown): Promise<ActionResult<LandingContent>> {
  return run(async () => {
    await requireAdmin();
    const data = landingSchema.parse(input) as LandingContent;
    await db()
      .insert(schema.siteSettings)
      .values({ id: LANDING_ROW, data: data as unknown as Record<string, unknown>, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: data as unknown as Record<string, unknown>, updatedAt: new Date() } });
    revalidatePath("/", "layout");
    return data;
  });
}
