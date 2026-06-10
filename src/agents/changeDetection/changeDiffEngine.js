/**
 * Change Detection Agent v1 — field-level snapshot comparison.
 */

import {
  ALL_SCALAR_FIELD_KEYS,
  FIELD_LABELS,
  flattenExtractionDraft,
} from "../../catalogAcquisition/extractionSchema.js";
import {
  extractFieldValue,
  variantNameSimilarity,
} from "../../catalogAcquisition/benchmark/compareUtils.js";
import { classifyChangeSeverity } from "./changeClassification.js";
import { classifyChangePriority } from "./changePriority.js";

export const CHANGE_TYPE = Object.freeze({
  ADDED: "added",
  REMOVED: "removed",
  MODIFIED: "modified",
  UNCHANGED: "unchanged",
  VARIANT_ADDED: "variant_added",
  VARIANT_REMOVED: "variant_removed",
  VARIANT_MODIFIED: "variant_modified",
  SOURCE_CHANGED: "source_changed",
});

function isGoldenStyleSnapshot(snapshot = {}) {
  return Boolean(
    (snapshot.fields || snapshot.features) &&
      !snapshot.extractedVehicle &&
      !snapshot.vehicle?.brand?.value
  );
}

function flattenSnapshot(snapshot = {}, opts = {}) {
  if (opts.flat) return opts.flat;
  if (snapshot._flat) return snapshot._flat;
  if (isGoldenStyleSnapshot(snapshot)) return flattenPublishedSnapshot(snapshot);
  if (snapshot.extractedVehicle) return flattenExtractionDraft(snapshot.extractedVehicle);
  return flattenPublishedSnapshot(snapshot);
}

/**
 * Convert golden dossier to flat field map compatible with extraction drafts.
 */
export function flattenPublishedSnapshot(snapshot = {}) {
  if (snapshot._flat) return snapshot._flat;

  const flat = {};
  const fields = snapshot.fields || snapshot;
  const features = snapshot.features || {};

  for (const key of ALL_SCALAR_FIELD_KEYS) {
    const val = fields[key] ?? features[key];
    if (val !== null && val !== undefined && val !== "") {
      flat[key] = { value: val, confidence: 100 };
    }
  }

  if (snapshot.vehicle) {
    for (const [k, v] of Object.entries(snapshot.vehicle)) {
      if (v != null && v !== "") flat[k] = { value: v, confidence: 100 };
    }
  }

  return flat;
}

export function publishedSnapshotFromGolden(golden = {}) {
  return {
    id: golden.id,
    familySlug: golden.familySlug,
    displayName: golden.displayName,
    fields: golden.fields || {},
    features: golden.features || {},
    vehicle: golden.vehicle || {},
    variants: golden.variants || [],
    sources: golden.sources || [],
    oemUrl: golden.oemUrl || null,
    brochureUrl: golden.brochureUrl || null,
    capturedAt: golden.verifiedAt || null,
  };
}

export function publishedSnapshotFromExtraction(extractedVehicle = {}, meta = {}) {
  const flat = flattenExtractionDraft(extractedVehicle);
  const fields = {};
  const features = {};
  for (const [key, entry] of Object.entries(flat)) {
    const val = extractFieldValue(entry);
    if (val === null || val === undefined || val === "") continue;
    if (["sunroof", "ventilatedSeats", "camera360", "connectedCar", "v2l", "v2v", "adas"].includes(key)) {
      features[key] = val;
    } else {
      fields[key] = val;
    }
  }
  return {
    familySlug: extractFieldValue(flat.familySlug) || meta.familySlug,
    displayName: meta.displayName || `${fields.brand || ""} ${fields.model || ""}`.trim(),
    fields,
    features,
    vehicle: {
      brand: fields.brand,
      model: fields.model,
      bodyType: fields.bodyType,
      familySlug: fields.familySlug,
    },
    variants: extractedVehicle.variants || [],
    oemUrl: meta.oemUrl || null,
    brochureUrl: meta.brochureUrl || null,
    capturedAt: meta.capturedAt || new Date().toISOString(),
  };
}

function isSameValue(beforeVal, afterVal) {
  if (beforeVal == null && afterVal == null) return true;
  if (beforeVal === undefined && afterVal === undefined) return true;
  if (beforeVal == null || afterVal == null) return false;
  if (typeof beforeVal === "boolean" || typeof afterVal === "boolean") {
    return Boolean(beforeVal) === Boolean(afterVal);
  }
  if (Number.isFinite(Number(beforeVal)) && Number.isFinite(Number(afterVal))) {
    return Number(beforeVal) === Number(afterVal);
  }
  return String(beforeVal).trim() === String(afterVal).trim();
}

function compareScalarFields(publishedFlat, latestFlat) {
  const keys = new Set([...Object.keys(publishedFlat), ...Object.keys(latestFlat)]);
  const rows = [];

  for (const fieldKey of keys) {
    const beforeVal = extractFieldValue(publishedFlat[fieldKey]);
    const afterVal = extractFieldValue(latestFlat[fieldKey]);

    if (isSameValue(beforeVal, afterVal)) continue;

    let changeType = CHANGE_TYPE.MODIFIED;
    if (beforeVal == null && afterVal != null) changeType = CHANGE_TYPE.ADDED;
    else if (beforeVal != null && afterVal == null) changeType = CHANGE_TYPE.REMOVED;

    const row = {
      fieldKey,
      label: FIELD_LABELS[fieldKey] || fieldKey,
      changeType,
      before: beforeVal,
      after: afterVal,
      category: categorizeField(fieldKey),
    };
    row.severity = classifyChangeSeverity(row);
    row.priority = classifyChangePriority(row, row.severity);
    rows.push(row);
  }

  return rows;
}

function categorizeField(fieldKey) {
  if (["startingPrice", "topVariantPrice", "exShowroomPrice"].includes(fieldKey)) return "pricing";
  if (["batteryCapacityKwh", "batteryChemistry"].includes(fieldKey)) return "battery";
  if (["claimedRangeKm", "rangeTestStandard"].includes(fieldKey)) return "range";
  if (["acChargingKw", "dcChargingKw", "acChargingTimeHours", "dcChargingTimeMinutes"].includes(fieldKey)) {
    return "charging";
  }
  if (["sunroof", "ventilatedSeats", "camera360", "connectedCar", "v2l", "v2v", "adas", "adasLevel"].includes(fieldKey)) {
    return "feature";
  }
  if (["brand", "model", "bodyType", "familySlug"].includes(fieldKey)) return "vehicle";
  if (["colorOptions", "heroImageCandidates"].includes(fieldKey)) return "media";
  return "spec";
}

function normalizeVariant(v = {}) {
  return {
    name: extractFieldValue(v.variantName) || v.variantName || v.name,
    price: extractFieldValue(v.price) ?? v.priceInr ?? v.price,
    battery: extractFieldValue(v.battery) ?? v.batteryKwh,
    range: extractFieldValue(v.range) ?? v.rangeKm,
  };
}

function compareVariants(publishedVariants = [], latestVariants = []) {
  const changes = [];
  const pub = publishedVariants.map(normalizeVariant).filter((v) => v.name);
  const lat = latestVariants.map(normalizeVariant).filter((v) => v.name);

  const matchedLatest = new Set();

  for (const pv of pub) {
    let best = null;
    let bestScore = 0;
    for (let i = 0; i < lat.length; i++) {
      if (matchedLatest.has(i)) continue;
      const score = variantNameSimilarity(pv.name, lat[i].name);
      if (score > bestScore) {
        bestScore = score;
        best = { idx: i, variant: lat[i] };
      }
    }

    if (!best || bestScore < 0.55) {
      const row = {
        fieldKey: `variant:${pv.name}`,
        label: pv.name,
        changeType: CHANGE_TYPE.VARIANT_REMOVED,
        before: pv,
        after: null,
        category: "variant",
      };
      row.severity = classifyChangeSeverity(row);
      row.priority = classifyChangePriority(row, row.severity);
      changes.push(row);
      continue;
    }

    matchedLatest.add(best.idx);
    const lv = best.variant;
    if (String(pv.price) !== String(lv.price) || String(pv.battery) !== String(lv.battery) || String(pv.range) !== String(lv.range)) {
      const row = {
        fieldKey: `variant:${pv.name}`,
        label: pv.name,
        changeType: CHANGE_TYPE.VARIANT_MODIFIED,
        before: pv,
        after: lv,
        category: "variant",
      };
      row.severity = classifyChangeSeverity(row);
      row.priority = classifyChangePriority(row, row.severity);
      changes.push(row);
    }
  }

  for (let i = 0; i < lat.length; i++) {
    if (matchedLatest.has(i)) continue;
    const lv = lat[i];
    const row = {
      fieldKey: `variant:${lv.name}`,
      label: lv.name,
      changeType: CHANGE_TYPE.VARIANT_ADDED,
      before: null,
      after: lv,
      category: "variant",
    };
    row.severity = classifyChangeSeverity(row);
    row.priority = classifyChangePriority(row, row.severity);
    changes.push(row);
  }

  return changes;
}

function compareSourceMeta(published = {}, latest = {}) {
  const changes = [];
  const pairs = [
    ["oemUrl", "OEM URL"],
    ["brochureUrl", "Brochure URL"],
  ];

  for (const [key, label] of pairs) {
    const before = published[key] || null;
    const after = latest[key] || null;
    if (before === after) continue;
    if (!before && !after) continue;
    const row = {
      fieldKey: key,
      label,
      changeType: CHANGE_TYPE.SOURCE_CHANGED,
      before,
      after,
      category: "source",
    };
    row.severity = classifyChangeSeverity(row);
    row.priority = classifyChangePriority(row, row.severity);
    changes.push(row);
  }

  return changes;
}

/**
 * Compare published snapshot vs latest acquisition snapshot.
 */
export function compareSnapshots(publishedSnapshot = {}, latestSnapshot = {}, opts = {}) {
  const publishedFlat = flattenSnapshot(publishedSnapshot);
  const latestFlat = flattenSnapshot(latestSnapshot, opts);

  const fieldChanges = compareScalarFields(publishedFlat, latestFlat);
  const variantChanges = compareVariants(
    publishedSnapshot.variants || [],
    latestSnapshot.variants || latestSnapshot.extractedVehicle?.variants || []
  );
  const sourceChanges = compareSourceMeta(publishedSnapshot, latestSnapshot);

  const changes = [...fieldChanges, ...variantChanges, ...sourceChanges];

  const summary = {
    added: changes.filter((c) => c.changeType === CHANGE_TYPE.ADDED || c.changeType === CHANGE_TYPE.VARIANT_ADDED).length,
    removed: changes.filter((c) => c.changeType === CHANGE_TYPE.REMOVED || c.changeType === CHANGE_TYPE.VARIANT_REMOVED).length,
    modified: changes.filter((c) =>
      [CHANGE_TYPE.MODIFIED, CHANGE_TYPE.VARIANT_MODIFIED, CHANGE_TYPE.SOURCE_CHANGED].includes(c.changeType)
    ).length,
    unchanged: ALL_SCALAR_FIELD_KEYS.length - fieldChanges.length,
    total: changes.length,
  };

  return {
    changes,
    summary,
    hasChanges: changes.length > 0,
    publishedSnapshot,
    latestSnapshot,
  };
}

export function simulateSnapshotMutation(snapshot = {}, mutations = {}) {
  const next = structuredClone(snapshot);
  if (mutations.fields) Object.assign(next.fields, mutations.fields);
  if (mutations.features) Object.assign(next.features, mutations.features);
  if (mutations.variants) next.variants = mutations.variants;
  if (mutations.oemUrl !== undefined) next.oemUrl = mutations.oemUrl;
  if (mutations.brochureUrl !== undefined) next.brochureUrl = mutations.brochureUrl;
  return next;
}
