import "server-only";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export class UserError extends Error {}

/** Runs an action body and turns failures into a message the UI can show (prod builds hide thrown messages). */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Data tidak valid" };
    if (e instanceof AuthError || e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
  }
}
