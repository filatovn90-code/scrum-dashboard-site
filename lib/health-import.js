import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { createHash } from "node:crypto";
import Busboy from "busboy";
import unzipper from "unzipper";
import sax from "sax";
import { query } from "./db.js";
import { ensureHealthSchema } from "./health-schema.js";
import {
  applyRecordToDailyMetric,
  createEmptyDailyMetrics,
  formatDailyMetricForInsert,
  normalizeRecordAttributes,
  normalizeWorkoutAttributes
} from "./health-utils.js";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export async function parseMultipartZipUpload(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Нужен ZIP-файл в формате multipart/form-data.");
  }

  const tempFilePath = path.join(os.tmpdir(), `apple-health-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`);
  const hash = createHash("sha256");
  let fileName = "";
  let uploaded = false;

  await new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE_BYTES
      }
    });

    busboy.on("file", (_fieldName, file, info) => {
      fileName = info.filename || "apple-health.zip";
      uploaded = true;

      const hashingStream = new Transform({
        transform(chunk, _encoding, callback) {
          hash.update(chunk);
          callback(null, chunk);
        }
      });

      pipeline(file, hashingStream, fs.createWriteStream(tempFilePath))
        .then(resolve)
        .catch(reject);

      file.on("limit", () => {
        reject(new Error("Файл слишком большой. Лимит 100 MB."));
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => {
      if (!uploaded) {
        reject(new Error("Файл не был загружен."));
      }
    });

    req.pipe(busboy);
  });

  return {
    fileName,
    fileHash: hash.digest("hex"),
    tempFilePath
  };
}

export async function importAppleHealthZip({ userId, fileName, fileHash, tempFilePath }) {
  await ensureHealthSchema();

  const existing = await query(
    `SELECT id, imported_at, status, records_total, records_created, records_skipped
     FROM health_imports
     WHERE user_id = $1 AND file_hash = $2 AND status <> 'error'
     LIMIT 1`,
    [userId, fileHash]
  );

  if (existing.rowCount) {
    return {
      alreadyImported: true,
      import: existing.rows[0]
    };
  }

  const insertImport = await query(
    `INSERT INTO health_imports (
      user_id, file_name, file_hash, status, records_total, records_created, records_skipped, raw_summary
    ) VALUES ($1, $2, $3, 'processing', 0, 0, 0, $4)
    RETURNING id, imported_at`,
    [userId, fileName, fileHash, { stage: "uploaded" }]
  );

  const importId = insertImport.rows[0].id;

  try {
    const result = await parseAndStoreZip({ userId, importId, tempFilePath });

    await updateImportSuccess(importId, result);

    return {
      alreadyImported: false,
      importId,
      importedAt: insertImport.rows[0].imported_at,
      ...result
    };
  } catch (error) {
    console.error("Health import failed", error);

    await query(
      `UPDATE health_imports
       SET status = 'error',
           error_message = $2
       WHERE id = $1`,
      [importId, error?.message || "Unknown import error"]
    );

    throw error;
  } finally {
    try {
      await fs.promises.unlink(tempFilePath);
    } catch {
      // Ignore cleanup failure.
    }
  }
}

async function parseAndStoreZip({ userId, importId, tempFilePath }) {
  let foundMainXml = false;
  let recordsTotal = 0;
  let recordsCreated = 0;
  let recordsSkipped = 0;
  const touchedDates = new Set();
  const rawSummary = {
    xml_files_seen: [],
    workout_route_files_seen: 0,
    ecg_files_seen: 0
  };

  // We walk the archive entry-by-entry so we can stream the main XML
  // without loading the whole Apple Health export into memory.
  const zipStream = fs.createReadStream(tempFilePath).pipe(unzipper.Parse({ forceStream: true }));

  for await (const entry of zipStream) {
    const entryPath = entry.path;
    const normalizedPath = entryPath.toLowerCase();

    if (isPrimaryHealthXml(normalizedPath)) {
      foundMainXml = true;
      rawSummary.xml_files_seen.push(entryPath);
      const result = await parseHealthExportXml(entry, { userId, importId, touchedDates });
      recordsTotal += result.recordsTotal;
      recordsCreated += result.recordsCreated;
      recordsSkipped += result.recordsSkipped;
      continue;
    }

    if (normalizedPath.includes("workout-routes") && normalizedPath.endsWith(".gpx")) {
      rawSummary.workout_route_files_seen += 1;
    }

    if (normalizedPath.includes("electrocardiograms") && normalizedPath.endsWith(".csv")) {
      rawSummary.ecg_files_seen += 1;
    }

    entry.autodrain();
  }

  if (!foundMainXml) {
    throw new Error("Не удалось найти основной XML-файл Apple Health внутри архива.");
  }

  await recalculateDailyMetrics(userId, Array.from(touchedDates));

  return {
    status: "completed",
    recordsTotal,
    recordsCreated,
    recordsSkipped,
    touchedDates: Array.from(touchedDates),
    rawSummary
  };
}

function isPrimaryHealthXml(normalizedPath) {
  return normalizedPath.endsWith(".xml")
    && !normalizedPath.includes("cda")
    && !normalizedPath.includes("electrocardiograms")
    && !normalizedPath.includes("workout-routes");
}

async function parseHealthExportXml(stream, { userId, importId, touchedDates }) {
  let recordsTotal = 0;
  let recordsCreated = 0;
  let recordsSkipped = 0;

  const recordBatch = [];
  const workoutBatch = [];
  let flushPromise = Promise.resolve();

  function scheduleFlush() {
    flushPromise = flushPromise.then(async () => {
      if (recordBatch.length) {
        const batch = recordBatch.splice(0, recordBatch.length);
        const result = await insertRecordBatch(userId, importId, batch);
        recordsCreated += result.created;
        recordsSkipped += result.skipped;
      }

      if (workoutBatch.length) {
        const batch = workoutBatch.splice(0, workoutBatch.length);
        const result = await insertWorkoutBatch(userId, importId, batch);
        recordsCreated += result.created;
        recordsSkipped += result.skipped;
      }
    });

    return flushPromise;
  }

  await new Promise((resolve, reject) => {
    // Apple Health exports can be large, so the XML is parsed as a stream.
    const parser = sax.createStream(true, { trim: true });

    parser.on("opentag", (node) => {
      try {
        const name = node.name;
        const attributes = node.attributes;

        if (name === "Record") {
          const normalized = normalizeRecordAttributes(attributes);
          recordBatch.push(normalized);
          recordsTotal += 1;
          if (normalized.dayKey) {
            touchedDates.add(normalized.dayKey);
          }
        }

        if (name === "Workout") {
          const normalized = normalizeWorkoutAttributes(attributes);
          workoutBatch.push(normalized);
          recordsTotal += 1;
          if (normalized.dayKey) {
            touchedDates.add(normalized.dayKey);
          }
        }

        // Flush in batches to keep the import stable on large archives.
        if (recordBatch.length >= 250 || workoutBatch.length >= 100) {
          scheduleFlush().catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });

    parser.on("error", reject);

    parser.on("end", () => {
      scheduleFlush().then(resolve).catch(reject);
    });

    stream.pipe(parser);
  });

  await flushPromise;

  return {
    recordsTotal,
    recordsCreated,
    recordsSkipped
  };
}

async function insertRecordBatch(userId, importId, records) {
  if (!records.length) {
    return { created: 0, skipped: 0 };
  }

  const columns = [
    "user_id",
    "source_import_id",
    "record_hash",
    "source_name",
    "source_version",
    "device",
    "type",
    "unit",
    "value",
    "start_date",
    "end_date",
    "creation_date",
    "raw_payload"
  ];

  const rows = records.map((record) => [
    userId,
    importId,
    record.recordHash,
    record.sourceName,
    record.sourceVersion,
    record.device,
    record.type,
    record.unit,
    record.value,
    record.startDate,
    record.endDate,
    record.creationDate,
    record.rawPayload
  ]);

  const result = await bulkInsert(
    "health_records",
    columns,
    rows,
    "ON CONFLICT (user_id, record_hash) DO NOTHING"
  );

  return {
    created: result.rowCount,
    skipped: records.length - result.rowCount
  };
}

async function insertWorkoutBatch(userId, importId, workouts) {
  if (!workouts.length) {
    return { created: 0, skipped: 0 };
  }

  const columns = [
    "user_id",
    "source_import_id",
    "workout_hash",
    "workout_type",
    "start_date",
    "end_date",
    "duration_minutes",
    "distance_km",
    "active_energy_kcal",
    "route_file_name",
    "raw_payload"
  ];

  const rows = workouts.map((workout) => [
    userId,
    importId,
    workout.workoutHash,
    workout.workoutType,
    workout.startDate,
    workout.endDate,
    workout.durationMinutes,
    workout.distanceKm,
    workout.activeEnergyKcal,
    null,
    workout.rawPayload
  ]);

  const result = await bulkInsert(
    "health_workouts",
    columns,
    rows,
    "ON CONFLICT (user_id, workout_hash) DO NOTHING"
  );

  return {
    created: result.rowCount,
    skipped: workouts.length - result.rowCount
  };
}

async function bulkInsert(table, columns, rows, conflictClause) {
  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const offset = rowIndex * columns.length;
    row.forEach((value) => values.push(value));
    return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(", ")})`;
  });

  return query(
    `INSERT INTO ${table} (${columns.join(", ")})
     VALUES ${placeholders.join(", ")}
     ${conflictClause}`,
    values
  );
}

async function recalculateDailyMetrics(userId, dayKeys) {
  if (!dayKeys.length) {
    return;
  }

  const recordResult = await query(
    `SELECT type, unit, value, start_date, end_date, raw_payload
     FROM health_records
     WHERE user_id = $1 AND LEFT(start_date, 10) = ANY($2::text[])`,
    [userId, dayKeys]
  );

  const workoutResult = await query(
    `SELECT workout_type, start_date, end_date, duration_minutes, distance_km, active_energy_kcal, raw_payload
     FROM health_workouts
     WHERE user_id = $1 AND LEFT(start_date, 10) = ANY($2::text[])`,
    [userId, dayKeys]
  );

  const metricsMap = new Map();

  dayKeys.forEach((dayKey) => {
    metricsMap.set(dayKey, createEmptyDailyMetrics(dayKey));
  });

  for (const row of recordResult.rows) {
    const dayKey = row.start_date?.slice(0, 10);
    if (!dayKey) {
      continue;
    }

    if (!metricsMap.has(dayKey)) {
      metricsMap.set(dayKey, createEmptyDailyMetrics(dayKey));
    }

    applyRecordToDailyMetric(metricsMap.get(dayKey), {
      type: row.type,
      unit: row.unit,
      value: row.value,
      startDate: row.start_date,
      endDate: row.end_date,
      rawPayload: row.raw_payload || {}
    });
  }

  for (const row of workoutResult.rows) {
    const dayKey = row.start_date?.slice(0, 10);
    if (!dayKey) {
      continue;
    }

    if (!metricsMap.has(dayKey)) {
      metricsMap.set(dayKey, createEmptyDailyMetrics(dayKey));
    }

    const metric = metricsMap.get(dayKey);
    metric.workouts_count += 1;
    metric.raw_payload.last_workout_type = row.workout_type || null;
  }

  const ordered = Array.from(metricsMap.values()).map(formatDailyMetricForInsert);

  for (const metric of ordered) {
    await query(
      `INSERT INTO health_daily_metrics (
        user_id, date, weight_kg, bmi, body_fat_percent, lean_body_mass_kg, muscle_mass_kg,
        visceral_fat, steps, walking_running_distance_km, active_energy_kcal, sleep_minutes,
        avg_heart_rate, resting_heart_rate, hrv_ms, vo2_max, workouts_count, raw_payload, updated_at
      ) VALUES (
        $1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
      )
      ON CONFLICT (user_id, date) DO UPDATE SET
        weight_kg = EXCLUDED.weight_kg,
        bmi = EXCLUDED.bmi,
        body_fat_percent = EXCLUDED.body_fat_percent,
        lean_body_mass_kg = EXCLUDED.lean_body_mass_kg,
        muscle_mass_kg = EXCLUDED.muscle_mass_kg,
        visceral_fat = EXCLUDED.visceral_fat,
        steps = EXCLUDED.steps,
        walking_running_distance_km = EXCLUDED.walking_running_distance_km,
        active_energy_kcal = EXCLUDED.active_energy_kcal,
        sleep_minutes = EXCLUDED.sleep_minutes,
        avg_heart_rate = EXCLUDED.avg_heart_rate,
        resting_heart_rate = EXCLUDED.resting_heart_rate,
        hrv_ms = EXCLUDED.hrv_ms,
        vo2_max = EXCLUDED.vo2_max,
        workouts_count = EXCLUDED.workouts_count,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()`,
      [
        userId,
        metric.date,
        metric.weight_kg,
        metric.bmi,
        metric.body_fat_percent,
        metric.lean_body_mass_kg,
        metric.muscle_mass_kg,
        metric.visceral_fat,
        metric.steps,
        metric.walking_running_distance_km,
        metric.active_energy_kcal,
        metric.sleep_minutes,
        metric.avg_heart_rate,
        metric.resting_heart_rate,
        metric.hrv_ms,
        metric.vo2_max,
        metric.workouts_count,
        metric.raw_payload
      ]
    );
  }
}

async function updateImportSuccess(importId, result) {
  await query(
    `UPDATE health_imports
     SET status = 'completed',
         imported_at = NOW(),
         records_total = $2,
         records_created = $3,
         records_skipped = $4,
         raw_summary = $5
     WHERE id = $1`,
    [
      importId,
      result.recordsTotal,
      result.recordsCreated,
      result.recordsSkipped,
      result.rawSummary
    ]
  );
}
