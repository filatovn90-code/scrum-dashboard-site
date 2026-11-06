export function resolveDatabaseUrl({ databaseUrl, supabaseUrl, environment } = {}) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  let connection;
  try {
    connection = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is invalid.");
  }

  if (connection.protocol !== "postgres:" && connection.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  }

  if (environment !== "production") {
    let supabase;
    try {
      supabase = new URL(supabaseUrl);
    } catch {
      throw new Error("Preview Supabase URL is missing or invalid.");
    }
    const match = supabase.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
    if (supabase.protocol !== "https:" || !match) {
      throw new Error("Preview Supabase URL is missing or invalid.");
    }
    const project = match[1];
    if (project === "fzgphisavsmtmvserson") {
      throw new Error("Preview cannot use the production Supabase project.");
    }

    const directHost = `db.${project}.supabase.co`;
    const poolerUser = `postgres.${project}`;
    const matchingPooler = connection.hostname.endsWith(".pooler.supabase.com")
      && decodeURIComponent(connection.username) === poolerUser;
    if (connection.hostname !== directHost && !matchingPooler) {
      throw new Error("Preview DATABASE_URL must target the matching Supabase project.");
    }
  }

  return databaseUrl;
}
