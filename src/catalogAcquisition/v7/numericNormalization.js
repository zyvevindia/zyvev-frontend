/**
 * v7 — normalize prices, ranges, battery, charging times before evidence merge.
 */

const LAKH_MULTIPLIER = 100_000;

export function parsePriceInr(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);

  const s = String(raw).trim().replace(/,/g, "");
  const lakhMatch = s.match(/₹?\s*([\d.]+)\s*(?:lakh|lac)\b/i);
  if (lakhMatch) {
    const n = Number(lakhMatch[1]);
    return Number.isFinite(n) ? Math.round(n * LAKH_MULTIPLIER) : null;
  }

  const croreMatch = s.match(/₹?\s*([\d.]+)\s*crore\b/i);
  if (croreMatch) {
    const n = Number(croreMatch[1]);
    return Number.isFinite(n) ? Math.round(n * 10_000_000) : null;
  }

  const digits = s.replace(/[^\d.]/g, "");
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  if (n >= 100_000) return Math.round(n);
  // Implicit lakh only for typical Indian EV ex-showroom band (₹5L–₹60L), not bare range/charging numbers.
  if (n >= 5 && n <= 60 && !/\bkm\b|\bkwh\b|\bkw\b|\bmin/i.test(s)) {
    return Math.round(n * LAKH_MULTIPLIER);
  }
  return Math.round(n);
}

export function parseRangeKm(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);

  const s = String(raw).toLowerCase();
  const rangeSpan = s.match(/(\d{2,4})\s*(?:–|-|to)\s*(\d{2,4})\s*km/);
  if (rangeSpan) {
    return Math.max(Number(rangeSpan[1]), Number(rangeSpan[2]));
  }

  const nums = [...s.matchAll(/(\d{2,4})\s*km/g)].map((m) => Number(m[1])).filter(Number.isFinite);
  if (nums.length) return Math.max(...nums);

  const bare = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(bare) && bare >= 50 && bare <= 900 ? Math.round(bare) : null;
}

export function parseBatteryKwh(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw * 10) / 10;

  const m = String(raw).match(/(\d{1,3}(?:\.\d+)?)\s*kwh/i);
  if (m) return Math.round(Number(m[1]) * 10) / 10;

  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 10 && n <= 120 ? Math.round(n * 10) / 10 : null;
}

export function parseChargingKw(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const m = String(raw).match(/(\d{1,3}(?:\.\d+)?)\s*kw/i);
  if (m) return Math.round(Number(m[1]) * 10) / 10;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 2 && n <= 350 ? Math.round(n * 10) / 10 : null;
}

export function parseChargingHours(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const m = String(raw).match(/(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (m) return Math.round(Number(m[1]) * 10) / 10;
  return null;
}

export function parseChargingMinutes(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const m = String(raw).match(/(\d{1,3})\s*(?:minutes?|mins?)\b/i);
  if (m) return Math.round(Number(m[1]));
  const bare = Number(String(raw).replace(/[^\d.]/g, ""));
  if (Number.isFinite(bare) && bare >= 5 && bare <= 180) return Math.round(bare);
  return null;
}

export function parseRangeTestStandard(raw) {
  if (!raw) return null;
  const s = String(raw).toUpperCase();
  if (/\bMIDC\b/.test(s)) return "MIDC";
  if (/\bARAI\b/.test(s)) return "ARAI";
  if (/\bWLTP\b/.test(s)) return "WLTP";
  if (/\bEPA\b/.test(s)) return "EPA";
  return null;
}

const FIELD_NORMALIZERS = Object.freeze({
  startingPrice: parsePriceInr,
  topVariantPrice: parsePriceInr,
  exShowroomPrice: parsePriceInr,
  claimedRangeKm: parseRangeKm,
  batteryCapacityKwh: parseBatteryKwh,
  acChargingKw: parseChargingKw,
  dcChargingKw: parseChargingKw,
  acChargingTimeHours: parseChargingHours,
  dcChargingTimeMinutes: parseChargingMinutes,
  rangeTestStandard: parseRangeTestStandard,
  airbags: (raw) => {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return Number.isFinite(n) && n >= 1 && n <= 12 ? Math.round(n) : null;
  },
});

export function normalizeFieldValue(fieldName, rawValue) {
  const fn = FIELD_NORMALIZERS[fieldName];
  if (!fn) return rawValue;
  const normalized = fn(rawValue);
  return normalized ?? rawValue;
}

/**
 * Normalize evidence record values before merge.
 */
export function normalizeEvidenceRecords(records = []) {
  return records.map((rec) => {
    if (!rec?.fieldName) return rec;
    const normalized = normalizeFieldValue(rec.fieldName, rec.fieldValue);
    if (normalized === rec.fieldValue) return rec;
    return { ...rec, fieldValue: normalized, extractionMethod: `${rec.extractionMethod || "merge"}-v7-norm` };
  });
}

/**
 * Normalize merged field values in-place copy.
 */
export function normalizeMergedFields(mergedFields = {}) {
  const out = { ...mergedFields };
  for (const [key, entry] of Object.entries(out)) {
    if (!entry || entry.value === null || entry.value === undefined || entry.value === "") continue;
    const normalized = normalizeFieldValue(key, entry.value);
    if (normalized !== entry.value) {
      out[key] = { ...entry, value: normalized };
    }
  }
  return out;
}

/**
 * Derive pricing fields from variant rows when missing.
 */
const REASONABLE_EV_PRICE_MIN = 600_000;
const REASONABLE_EV_PRICE_MAX = 6_000_000;

export function derivePricingFromVariants(mergedFields, variants = []) {
  const prices = variants
    .map((v) => parsePriceInr(v.price?.value ?? v.price))
    .filter((p) => Number.isFinite(p) && p >= REASONABLE_EV_PRICE_MIN && p <= REASONABLE_EV_PRICE_MAX);
  if (!prices.length) return mergedFields;

  const out = { ...mergedFields };
  const apply = (key, value) => {
    const cur = out[key];
    if (cur?.value != null && cur.value !== "") return;
    out[key] = {
      fieldName: key,
      value,
      confidence: 88,
      status: "agreement",
      manualReview: false,
      sources: [{ extractionMethod: "v7-variant-pricing" }],
      sourceValues: [{ value }],
    };
  };

  apply("startingPrice", Math.min(...prices));
  apply("topVariantPrice", Math.max(...prices));
  apply("exShowroomPrice", Math.min(...prices));
  return out;
}
