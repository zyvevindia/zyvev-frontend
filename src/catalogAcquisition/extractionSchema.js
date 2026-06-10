/**
 * EVSavari extraction schema v2 — expanded field coverage for catalog acquisition v3.
 * Backward compatible with v1 groups; adds features, warranty, media metadata, charging times.
 */

export const EXTRACTION_SCHEMA_VERSION = "evsavari-extraction/2";

/** All scalar evidence field keys (single source of truth for merger + AI). */
export const ALL_SCALAR_FIELD_KEYS = Object.freeze([
  "brand",
  "model",
  "bodyType",
  "familySlug",
  "startingPrice",
  "topVariantPrice",
  "exShowroomPrice",
  "batteryCapacityKwh",
  "batteryChemistry",
  "claimedRangeKm",
  "rangeTestStandard",
  "acChargingKw",
  "dcChargingKw",
  "acChargingTimeHours",
  "dcChargingTimeMinutes",
  "powerPs",
  "powerKw",
  "torqueNm",
  "airbags",
  "adas",
  "adasLevel",
  "ncapRating",
  "sunroof",
  "ventilatedSeats",
  "camera360",
  "connectedCar",
  "v2l",
  "v2v",
  "vehicleWarrantyYears",
  "batteryWarrantyYears",
  "colorOptions",
  "heroImageCandidates",
  "lengthMm",
  "widthMm",
  "heightMm",
  "wheelbaseMm",
]);

/** Top-level field groups for review UI sections. */
export const EXTRACTION_FIELD_GROUPS = Object.freeze([
  {
    id: "vehicle",
    label: "Vehicle",
    fields: ["brand", "model", "bodyType", "familySlug"],
  },
  {
    id: "pricing",
    label: "Pricing",
    fields: ["startingPrice", "topVariantPrice", "exShowroomPrice"],
  },
  {
    id: "battery",
    label: "Battery",
    fields: ["batteryCapacityKwh", "batteryChemistry"],
  },
  {
    id: "range",
    label: "Range",
    fields: ["claimedRangeKm", "rangeTestStandard"],
  },
  {
    id: "charging",
    label: "Charging",
    fields: [
      "acChargingKw",
      "dcChargingKw",
      "acChargingTimeHours",
      "dcChargingTimeMinutes",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    fields: ["powerPs", "powerKw", "torqueNm"],
  },
  {
    id: "dimensions",
    label: "Dimensions",
    fields: ["lengthMm", "widthMm", "heightMm", "wheelbaseMm"],
  },
  {
    id: "safety",
    label: "Safety",
    fields: ["airbags", "adas", "adasLevel", "ncapRating"],
  },
  {
    id: "features",
    label: "Features",
    fields: ["sunroof", "ventilatedSeats", "camera360", "connectedCar", "v2l", "v2v"],
  },
  {
    id: "warranty",
    label: "Warranty",
    fields: ["vehicleWarrantyYears", "batteryWarrantyYears"],
  },
  {
    id: "mediaMeta",
    label: "Media metadata",
    fields: ["colorOptions", "heroImageCandidates"],
  },
]);

export const FIELD_LABELS = Object.freeze({
  brand: "Brand",
  model: "Model",
  bodyType: "Body type",
  familySlug: "Family slug",
  startingPrice: "Starting price (INR)",
  topVariantPrice: "Top variant price (INR)",
  exShowroomPrice: "Ex-showroom price (INR)",
  batteryCapacityKwh: "Battery capacity (kWh)",
  batteryChemistry: "Battery chemistry",
  claimedRangeKm: "Claimed range (km)",
  rangeTestStandard: "Range test standard",
  acChargingKw: "AC charging (kW)",
  dcChargingKw: "DC charging (kW)",
  acChargingTimeHours: "AC charge time (0–100%, hrs)",
  dcChargingTimeMinutes: "DC charge time (10–80%, min)",
  powerPs: "Power (PS)",
  powerKw: "Power (kW)",
  torqueNm: "Torque (Nm)",
  lengthMm: "Length (mm)",
  widthMm: "Width (mm)",
  heightMm: "Height (mm)",
  wheelbaseMm: "Wheelbase (mm)",
  airbags: "Airbags",
  adas: "ADAS",
  adasLevel: "ADAS level",
  ncapRating: "NCAP rating",
  sunroof: "Sunroof",
  ventilatedSeats: "Ventilated seats",
  camera360: "360° camera",
  connectedCar: "Connected car",
  v2l: "V2L",
  v2v: "V2V",
  vehicleWarrantyYears: "Vehicle warranty (years)",
  batteryWarrantyYears: "Battery warranty (years)",
  colorOptions: "Color options",
  heroImageCandidates: "Hero image URLs",
});

/** JSON schema description for LLM prompts. */
export const AI_EXTRACTION_JSON_SCHEMA = Object.freeze({
  fields: Object.fromEntries(
    ALL_SCALAR_FIELD_KEYS.map((k) => [k, { value: "string|number|boolean|null", confidence: "0-100" }])
  ),
  variants: [
    {
      variantName: "string",
      price: { value: "number|null", confidence: "0-100" },
      battery: { value: "number|null", confidence: "0-100" },
      range: { value: "number|null", confidence: "0-100" },
      acChargingKw: { value: "number|null", confidence: "0-100" },
      dcChargingKw: { value: "number|null", confidence: "0-100" },
      featureHighlights: { value: "string|null", confidence: "0-100" },
    },
  ],
});

export function createEmptyExtractionDraft() {
  const draft = {
    format: EXTRACTION_SCHEMA_VERSION,
    vehicle: {},
    pricing: {},
    battery: {},
    range: {},
    charging: {},
    performance: {},
    dimensions: {},
    safety: {},
    features: {},
    warranty: {},
    mediaMeta: {},
    variants: [],
    meta: {
      extractor: "heuristic-v1",
      extractedAt: null,
      sourceType: null,
    },
  };
  return draft;
}

const FLAT_GROUP_IDS = [
  "vehicle",
  "pricing",
  "battery",
  "range",
  "charging",
  "performance",
  "dimensions",
  "safety",
  "features",
  "warranty",
  "mediaMeta",
];

export function flattenExtractionDraft(draft = {}) {
  const flat = {};
  for (const g of FLAT_GROUP_IDS) {
    const section = draft[g] || {};
    for (const [k, v] of Object.entries(section)) {
      flat[k] = v;
    }
  }
  return flat;
}

export function applyFlatFieldsToDraft(draft, flat = {}) {
  const next = structuredClone(draft);
  for (const group of EXTRACTION_FIELD_GROUPS) {
    for (const key of group.fields) {
      if (flat[key]) {
        next[group.id] = next[group.id] || {};
        next[group.id][key] = flat[key];
      }
    }
  }
  return next;
}

export function formatFieldDisplay(entry) {
  if (!entry || entry.value === null || entry.value === undefined || entry.value === "") {
    return "—";
  }
  if (typeof entry.value === "boolean") return entry.value ? "Yes" : "No";
  return String(entry.value);
}

/** Fields that need human attention when missing (required for minimal publish). */
export const REQUIRED_PUBLISH_FIELDS = Object.freeze([
  "brand",
  "model",
  "familySlug",
]);

export const LOW_CONFIDENCE_THRESHOLD = 80;

export function fieldNeedsAttention(fieldKey, mergedField, flatEntry) {
  const confidence = mergedField?.confidence ?? flatEntry?.confidence ?? 0;
  const status = mergedField?.status;
  const value = mergedField?.value ?? flatEntry?.value;
  const isMissing =
    value === null || value === undefined || value === "" || confidence === 0;
  if (REQUIRED_PUBLISH_FIELDS.includes(fieldKey) && isMissing) return true;
  if (status === "conflict") return true;
  if (isMissing && ALL_SCALAR_FIELD_KEYS.includes(fieldKey)) {
    return false;
  }
  if (!isMissing && confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD) return true;
  if (mergedField?.status === "missing" && REQUIRED_PUBLISH_FIELDS.includes(fieldKey)) {
    return true;
  }
  return false;
}

export function listAttentionFieldKeys(mergedEvidence = {}, flat = {}) {
  const keys = new Set([...ALL_SCALAR_FIELD_KEYS]);
  const out = [];
  for (const key of keys) {
    if (fieldNeedsAttention(key, mergedEvidence[key], flat[key])) {
      out.push(key);
    }
  }
  return out;
}
