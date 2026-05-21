import { query } from "../../lib/db.js";
import { ensureHealthSchema } from "../../lib/health-schema.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  const userId = String(req.headers["x-user-id"] || "").trim();
  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: "Не удалось определить пользователя."
    });
  }

  try {
    await ensureHealthSchema();
    const result = await query(
      `SELECT date, weight_kg, body_fat_percent, muscle_mass_kg, lean_body_mass_kg, bmi,
              steps, sleep_minutes, resting_heart_rate, hrv_ms
       FROM health_daily_metrics
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 100`,
      [userId]
    );

    return res.status(200).json({
      ok: true,
      items: result.rows
    });
  } catch (error) {
    console.error("GET /api/health/records failed", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Не удалось получить последние измерения."
    });
  }
}
