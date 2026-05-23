/**
 * Deterministic catalog readiness scoring for admin dashboards.
 */

import { auditVehicleCatalog } from "../intelligence/catalogAudit.js";
import { isPresent } from "../intelligence/governance.js";
import { auditVehicleMedia } from "../utils/mediaAudit.js";
import { isLegacyCatalogCdnUrl, isPlaceholderMediaUrl } from "../media/cloudinary.js";
import { resolveFamilySlugFromCar } from "../media/familyMediaManifest.js";

export const CATALOG_HEALTH_STATUS = Object.freeze({
  READY: "READY",
  PARTIAL: "PARTIAL",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

const STATUS_ORDER = {
  [CATALOG_HEALTH_STATUS.NEEDS_REVIEW]: 0,
  [CATALOG_HEALTH_STATUS.PARTIAL]: 1,
  [CATALOG_HEALTH_STATUS.READY]: 2,
};

/**
 * @param {object} car
 * @param {object} [audit] — from auditVehicleCatalog
 */
export function scoreCatalogHealth(car = {}, audit = null) {
  const report = audit || auditVehicleCatalog(car);
  const specs = car?.specifications || {};
  const meta = car?.catalogMeta || {};

  const missing = [];
  if (!isPresent(specs.range ?? car?.range)) missing.push("range");
  if (!isPresent(specs.batteryPack ?? car?.battery)) missing.push("battery");
  if (!isPresent(specs.chargingTime ?? specs.dcCharging)) {
    const intelCharging = car?.evIntelligence?.charging?.hasData;
    if (!intelCharging) missing.push("charging");
  }
  const price = Number(car?.startingPrice ?? car?.price);
  if (!Number.isFinite(price) || price <= 0) missing.push("price");

  const lowConfidence =
    meta.confidence === "low" ||
    meta.confidence === "legacy" ||
    report.issues?.some((i) => i.code === "weak_confidence");

  const compareBlocked = report.issues?.some(
    (i) => i.code === "compare_incompatibility_risk"
  );
  const stale = report.freshness?.isStale || report.freshness?.state === "needs_review";
  const unreviewed = !report.reviewed;

  let status = CATALOG_HEALTH_STATUS.READY;
  let reasons = [];

  if (compareBlocked || report.issueCount >= 4) {
    status = CATALOG_HEALTH_STATUS.NEEDS_REVIEW;
    reasons.push("Compare or intelligence blockers");
  } else if (
    missing.length >= 2 ||
    report.issueCount >= 2 ||
    stale ||
    (lowConfidence && unreviewed)
  ) {
    status = CATALOG_HEALTH_STATUS.NEEDS_REVIEW;
    if (missing.length >= 2) reasons.push("Multiple missing specs");
    if (stale) reasons.push("Stale trust metadata");
  } else if (
    missing.length > 0 ||
    report.issueCount > 0 ||
    !report.hasIntelligence ||
    lowConfidence
  ) {
    status = CATALOG_HEALTH_STATUS.PARTIAL;
    if (missing.length) reasons.push(`Missing: ${missing.join(", ")}`);
    if (!report.hasIntelligence) reasons.push("Partial intelligence bundle");
  }

  const seoReady = Boolean(
    car?.slug && (meta.seoReady !== false) && !compareBlocked
  );
  const compareReady =
    !compareBlocked &&
    report.hasIntelligence &&
    missing.length <= 1;

  const mediaAudit = auditVehicleMedia(car);
  const imageReady = ["hero", "listing", "compare"].every((role) => {
    const primary = mediaAudit.roles[role]?.primary;
    return (
      primary &&
      !mediaAudit.roles[role]?.usesLocalFallback &&
      !isPlaceholderMediaUrl(primary) &&
      !isLegacyCatalogCdnUrl(primary)
    );
  });

  if (!imageReady && status === CATALOG_HEALTH_STATUS.READY) {
    status = CATALOG_HEALTH_STATUS.PARTIAL;
    reasons.push("Image chain incomplete");
  }

  const severity =
    status === CATALOG_HEALTH_STATUS.NEEDS_REVIEW
      ? "high"
      : status === CATALOG_HEALTH_STATUS.PARTIAL
        ? "medium"
        : "low";

  return {
    status,
    severity,
    reasons,
    missingFields: missing,
    compareReady,
    seoReady,
    imageReady,
    lowConfidence,
    stale,
    unreviewed,
    issueCount: report.issueCount,
    audit: report,
    mediaAudit,
  };
}

/**
 * Flag likely duplicate catalog rows (same family + display name).
 * @param {object[]} cars
 */
export function detectDuplicateVariants(cars = []) {
  const byKey = new Map();
  const duplicates = new Set();

  for (const car of cars) {
    const slug = String(car?.slug || "").toLowerCase();
    if (!slug) continue;
    const family = resolveFamilySlugFromCar(car) || slug;
    const name = String(car?.name || car?.fullDisplayName || "")
      .trim()
      .toLowerCase();
    const key = `${family}::${name || slug}`;
    const list = byKey.get(key) || [];
    if (list.length > 0) {
      duplicates.add(slug);
      list.forEach((s) => duplicates.add(s));
    }
    list.push(slug);
    byKey.set(key, list);
  }

  return { duplicateSlugs: duplicates, count: duplicates.size };
}

export function buildCatalogHealthRows(cars = [], options = {}) {
  const { duplicateSlugs = new Set() } = options;
  const auditedAt = new Date().toISOString();

  return (cars || []).map((car) => {
    const health = scoreCatalogHealth(car);
    const slug = car?.slug || car?._id;
    const isDuplicate = duplicateSlugs.has(String(slug || "").toLowerCase());
    let status = health.status;
    const reasons = [...health.reasons];
    if (isDuplicate) {
      if (status === CATALOG_HEALTH_STATUS.READY) {
        status = CATALOG_HEALTH_STATUS.PARTIAL;
      }
      reasons.push("Possible duplicate variant slug");
    }

    return {
      slug,
      name: car?.name || car?.slug,
      brand: car?.brand || car?.catalogMeta?.brandSlug,
      ...health,
      status,
      reasons,
      isDuplicate,
      auditedAt,
    };
  });
}

export function summarizeCatalogHealth(rows = []) {
  const counts = {
    [CATALOG_HEALTH_STATUS.READY]: 0,
    [CATALOG_HEALTH_STATUS.PARTIAL]: 0,
    [CATALOG_HEALTH_STATUS.NEEDS_REVIEW]: 0,
  };
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  const compareReadyCount = rows.filter((r) => r.compareReady).length;
  const seoReadyCount = rows.filter((r) => r.seoReady).length;
  const imageReadyCount = rows.filter((r) => r.imageReady).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  return {
    total: rows.length,
    counts,
    compareReadyCount,
    seoReadyCount,
    imageReadyCount,
    duplicateCount,
    compareReadyPercent:
      rows.length > 0
        ? Math.round((compareReadyCount / rows.length) * 100)
        : 0,
    readyPercent:
      rows.length > 0
        ? Math.round(
            (counts[CATALOG_HEALTH_STATUS.READY] / rows.length) * 100
          )
        : 0,
    auditedAt: rows[0]?.auditedAt || new Date().toISOString(),
  };
}

export function sortByHealthPriority(a, b) {
  const diff =
    (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  if (diff !== 0) return diff;
  return (b.issueCount || 0) - (a.issueCount || 0);
}
