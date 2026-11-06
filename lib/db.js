import pg from "pg";
import { resolveDatabaseUrl } from "./db-config.js";

const { Pool } = pg;

function createPool() {
  const connectionString = resolveDatabaseUrl({
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    environment: process.env.VERCEL_ENV
  });

  return new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false }
  });
}

export const pool = globalThis.__scrumDashboardPool || createPool();

if (!globalThis.__scrumDashboardPool) {
  globalThis.__scrumDashboardPool = pool;
}

export async function query(text, params = []) {
  return pool.query(text, params);
}
