export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({
      ok: false,
      error: "Supabase environment variables are missing."
    });
  }

  return res.status(200).json({
    ok: true,
    url,
    anonKey
  });
}
