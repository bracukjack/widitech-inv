import "server-only";
import { count, desc, eq, max } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { rowToInvoice } from "@/lib/data";

export async function listUsers() {
  const stats = db()
    .select({
      userId: schema.invoices.userId,
      invoiceCount: count(schema.invoices.id).as("invoice_count"),
      lastInvoiceAt: max(schema.invoices.updatedAt).as("last_invoice_at"),
    })
    .from(schema.invoices)
    .groupBy(schema.invoices.userId)
    .as("stats");

  const rows = await db()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      disabled: schema.users.disabled,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
      invoiceCount: stats.invoiceCount,
      lastInvoiceAt: stats.lastInvoiceAt,
    })
    .from(schema.users)
    .leftJoin(stats, eq(stats.userId, schema.users.id))
    .orderBy(desc(schema.users.createdAt));

  return rows.map((r) => ({
    ...r,
    invoiceCount: Number(r.invoiceCount ?? 0),
    createdAt: r.createdAt.toISOString(),
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    lastInvoiceAt: r.lastInvoiceAt ? new Date(r.lastInvoiceAt).toISOString() : null,
  }));
}

export type AdminUserRow = Awaited<ReturnType<typeof listUsers>>[number];

export async function getUserWithInvoices(userId: string) {
  const [user] = await db()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      disabled: schema.users.disabled,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user) return null;
  const rows = await db()
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.userId, userId))
    .orderBy(desc(schema.invoices.invoiceDate), desc(schema.invoices.createdAt));
  return {
    user: { ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() ?? null },
    invoices: rows.map(rowToInvoice),
  };
}
