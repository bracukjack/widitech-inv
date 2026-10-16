"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Invoice, Settings } from "@/types/invoice";
import { db, schema } from "@/lib/db";
import { renewSessionIfNeeded, requireUser } from "@/lib/auth";
import { defaultSettingsFor, getAppData, rowToInvoice, type AppData } from "@/lib/data";
import { invoiceSchema, settingsSchema } from "@/lib/validation";
import { uid } from "@/lib/invoice";
import { run, UserError, type ActionResult } from "@/lib/actions/result";

type InvoiceInput = z.infer<typeof invoiceSchema>;

function toDate(value: string | undefined, fallback: Date): Date {
  const d = value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function columnsFor(inv: InvoiceInput) {
  return {
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    status: inv.status,
    currency: inv.currency,
    invoiceDate: inv.invoiceDate || null,
    dueDate: inv.dueDate || null,
  };
}

/** The stored document never carries server-owned timestamps — those live in columns. */
function documentFor(inv: InvoiceInput): Invoice {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, paidAt, ...rest } = inv;
  return { ...rest, createdAt: "", updatedAt: "" };
}

export async function refreshAppDataAction(): Promise<ActionResult<AppData>> {
  return run(async () => {
    const user = await requireUser();
    await renewSessionIfNeeded();
    return getAppData(user);
  });
}

export async function saveInvoiceAction(input: unknown): Promise<ActionResult<Invoice>> {
  return run(async () => {
    const user = await requireUser();
    const inv = invoiceSchema.parse(input);
    const now = new Date();

    const [existing] = await db().select().from(schema.invoices).where(eq(schema.invoices.id, inv.id)).limit(1);
    if (existing && existing.userId !== user.id) throw new UserError("Invoice tidak ditemukan");

    const paidAt = inv.status === "Paid" ? (existing?.paidAt ?? now) : null;
    const values = { ...columnsFor(inv), data: documentFor(inv), paidAt, updatedAt: now };

    const [row] = existing
      ? await db()
          .update(schema.invoices)
          .set(values)
          .where(and(eq(schema.invoices.id, inv.id), eq(schema.invoices.userId, user.id)))
          .returning()
      : await db()
          .insert(schema.invoices)
          .values({ id: inv.id, userId: user.id, ...values, createdAt: now })
          .returning();
    return rowToInvoice(row);
  });
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    await db()
      .delete(schema.invoices)
      .where(and(eq(schema.invoices.id, z.string().max(64).parse(id)), eq(schema.invoices.userId, user.id)));
    return null;
  });
}

export async function saveSettingsAction(input: unknown): Promise<ActionResult<Settings>> {
  return run(async () => {
    const user = await requireUser();
    const settings = settingsSchema.parse(input);
    await db()
      .insert(schema.userSettings)
      .values({ userId: user.id, ...settings, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.userSettings.userId,
        set: { ...settings, updatedAt: new Date() },
      });
    return settings;
  });
}

const importSchema = z.object({
  invoices: z.array(z.unknown()).max(5000),
  settings: z.unknown().optional(),
});

/** Imports a backup file or this browser's old localStorage data into the account. */
export async function importDataAction(input: unknown): Promise<ActionResult<{ invoices: number }>> {
  return run(async () => {
    const user = await requireUser();
    const payload = importSchema.parse(input);
    const incoming = payload.invoices.map((i) => invoiceSchema.parse(i));
    const settings = payload.settings ? settingsSchema.parse(payload.settings) : null;

    await db().transaction(async (tx) => {
      const ids = incoming.map((i) => i.id);
      const taken = ids.length
        ? await tx
            .select({ id: schema.invoices.id, userId: schema.invoices.userId })
            .from(schema.invoices)
            .where(inArray(schema.invoices.id, ids))
        : [];
      const owner = new Map(taken.map((t) => [t.id, t.userId]));
      const now = new Date();

      for (const inv of incoming) {
        // An id owned by someone else (or a legacy non-unique id) gets a fresh one.
        const id = owner.has(inv.id) && owner.get(inv.id) !== user.id ? uid() : inv.id;
        const values = {
          ...columnsFor(inv),
          data: documentFor({ ...inv, id }),
          paidAt: inv.status === "Paid" ? toDate(inv.paidAt, now) : null,
          updatedAt: now,
        };
        await tx
          .insert(schema.invoices)
          .values({ id, userId: user.id, ...values, createdAt: toDate(inv.createdAt, now) })
          .onConflictDoUpdate({ target: schema.invoices.id, set: values });
      }

      if (settings) {
        await tx
          .insert(schema.userSettings)
          .values({ userId: user.id, ...settings, updatedAt: now })
          .onConflictDoUpdate({ target: schema.userSettings.userId, set: { ...settings, updatedAt: now } });
      }
    });
    return { invoices: incoming.length };
  });
}

export async function clearMyDataAction(): Promise<ActionResult<Settings>> {
  return run(async () => {
    const user = await requireUser();
    const fresh = defaultSettingsFor(user);
    await db().transaction(async (tx) => {
      await tx.delete(schema.invoices).where(eq(schema.invoices.userId, user.id));
      await tx
        .insert(schema.userSettings)
        .values({ userId: user.id, ...fresh })
        .onConflictDoUpdate({ target: schema.userSettings.userId, set: { ...fresh, updatedAt: new Date() } });
    });
    return fresh;
  });
}
