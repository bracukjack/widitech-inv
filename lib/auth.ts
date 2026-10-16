import "server-only";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const SESSION_COOKIE = "wi_session";
const SESSION_DAYS = 30;
const RENEW_WITHIN_DAYS = 15;
const DAY = 86_400_000;
const BCRYPT_ROUNDS = 12;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

// --- passwords ---

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Compared against when the email doesn't exist, so response time doesn't reveal registered emails. */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);
export function burnPasswordCheck(password: string): Promise<boolean> {
  return bcrypt.compare(password, DUMMY_HASH);
}

// --- sessions ---

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db().insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  // Opportunistic cleanup of this user's expired sessions.
  await db()
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, new Date())));
  await setSessionCookie(token, expiresAt);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** Validates the session cookie against the database. Cached for the duration of one request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db()
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      disabled: schema.users.disabled,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);

  if (!row || row.disabled) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/**
 * Extends a session that is past half its lifetime. Only callable where cookies
 * may be written (server actions / route handlers), so it's invoked from actions.
 */
export async function renewSessionIfNeeded(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const id = hashToken(token);
  const [s] = await db().select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
  if (!s || s.expiresAt.getTime() - Date.now() > RENEW_WITHIN_DAYS * DAY) return;
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db().update(schema.sessions).set({ expiresAt }).where(eq(schema.sessions.id, id));
  await setSessionCookie(token, expiresAt);
}

// --- guards ---

/** For pages and layouts: sends signed-out visitors to the login page. */
export async function requireUserPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUserPage();
  if (user.role !== "admin") redirect("/");
  return user;
}

export class AuthError extends Error {}

/** For server actions: throws instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sesi berakhir, silakan login lagi");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Hanya admin yang boleh melakukan ini");
  return user;
}

// --- login throttling (per server process) ---

const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60_000;

export function loginBlocked(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() > a.until) {
    attempts.delete(key);
    return false;
  }
  return a.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string): void {
  const a = attempts.get(key);
  if (!a || Date.now() > a.until) attempts.set(key, { count: 1, until: Date.now() + WINDOW_MS });
  else a.count += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
