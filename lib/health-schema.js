import { query } from "./db.js";

let schemaReadyPromise;

export function ensureHealthSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createSchema();
  }

  return schemaReadyPromise;
}

async function createSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS health_imports (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL,
      records_total INTEGER NOT NULL DEFAULT 0,
      records_created INTEGER NOT NULL DEFAULT 0,
      records_skipped INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      raw_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
      UNIQUE (user_id, file_hash)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS health_records (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_import_id BIGINT REFERENCES health_imports(id) ON DELETE SET NULL,
      record_hash TEXT NOT NULL,
      source_name TEXT,
      source_version TEXT,
      device TEXT,
      type TEXT NOT NULL,
      unit TEXT,
      value DOUBLE PRECISION,
      start_date TEXT,
      end_date TEXT,
      creation_date TEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, record_hash)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS health_daily_metrics (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      date DATE NOT NULL,
      weight_kg DOUBLE PRECISION,
      bmi DOUBLE PRECISION,
      body_fat_percent DOUBLE PRECISION,
      lean_body_mass_kg DOUBLE PRECISION,
      muscle_mass_kg DOUBLE PRECISION,
      visceral_fat DOUBLE PRECISION,
      steps DOUBLE PRECISION,
      walking_running_distance_km DOUBLE PRECISION,
      active_energy_kcal DOUBLE PRECISION,
      sleep_minutes DOUBLE PRECISION,
      avg_heart_rate DOUBLE PRECISION,
      resting_heart_rate DOUBLE PRECISION,
      hrv_ms DOUBLE PRECISION,
      vo2_max DOUBLE PRECISION,
      workouts_count INTEGER,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, date)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS health_workouts (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_import_id BIGINT REFERENCES health_imports(id) ON DELETE SET NULL,
      workout_hash TEXT NOT NULL,
      workout_type TEXT,
      start_date TEXT,
      end_date TEXT,
      duration_minutes DOUBLE PRECISION,
      distance_km DOUBLE PRECISION,
      active_energy_kcal DOUBLE PRECISION,
      route_file_name TEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, workout_hash)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS health_ecg (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_import_id BIGINT REFERENCES health_imports(id) ON DELETE SET NULL,
      ecg_hash TEXT NOT NULL,
      measured_at TEXT,
      classification TEXT,
      average_heart_rate DOUBLE PRECISION,
      file_name TEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, ecg_hash)
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_health_records_user_start ON health_records(user_id, start_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_health_daily_metrics_user_date ON health_daily_metrics(user_id, date DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_health_workouts_user_start ON health_workouts(user_id, start_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_health_imports_user_imported_at ON health_imports(user_id, imported_at DESC);`);
}
