import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: DB };

/** Lazily connects so builds and pages that never touch the DB don't need DATABASE_URL. */
export function db(): DB {
  if (globalForDb.__db) return globalForDb.__db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set. Salin .env.example ke .env.local dan isi koneksi PostgreSQL.");
  const client = postgres(url, { max: 10 });
  globalForDb.__db = drizzle(client, { schema });
  return globalForDb.__db;
}

export { schema };
