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

  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();

  if (!from || !to) {
    return res.status(400).json({
      ok: false,
      error: "Нужны параметры from и to."
    });
  }

  try {
    await ensureHealthSchema();
    const result = await query(
      `SELECT date, weight_kg, bmi, body_fat_percent, lean_body_mass_kg, muscle_mass_kg,
              visceral_fat, steps, walking_running_distance_km, active_energy_kcal, sleep_minutes,
              avg_heart_rate, resting_heart_rate, hrv_ms, vo2_max, workouts_count, updated_at
       FROM health_daily_metrics
       WHERE user_id = $1
         AND date BETWEEN $2::date AND $3::date
       ORDER BY date ASC`,
      [userId, from, to]
    );

    return res.status(200).json({
      ok: true,
      items: result.rows
    });
  } catch (error) {
    console.error("GET /api/health/daily failed", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Не удалось получить дневные данные."
    });
  }
}
