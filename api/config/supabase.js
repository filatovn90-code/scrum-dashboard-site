import { getServerSupabaseEnv } from "../../lib/supabase-env.js";
export { resolveSupabaseConfig } from "../../lib/supabase-env.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  try {
    const { url, anonKey } = getServerSupabaseEnv();

    return res.status(200).json({ ok: true, url, anonKey });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Supabase configuration unavailable."
    });
  }
}
