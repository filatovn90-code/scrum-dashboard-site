import pg from "pg";

const { Pool } = pg;

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
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
