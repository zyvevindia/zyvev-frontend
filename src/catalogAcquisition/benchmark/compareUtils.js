/**
 * Field comparison utilities for golden dataset benchmarking.
 */

const FEATURE_KEYS = [
  "sunroof",
  "ventilatedSeats",
  "camera360",
  "connectedCar",
  "v2l",
  "v2v",
  "adas",
];

const NUMERIC_FIELDS = new Set([
  "startingPrice",
  "topVariantPrice",
  "exShowroomPrice",
  "batteryCapacityKwh",
  "claimedRangeKm",
  "acChargingKw",
  "dcChargingKw",
  "acChargingTimeHours",
  "dcChargingTimeMinutes",
  "powerPs",
  "powerKw",
  "torqueNm",
  "airbags",
  "ncapRating",
  "vehicleWarrantyYears",
  "batteryWarrantyYears",
  "lengthMm",
  "widthMm",
  "heightMm",
  "wheelbaseMm",
]);

export const BENCHMARK_FEATURE_KEYS = Object.freeze([...FEATURE_KEYS]);

export function normalizeString(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s.-]/g, "");
}

export function normalizeVariantName(name) {
  return normalizeString(name)
    .replace(/\+/g, " plus ")
    .replace(/\s+/g, " ");
}

export function variantNameSimilarity(a, b) {
  const na = normalizeVariantName(a);
  const nb = normalizeVariantName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union ? inter / union : 0;
}

export function numericTolerance(expected, actual, { relative = 0.02, absolute = 0 } = {}) {
  const e = Number(expected);
  const a = Number(actual);
  if (!Number.isFinite(e) || !Number.isFinite(a)) return false;
  const diff = Math.abs(e - a);
  const relOk = diff <= Math.abs(e) * relative;
  const absOk = absolute > 0 ? diff <= absolute : false;
  return relOk || absOk;
}

export function priceTolerance(expected, actual) {
  return numericTolerance(expected, actual, { relative: 0.02, absolute: 5000 });
}

export function fieldTolerance(fieldKey, expected, actual) {
  if (NUMERIC_FIELDS.has(fieldKey)) {
    if (fieldKey.includes("Price")) return priceTolerance(expected, actual);
    if (fieldKey === "batteryCapacityKwh") {
      return numericTolerance(expected, actual, { relative: 0.03, absolute: 1 });
    }
    return numericTolerance(expected, actual, { relative: 0.05, absolute: 1 });
  }
  if (typeof expected === "boolean" || typeof actual === "boolean") {
    return Boolean(expected) === Boolean(actual);
  }
  return normalizeString(expected) === normalizeString(actual);
}

export function compareField(fieldKey, expected, actual) {
  const expMissing = expected === null || expected === undefined || expected === "";
  const actMissing = actual === null || actual === undefined || actual === "";

  if (expMissing && actMissing) {
    return { fieldKey, status: "skipped", correct: null, expected, actual };
  }
  if (expMissing || actMissing) {
    return { fieldKey, status: "missing", correct: false, expected, actual };
  }

  const correct = fieldTolerance(fieldKey, expected, actual);
  return { fieldKey, status: correct ? "correct" : "incorrect", correct, expected, actual };
}

export function extractFieldValue(entry) {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === "object" && "value" in entry) return entry.value ?? null;
  return entry;
}

export function extractFieldConfidence(entry, fallback = 0) {
  if (entry && typeof entry === "object" && "confidence" in entry) {
    const n = Number(entry.confidence);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function confidenceBandLabel(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "unknown";
  if (n >= 95) return "95-100";
  if (n >= 80) return "80-94";
  return "below-80";
}
