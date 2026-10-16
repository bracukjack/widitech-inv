"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import {
  burnPasswordCheck,
  clearLoginFailures,
  createSession,
  destroyAllSessions,
  destroySession,
  hashPassword,
  loginBlocked,
  recordLoginFailure,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { defaultSettingsFor } from "@/lib/data";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { run, UserError, type ActionResult } from "@/lib/actions/result";

export interface AuthFormState {
  error?: string;
  email?: string;
  name?: string;
}

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Password wajib diisi").max(200) });

export async function loginAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  const email = String(form.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${parsed.data.email}|${ip}`;
  if (loginBlocked(key)) return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.", email };

  const [user] = await db().select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  const valid = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : await burnPasswordCheck(parsed.data.password);

  if (!user || !valid) {
    recordLoginFailure(key);
    return { error: "Email atau password salah", email };
  }
  if (user.disabled) return { error: "Akun ini dinonaktifkan. Hubungi admin.", email };

  clearLoginFailures(key);
  await db().update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(200),
  email: emailSchema,
  password: passwordSchema,
});

export async function registerAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const raw = { name: form.get("name"), email: form.get("email"), password: form.get("password") };
  const keep = { email: String(raw.email ?? ""), name: String(raw.name ?? "") };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, ...keep };

  const { name, email, password } = parsed.data;
  const [exists] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) return { error: "Email sudah terdaftar. Silakan login.", ...keep };

  const passwordHash = await hashPassword(password);
  const userId = await db().transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({ email, name, passwordHash, role: "user", lastLoginAt: new Date() })
      .returning({ id: schema.users.id });
    await tx.insert(schema.userSettings).values({ userId: user.id, ...defaultSettingsFor({ name, email }) });
    return user.id;
  });

  await createSession(userId);
  redirect(safeNext(form.get("next")));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(input: { current: string; next: string }): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const next = passwordSchema.parse(input.next);
    const [row] = await db().select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(String(input.current ?? ""), row.passwordHash))) {
      throw new UserError("Password lama salah");
    }
    await db()
      .update(schema.users)
      .set({ passwordHash: await hashPassword(next), updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
    // Sign out every other device, keep this one signed in.
    await destroyAllSessions(user.id);
    await createSession(user.id);
    return null;
  });
}

/** Only allow same-site relative redirects after login. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/invoices";
}
