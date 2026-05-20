import { isPresent } from "./governance.js";

/**
 * Deterministic catalog change detection — architecture for human-review workflows.
 * No scraping; compares normalized snapshots (before/after from API or stored versions).
 */

export const CHANGE_FIELD = Object.freeze({
  PRICE: "price",
  CLAIMED_RANGE: "claimed_range",
  CHARGING: "charging",
  BATTERY: "battery",
  FEATURES: "features",
  VARIANTS: "variants",
  WARRANTY: "warranty",
  AVAILABILITY: "availability",
});

export const CHANGE_SEVERITY = Object.freeze({
  MINOR: "minor",
  MAJOR_SPEC: "major_spec",
  PRICING_UPDATE: "pricing_update",
  FEATURE_UPDATE: "feature_update",
});

const FIELD_LABELS = {
  [CHANGE_FIELD.PRICE]: "Price",
  [CHANGE_FIELD.CLAIMED_RANGE]: "Claimed range",
  [CHANGE_FIELD.CHARGING]: "Charging specs",
  [CHANGE_FIELD.BATTERY]: "Battery specs",
  [CHANGE_FIELD.FEATURES]: "Features",
  [CHANGE_FIELD.VARIANTS]: "Variants",
  [CHANGE_FIELD.WARRANTY]: "Warranty",
  [CHANGE_FIELD.AVAILABILITY]: "Availability",
};

function normalizeFeatureList(car) {
  const meta = car?.catalogMeta || {};
  const pros = Array.isArray(meta.pros) ? meta.pros : [];
  const highlights = Array.isArray(meta.featureHighlights)
    ? meta.featureHighlights
    : [];
  const specFeatures = car?.specifications?.features;
  const fromSpecs = Array.isArray(specFeatures)
    ? specFeatures
    : typeof specFeatures === "string"
      ? specFeatures.split(/[,;]/).map((s) => s.trim())
      : [];
  return [...new Set([...pros, ...highlights, ...fromSpecs])]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .sort();
}

/**
 * Normalized catalog snapshot for diffing.
 * @param {object} car
 */
export function buildCatalogSnapshot(car) {
  if (!car || typeof car !== "object") return null;

  const specs = car.specifications || {};
  const meta = car.catalogMeta || {};
  const variants =
    car.variants || meta.variants || meta.variantList || [];

  const variantSlugs = (Array.isArray(variants) ? variants : [])
    .map((v) => v?.slug || v?.variantSlug || v?.name)
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .sort();

  const price = Number(car.startingPrice ?? car.price) || null;

  return {
    price,
    claimedRange:
      meta.claimedRangeKm ??
      (isPresent(specs.range) ? Number(specs.range) : null) ??
      (isPresent(car.range) ? Number(car.range) : null),
    battery: specs.batteryPack || car.battery || null,
    chargingTime: specs.chargingTime || meta.chargingSummary || null,
    dcChargingKw: specs.dcChargingKw ?? meta.chargingIntelligence?.dcKw ?? null,
    acChargingKw: specs.acChargingKw ?? null,
    connectorType: specs.connectorType || meta.chargingIntelligence?.connector || null,
    features: normalizeFeatureList(car),
    variantSlugs,
    warranty: meta.ownershipWarranty || meta.warranty || null,
    availability: car.availability ?? meta.availability ?? meta.stockStatus ?? null,
  };
}

function classifyFieldChange(field, before, after) {
  if (field === CHANGE_FIELD.PRICE) {
    const b = Number(before);
    const a = Number(after);
    if (!b || !a || b === a) return null;
    const pct = Math.abs((a - b) / b) * 100;
    const severity =
      pct >= 5 || Math.abs(a - b) >= 50000
        ? CHANGE_SEVERITY.PRICING_UPDATE
        : CHANGE_SEVERITY.MINOR;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity,
      before: b,
      after: a,
      summary: `Price ${b < a ? "increased" : "decreased"} (${pct.toFixed(1)}%)`,
    };
  }

  if (field === CHANGE_FIELD.CLAIMED_RANGE) {
    const b = Number(before);
    const a = Number(after);
    if (!isPresent(b) || !isPresent(a) || b === a) return null;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity: CHANGE_SEVERITY.MAJOR_SPEC,
      before: b,
      after: a,
      summary: `Claimed range ${b} km → ${a} km`,
    };
  }

  if (field === CHANGE_FIELD.BATTERY || field === CHANGE_FIELD.CHARGING) {
    if (String(before || "") === String(after || "")) return null;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity: CHANGE_SEVERITY.MAJOR_SPEC,
      before,
      after,
      summary: `${FIELD_LABELS[field]} updated`,
    };
  }

  if (field === CHANGE_FIELD.FEATURES) {
    const bSet = new Set(before || []);
    const aSet = new Set(after || []);
    const added = [...aSet].filter((x) => !bSet.has(x));
    const removed = [...bSet].filter((x) => !aSet.has(x));
    if (!added.length && !removed.length) return null;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity: CHANGE_SEVERITY.FEATURE_UPDATE,
      before: (before || []).length,
      after: (after || []).length,
      summary: `Features: +${added.length} / −${removed.length}`,
      added,
      removed,
    };
  }

  if (field === CHANGE_FIELD.VARIANTS) {
    const b = before || [];
    const a = after || [];
    if (b.join("|") === a.join("|")) return null;
    const added = a.filter((x) => !b.includes(x));
    const removed = b.filter((x) => !a.includes(x));
    const severity =
      added.length + removed.length > 1
        ? CHANGE_SEVERITY.MAJOR_SPEC
        : CHANGE_SEVERITY.MINOR;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity,
      before: b.length,
      after: a.length,
      summary: `Variants: +${added.length} / −${removed.length}`,
      added,
      removed,
    };
  }

  if (field === CHANGE_FIELD.WARRANTY) {
    const bKey = JSON.stringify(before || {});
    const aKey = JSON.stringify(after || {});
    if (bKey === aKey) return null;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity: CHANGE_SEVERITY.MINOR,
      before,
      after,
      summary: "Warranty terms updated",
    };
  }

  if (field === CHANGE_FIELD.AVAILABILITY) {
    if (String(before || "") === String(after || "")) return null;
    return {
      field,
      fieldLabel: FIELD_LABELS[field],
      severity: CHANGE_SEVERITY.MINOR,
      before,
      after,
      summary: `Availability: ${before || "—"} → ${after || "—"}`,
    };
  }

  return null;
}

/**
 * Compare two normalized snapshots.
 * @param {object} beforeSnap
 * @param {object} afterSnap
 */
export function diffCatalogSnapshots(beforeSnap, afterSnap) {
  if (!beforeSnap || !afterSnap) {
    return { changes: [], hasChanges: false, summary: null };
  }

  const fields = Object.values(CHANGE_FIELD);
  const changes = [];

  for (const field of fields) {
    let key = field;
    if (field === CHANGE_FIELD.CLAIMED_RANGE) key = "claimedRange";
    if (field === CHANGE_FIELD.VARIANTS) key = "variantSlugs";
    if (field === CHANGE_FIELD.FEATURES) key = "features";
    if (field === CHANGE_FIELD.BATTERY) key = "battery";
    if (field === CHANGE_FIELD.PRICE) key = "price";
    if (field === CHANGE_FIELD.WARRANTY) key = "warranty";
    if (field === CHANGE_FIELD.AVAILABILITY) key = "availability";
    if (field === CHANGE_FIELD.CHARGING) {
      const chargingChanged =
        beforeSnap.chargingTime !== afterSnap.chargingTime ||
        beforeSnap.dcChargingKw !== afterSnap.dcChargingKw ||
        beforeSnap.acChargingKw !== afterSnap.acChargingKw ||
        beforeSnap.connectorType !== afterSnap.connectorType;
      if (chargingChanged) {
        changes.push(
          classifyFieldChange(CHANGE_FIELD.CHARGING, beforeSnap, afterSnap) || {
            field: CHANGE_FIELD.CHARGING,
            fieldLabel: FIELD_LABELS[CHANGE_FIELD.CHARGING],
            severity: CHANGE_SEVERITY.MAJOR_SPEC,
            summary: "Charging specifications changed",
          }
        );
      }
      continue;
    }

    const record = classifyFieldChange(field, beforeSnap[key], afterSnap[key]);
    if (record) changes.push(record);
  }

  const hasMajor = changes.some(
    (c) =>
      c.severity === CHANGE_SEVERITY.MAJOR_SPEC ||
      c.severity === CHANGE_SEVERITY.PRICING_UPDATE
  );

  return {
    changes,
    hasChanges: changes.length > 0,
    changeCount: changes.length,
    hasMajor,
    summary: hasMajor
      ? `${changes.length} change(s) including major spec updates`
      : changes.length
        ? `${changes.length} minor catalog update(s)`
        : null,
  };
}

/**
 * Detect changes between two vehicle records (before/after).
 */
export function detectCatalogChanges(beforeCar, afterCar) {
  const beforeSnap = buildCatalogSnapshot(beforeCar);
  const afterSnap = buildCatalogSnapshot(afterCar);
  const diff = diffCatalogSnapshots(beforeSnap, afterSnap);

  return {
    ...diff,
    beforeSnapshot: beforeSnap,
    afterSnapshot: afterSnap,
    vehicleSlug:
      afterCar?.slug || beforeCar?.slug || afterCar?._id || beforeCar?._id,
  };
}

/**
 * Read pre-computed change log from catalogMeta (backend-maintained).
 */
export function extractCatalogChangeLog(car) {
  const meta = car?.catalogMeta || {};
  const block =
    meta.catalogChangeLog ||
    meta.intelligenceGovernance?.changeLog ||
    {};

  const recent = Array.isArray(block.recentChanges)
    ? block.recentChanges
    : Array.isArray(block.changes)
      ? block.changes
      : [];

  return {
    lastDetectedAt: block.lastDetectedAt || block.updatedAt || null,
    recentChanges: recent.slice(0, 8),
    hasLog: recent.length > 0,
  };
}
