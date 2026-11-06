const PRODUCTION_SUPABASE_HOST = "fzgphisavsmtmvserson.supabase.co";

export function resolveSupabaseConfig({ url, anonKey, environment } = {}) {
  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Supabase URL is invalid.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Supabase URL must use HTTPS.");
  }

  if (environment !== "production" && parsed.hostname === PRODUCTION_SUPABASE_HOST) {
    throw new Error("Preview cannot use the production Supabase project.");
  }

  return { url, anonKey };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  try {
    const { url, anonKey } = resolveSupabaseConfig({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      environment: process.env.VERCEL_ENV
    });

    return res.status(200).json({ ok: true, url, anonKey });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Supabase configuration unavailable."
    });
  }
}
