import { createHash } from "node:crypto";

const BODY_FAT_TYPES = new Set([
  "HKQuantityTypeIdentifierBodyFatPercentage"
]);

const LEAN_MASS_TYPES = new Set([
  "HKQuantityTypeIdentifierLeanBodyMass"
]);

const MUSCLE_MASS_TYPES = new Set([
  "HKQuantityTypeIdentifierMuscleMass",
  "HKQuantityTypeIdentifierSkeletalMuscleMass"
]);

const VISERAL_FAT_TYPES = new Set([
  "HKQuantityTypeIdentifierVisceralFat",
  "HKQuantityTypeIdentifierVisceralAdiposeTissue"
]);

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function createRecordHash(payload) {
  return sha256(
    [
      payload.type,
      payload.unit,
      payload.value,
      payload.startDate,
      payload.endDate,
      payload.creationDate,
      payload.sourceName,
      payload.sourceVersion,
      payload.device
    ].join("|")
  );
}

export function createWorkoutHash(payload) {
  return sha256(
    [
      payload.workoutActivityType,
      payload.startDate,
      payload.endDate,
      payload.duration,
      payload.totalDistance,
      payload.totalDistanceUnit,
      payload.totalEnergyBurned,
      payload.totalEnergyBurnedUnit
    ].join("|")
  );
}

export function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDayKey(dateString) {
  if (!dateString) {
    return null;
  }

  const safe = String(dateString).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(safe) ? safe.slice(0, 10) : null;
}

export function normalizeUnitValue(type, value, unit) {
  const numericValue = parseNumber(value);

  if (numericValue === null) {
    return { value: null, unit: unit || null };
  }

  switch (type) {
    case "HKQuantityTypeIdentifierBodyMass":
      if (unit === "lb") {
        return { value: numericValue * 0.45359237, unit: "kg" };
      }
      return { value: numericValue, unit: "kg" };

    case "HKQuantityTypeIdentifierBodyMassIndex":
      return { value: numericValue, unit: "count" };

    case "HKQuantityTypeIdentifierDistanceWalkingRunning":
      if (unit === "m") {
        return { value: numericValue / 1000, unit: "km" };
      }
      if (unit === "mi") {
        return { value: numericValue * 1.60934, unit: "km" };
      }
      return { value: numericValue, unit: "km" };

    case "HKQuantityTypeIdentifierActiveEnergyBurned":
      if (unit === "cal") {
        return { value: numericValue / 1000, unit: "kcal" };
      }
      if (unit === "kJ") {
        return { value: numericValue / 4.184, unit: "kcal" };
      }
      return { value: numericValue, unit: "kcal" };

    case "HKQuantityTypeIdentifierHeartRate":
    case "HKQuantityTypeIdentifierRestingHeartRate":
      return { value: numericValue, unit: "bpm" };

    case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
      if (unit === "s") {
        return { value: numericValue * 1000, unit: "ms" };
      }
      return { value: numericValue, unit: "ms" };

    case "HKQuantityTypeIdentifierVO2Max":
      return { value: numericValue, unit: "ml/kg/min" };

    default:
      if (BODY_FAT_TYPES.has(type)) {
        return { value: numericValue <= 1 ? numericValue * 100 : numericValue, unit: "%" };
      }

      if (LEAN_MASS_TYPES.has(type) || MUSCLE_MASS_TYPES.has(type)) {
        if (unit === "lb") {
          return { value: numericValue * 0.45359237, unit: "kg" };
        }
        return { value: numericValue, unit: "kg" };
      }

      if (VISERAL_FAT_TYPES.has(type)) {
        return { value: numericValue, unit: unit || "count" };
      }

      if (type === "HKQuantityTypeIdentifierStepCount") {
        return { value: numericValue, unit: "count" };
      }

      return { value: numericValue, unit: unit || null };
  }
}

export function normalizeRecordAttributes(attributes) {
  const type = attributes.type || "UnknownRecord";
  const normalized = normalizeUnitValue(type, attributes.value, attributes.unit);

  return {
    recordHash: createRecordHash(attributes),
    sourceName: attributes.sourceName || null,
    sourceVersion: attributes.sourceVersion || null,
    device: attributes.device || null,
    type,
    unit: normalized.unit,
    value: normalized.value,
    startDate: attributes.startDate || null,
    endDate: attributes.endDate || null,
    creationDate: attributes.creationDate || null,
    dayKey: getDayKey(attributes.startDate),
    rawPayload: attributes
  };
}

export function normalizeWorkoutAttributes(attributes) {
  const distance = normalizeUnitValue("HKQuantityTypeIdentifierDistanceWalkingRunning", attributes.totalDistance, attributes.totalDistanceUnit);
  const energy = normalizeUnitValue("HKQuantityTypeIdentifierActiveEnergyBurned", attributes.totalEnergyBurned, attributes.totalEnergyBurnedUnit);

  let durationMinutes = parseNumber(attributes.duration);
  if (durationMinutes !== null) {
    const durationUnit = String(attributes.durationUnit || "").toLowerCase();
    if (durationUnit === "s" || durationUnit === "sec") {
      durationMinutes = durationMinutes / 60;
    } else if (durationUnit === "h" || durationUnit === "hr") {
      durationMinutes = durationMinutes * 60;
    }
  }

  return {
    workoutHash: createWorkoutHash(attributes),
    workoutType: attributes.workoutActivityType || "UnknownWorkout",
    startDate: attributes.startDate || null,
    endDate: attributes.endDate || null,
    durationMinutes,
    distanceKm: distance.value,
    activeEnergyKcal: energy.value,
    dayKey: getDayKey(attributes.startDate),
    rawPayload: attributes
  };
}

export function isSleepRecord(record) {
  return record.type === "HKCategoryTypeIdentifierSleepAnalysis";
}

export function getSleepMinutes(record) {
  if (!isSleepRecord(record)) {
    return 0;
  }

  const rawValue = String(record.rawPayload?.value ?? "");
  const category = String(record.rawPayload?.categoryValue ?? "");
  const lower = `${rawValue} ${category}`.toLowerCase();

  if (lower.includes("awake") || rawValue === "HKCategoryValueSleepAnalysisAwake" || rawValue === "2") {
    return 0;
  }

  const start = record.startDate ? new Date(record.startDate) : null;
  const end = record.endDate ? new Date(record.endDate) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, (end.getTime() - start.getTime()) / 60000);
}

export function createEmptyDailyMetrics(dayKey) {
  return {
    date: dayKey,
    weight_kg: null,
    bmi: null,
    body_fat_percent: null,
    lean_body_mass_kg: null,
    muscle_mass_kg: null,
    visceral_fat: null,
    steps: 0,
    walking_running_distance_km: 0,
    active_energy_kcal: 0,
    sleep_minutes: 0,
    avg_heart_rate: null,
    resting_heart_rate: null,
    hrv_ms: null,
    vo2_max: null,
    workouts_count: 0,
    raw_payload: {
      heart_rate_samples: 0,
      resting_heart_rate_samples: 0,
      hrv_samples: 0
    }
  };
}

export function applyRecordToDailyMetric(metric, record) {
  switch (record.type) {
    case "HKQuantityTypeIdentifierBodyMass":
      metric.weight_kg = record.value ?? metric.weight_kg;
      break;
    case "HKQuantityTypeIdentifierBodyMassIndex":
      metric.bmi = record.value ?? metric.bmi;
      break;
    case "HKQuantityTypeIdentifierStepCount":
      metric.steps += record.value || 0;
      break;
    case "HKQuantityTypeIdentifierDistanceWalkingRunning":
      metric.walking_running_distance_km += record.value || 0;
      break;
    case "HKQuantityTypeIdentifierActiveEnergyBurned":
      metric.active_energy_kcal += record.value || 0;
      break;
    case "HKQuantityTypeIdentifierHeartRate":
      metric.raw_payload.heart_rate_samples += 1;
      metric.avg_heart_rate = runningAverage(metric.avg_heart_rate, metric.raw_payload.heart_rate_samples, record.value);
      break;
    case "HKQuantityTypeIdentifierRestingHeartRate":
      metric.raw_payload.resting_heart_rate_samples += 1;
      metric.resting_heart_rate = runningAverage(metric.resting_heart_rate, metric.raw_payload.resting_heart_rate_samples, record.value);
      break;
    case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
      metric.raw_payload.hrv_samples += 1;
      metric.hrv_ms = runningAverage(metric.hrv_ms, metric.raw_payload.hrv_samples, record.value);
      break;
    case "HKQuantityTypeIdentifierVO2Max":
      metric.vo2_max = record.value ?? metric.vo2_max;
      break;
    default:
      if (BODY_FAT_TYPES.has(record.type)) {
        metric.body_fat_percent = record.value ?? metric.body_fat_percent;
      } else if (LEAN_MASS_TYPES.has(record.type)) {
        metric.lean_body_mass_kg = record.value ?? metric.lean_body_mass_kg;
      } else if (MUSCLE_MASS_TYPES.has(record.type)) {
        metric.muscle_mass_kg = record.value ?? metric.muscle_mass_kg;
      } else if (VISERAL_FAT_TYPES.has(record.type)) {
        metric.visceral_fat = record.value ?? metric.visceral_fat;
      } else if (isSleepRecord(record)) {
        metric.sleep_minutes += getSleepMinutes(record);
      }
  }
}

function runningAverage(currentValue, count, nextValue) {
  if (nextValue === null || nextValue === undefined) {
    return currentValue;
  }

  if (currentValue === null || currentValue === undefined) {
    return nextValue;
  }

  return ((currentValue * (count - 1)) + nextValue) / count;
}

export function formatDailyMetricForInsert(metric) {
  return {
    ...metric,
    steps: roundNumber(metric.steps),
    walking_running_distance_km: roundNumber(metric.walking_running_distance_km),
    active_energy_kcal: roundNumber(metric.active_energy_kcal),
    sleep_minutes: roundNumber(metric.sleep_minutes),
    avg_heart_rate: roundNumber(metric.avg_heart_rate),
    resting_heart_rate: roundNumber(metric.resting_heart_rate),
    hrv_ms: roundNumber(metric.hrv_ms),
    vo2_max: roundNumber(metric.vo2_max),
    weight_kg: roundNumber(metric.weight_kg),
    bmi: roundNumber(metric.bmi),
    body_fat_percent: roundNumber(metric.body_fat_percent),
    lean_body_mass_kg: roundNumber(metric.lean_body_mass_kg),
    muscle_mass_kg: roundNumber(metric.muscle_mass_kg),
    visceral_fat: roundNumber(metric.visceral_fat)
  };
}

function roundNumber(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return value ?? null;
  }

  return Math.round(value * 100) / 100;
}
