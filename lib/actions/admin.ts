"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { TemplateConfig } from "@/lib/themes";
import { DEFAULT_TEMPLATE_ID } from "@/lib/themes";
import { db, schema } from "@/lib/db";
import { destroyAllSessions, requireAdmin } from "@/lib/auth";
import { getAllTemplates, rowToTemplate } from "@/lib/data";
import { templateSchema } from "@/lib/validation";
import { run, UserError, type ActionResult } from "@/lib/actions/result";

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const id = z.string().uuid().parse(userId);
    if (id === admin.id) throw new UserError("Tidak bisa menonaktifkan akun sendiri");
    await db().update(schema.users).set({ disabled, updatedAt: new Date() }).where(eq(schema.users.id, id));
    if (disabled) await destroyAllSessions(id);
    revalidatePath("/admin");
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
