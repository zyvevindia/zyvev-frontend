import { CHANGE_SEVERITY } from "./constants.js";
import normalizeCar from "../../utils/normalizeCar.js";
import { buildCatalogOpsSummary } from "../catalogAudit.js";
import { provenanceCatalogMetaPatch } from "./sourceAttribution.js";

/**
 * Apply normalized fields onto a catalog car clone (deterministic, shallow specs merge).
 * @param {object} car
 * @param {object} fields
 */
export function applyNormalizedFieldsToCar(car, fields) {
  const next = JSON.parse(JSON.stringify(car));
  if (fields.startingPrice != null) {
    next.startingPrice = fields.startingPrice;
    next.price = fields.startingPrice;
  }
  next.specifications = { ...(next.specifications || {}) };
  if (fields.rangeKm != null) next.specifications.range = fields.rangeKm;
  if (fields.batteryKwh != null) {
    next.specifications.batteryPack = `${fields.batteryKwh} kWh`;
  }
  if (fields.batteryLabel) next.specifications.batteryPack = fields.batteryLabel;
  if (fields.chargingTime != null) next.specifications.chargingTime = fields.chargingTime;
  if (fields.dcFastKw != null) next.specifications.dcFastChargingKw = fields.dcFastKw;
  if (fields.acKw != null) next.specifications.acChargingKw = fields.acKw;
  if (fields.connector != null) next.specifications.connectorType = fields.connector;
  if (fields.dcChargeMinutes != null) {
    next.specifications.dc10to80Minutes = fields.dcChargeMinutes;
  }
  if (fields.warranty != null) next.specifications.warranty = fields.warranty;
  return next;
}

/**
 * Build rollback snapshots (minimal fields) for each affected slug.
 */
export function buildRollbackSnapshots(carsBySlug, patches) {
  const snaps = [];
  for (const p of patches) {
    const car = carsBySlug.get(p.slug);
    if (!car) continue;
    snaps.push({
      slug: p.slug,
      snapshot: {
        startingPrice: car.startingPrice,
        price: car.price,
        specifications: JSON.parse(JSON.stringify(car.specifications || {})),
      },
    });
  }
  return snaps;
}

/**
 * @param {object} session ingestion session with normalizedItems + diffReports
 * @param {Map<string, object>} carsBySlug normalized cars
 * @param {object} attribution
 */
export function buildPublishBundle(session, carsBySlug, attribution) {
  const bundleId = `bundle_${Date.now()}`;
  const generatedAt = new Date().toISOString();
  const patches = [];
  const auditLines = [];

  for (const row of session.normalizedItems || []) {
    const slug = row.slug;
    const car = carsBySlug.get(slug);
    if (!car) {
      auditLines.push({ level: "error", msg: `skip_publish_missing_catalog:${slug}` });
      continue;
    }
    const after = applyNormalizedFieldsToCar(car, row.fields);
    patches.push({
      slug,
      fields: row.fields,
      provenance: provenanceCatalogMetaPatch({
        ...attribution,
        reviewedAt: attribution.reviewedAt || generatedAt,
      }),
    });
    auditLines.push({
      level: "info",
      msg: `patch_prepared:${slug}`,
      fields: Object.keys(row.fields || {}),
    });
  }

  const rollbackSnapshots = buildRollbackSnapshots(carsBySlug, patches);

  return {
    bundleId,
    format: "evsavari-catalog-publish-bundle/1",
    generatedAt,
    source: attribution,
    patches,
    rollbackSnapshots,
    auditLines,
    humanNote:
      "This bundle is not auto-applied. Apply via backend admin or DB migration after human sign-off.",
  };
}

/**
 * Simulate post-publish catalog ops impact (issue counts before vs after merge).
 * @param {object[]} cars normalized list
 * @param {object[]} normalizedRows rows to merge (same slugs)
 */
export function simulateIntelligenceImpact(cars, normalizedRows) {
  const merged = cars.map((c) => {
    const slug = String(c.slug).toLowerCase();
    const row = normalizedRows.find((r) => r.slug === slug);
    if (!row) return c;
    return normalizeCar(applyNormalizedFieldsToCar(c, row.fields));
  });
  const before = buildCatalogOpsSummary(cars);
  const after = buildCatalogOpsSummary(merged);
  return {
    totalIssuesBefore: before.vehicles.reduce((a, v) => a + (v.issueCount || 0), 0),
    totalIssuesAfter: after.vehicles.reduce((a, v) => a + (v.issueCount || 0), 0),
    perSlug: (normalizedRows || []).map((r) => {
      const b = before.vehicles.find((v) => v.slug === r.slug);
      const a = after.vehicles.find((v) => v.slug === r.slug);
      return {
        slug: r.slug,
        issuesBefore: b?.issueCount ?? null,
        issuesAfter: a?.issueCount ?? null,
      };
    }),
  };
}

export function severityRank(s) {
  if (s === CHANGE_SEVERITY.INTELLIGENCE) return 3;
  if (s === CHANGE_SEVERITY.PRICING) return 2;
  return 1;
}
