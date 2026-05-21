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

    const [latestMetric, weight30, sevenDayAverages, todayMetric, latestImport] = await Promise.all([
      query(
        `SELECT *
         FROM health_daily_metrics
         WHERE user_id = $1
         ORDER BY date DESC
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT date, weight_kg
         FROM health_daily_metrics
         WHERE user_id = $1
           AND weight_kg IS NOT NULL
           AND date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY date ASC`,
        [userId]
      ),
      query(
        `SELECT
           AVG(sleep_minutes) AS avg_sleep_minutes,
           AVG(resting_heart_rate) AS avg_resting_heart_rate,
           AVG(hrv_ms) AS avg_hrv_ms
         FROM health_daily_metrics
         WHERE user_id = $1
           AND date >= CURRENT_DATE - INTERVAL '7 days'`,
        [userId]
      ),
      query(
        `SELECT steps
         FROM health_daily_metrics
         WHERE user_id = $1 AND date = CURRENT_DATE
         LIMIT 1`,
        [userId]
      ),
      query(
        `SELECT imported_at, file_name, records_total, records_created, records_skipped, status
         FROM health_imports
         WHERE user_id = $1
         ORDER BY imported_at DESC
         LIMIT 1`,
        [userId]
      )
    ]);

    const latest = latestMetric.rows[0] || null;
    const weightRows = weight30.rows;
    const firstWeight = weightRows[0]?.weight_kg ?? null;
    const lastWeight = weightRows[weightRows.length - 1]?.weight_kg ?? latest?.weight_kg ?? null;

    return res.status(200).json({
      ok: true,
      summary: {
        currentWeightKg: latest?.weight_kg ?? null,
        weightChange30dKg: firstWeight !== null && lastWeight !== null ? Number((lastWeight - firstWeight).toFixed(2)) : null,
        bodyFatPercent: latest?.body_fat_percent ?? null,
        leanBodyMassKg: latest?.muscle_mass_kg ?? latest?.lean_body_mass_kg ?? null,
        avgSleep7dMinutes: numberOrNull(sevenDayAverages.rows[0]?.avg_sleep_minutes),
        stepsToday: todayMetric.rows[0]?.steps ?? latest?.steps ?? 0,
        avgRestingHeartRate7d: numberOrNull(sevenDayAverages.rows[0]?.avg_resting_heart_rate),
        hrvMs: latest?.hrv_ms ?? numberOrNull(sevenDayAverages.rows[0]?.avg_hrv_ms) ?? null
      },
      latestImport: latestImport.rows[0] || null
    });
  } catch (error) {
    console.error("GET /api/health/summary failed", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Не удалось получить сводку по здоровью."
    });
  }
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
}
