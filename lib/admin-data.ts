import "server-only";
import { count, desc, eq, max, sql } from "drizzle-orm";
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

const DAY = 86_400_000;

/** Numbers and recent activity for the admin dashboard home. */
export async function getAdminOverview() {
  // Raw sql`` params must be strings for the postgres driver — pass ISO timestamps.
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [[u], [inv], recentUsers, recentInvoices] = await Promise.all([
    db()
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${schema.users.disabled} = false)`,
        newThisWeek: sql<number>`count(*) filter (where ${schema.users.createdAt} >= ${weekAgo}::timestamptz)`,
        activeThisWeek: sql<number>`count(*) filter (where ${schema.users.lastLoginAt} >= ${weekAgo}::timestamptz)`,
      })
      .from(schema.users),
    db()
      .select({
        total: count(),
        thisMonth: sql<number>`count(*) filter (where ${schema.invoices.createdAt} >= ${monthStart}::timestamptz)`,
        paid: sql<number>`count(*) filter (where ${schema.invoices.status} = 'Paid')`,
      })
      .from(schema.invoices),
    db()
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
        disabled: schema.users.disabled,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(6),
    db()
      .select({ row: schema.invoices, email: schema.users.email, userId: schema.users.id })
      .from(schema.invoices)
      .innerJoin(schema.users, eq(schema.users.id, schema.invoices.userId))
      .orderBy(desc(schema.invoices.createdAt))
      .limit(8),
  ]);

  return {
    users: {
      total: Number(u.total),
      active: Number(u.active),
      newThisWeek: Number(u.newThisWeek),
      activeThisWeek: Number(u.activeThisWeek),
    },
    invoices: { total: Number(inv.total), thisMonth: Number(inv.thisMonth), paid: Number(inv.paid) },
    recentUsers: recentUsers.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    recentInvoices: recentInvoices.map((r) => ({ invoice: rowToInvoice(r.row), email: r.email, userId: r.userId })),
  };
}
