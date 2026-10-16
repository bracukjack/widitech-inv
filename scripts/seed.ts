/**
 * Seeds the built-in templates and the master admin account.
 * Safe to run repeatedly: existing templates and users are left untouched.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { BUILTIN_TEMPLATES } from "../lib/themes";
import { DEFAULT_DEFAULTS, DEFAULT_PROFILE } from "../lib/normalize";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set (lihat .env.example)");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  // Templates
  for (const t of BUILTIN_TEMPLATES) {
    const { id, name, description, isActive, sortOrder, ...design } = t;
    await db.insert(schema.templates).values({ id, name, description, design, isActive, sortOrder }).onConflictDoNothing();
  }
  console.log(`✓ ${BUILTIN_TEMPLATES.length} template bawaan tersedia`);

  // Master admin
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Master Admin";
  if (!email || !password) {
    console.log("! ADMIN_EMAIL / ADMIN_PASSWORD kosong — akun admin tidak dibuat");
  } else if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD minimal 8 karakter");
  } else {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing) {
      if (existing.role !== "admin") {
        await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing.id));
        console.log(`✓ ${email} dijadikan admin`);
      } else {
        console.log(`✓ Admin ${email} sudah ada (password tidak diubah)`);
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db
        .insert(schema.users)
        .values({ email, name, passwordHash, role: "admin" })
        .returning({ id: schema.users.id });
      await db.insert(schema.userSettings).values({
        userId: user.id,
        profile: { ...DEFAULT_PROFILE, name, email },
        defaults: { ...DEFAULT_DEFAULTS },
      });
      console.log(`✓ Admin ${email} dibuat`);
    }
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
