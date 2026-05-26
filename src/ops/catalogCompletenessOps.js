/**
 * Catalog completeness audit — operational tracking (no fabricated data).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { auditVehicleCatalog } from "../intelligence/catalogAudit.js";
import {
  buildSafetyCompletenessReport,
  normalizeSafetyMetadata,
  SAFETY_FIELD_STATUS,
} from "../intelligence/safetyMetadata.js";
import { resolveFamilySlugFromCar } from "../media/familyMediaManifest.js";
import { isPlaceholderMediaUrl } from "../media/cloudinary.js";
import {
  buildImageFallbackChain,
  resolveCatalogImageUrl,
  resolveRequestableGalleryImages,
} from "../utils/vehicleMedia.js";
import { auditVehicleMedia } from "../utils/mediaAudit.js";
import { LOCAL_FALLBACK_EV } from "../config/media.js";
import { isPresent, UNAVAILABLE } from "../intelligence/governance.js";
import {
  formatVerifiedAccelerationDisplay,
  parseVerifiedAcceleration,
} from "../utils/heroDetailMetrics.js";

export const COMPLETENESS_STATUS = Object.freeze({
  VERIFIED: "verified",
  PRESENT: "present",
  NOT_VERIFIED: "not_verified",
  MISSING: "missing",
  UNKNOWN: "unknown",
});

function statusForValue(value, { verified = false } = {}) {
  if (verified) return COMPLETENESS_STATUS.VERIFIED;
  if (value == null || value === "" || value === "—" || value === UNAVAILABLE) {
    return COMPLETENESS_STATUS.MISSING;
  }
  return COMPLETENESS_STATUS.NOT_VERIFIED;
}

function isLocalFallback(url = "") {
  return (
    !url ||
    url === LOCAL_FALLBACK_EV ||
    url.includes("fallback-ev") ||
    isPlaceholderMediaUrl(url)
  );
}

/**
 * @param {object} car
 */
export function auditVehicleCompleteness(car = {}) {
  const slug = car?.slug || car?.catalogMeta?.slug || "unknown";
  const familySlug = resolveFamilySlugFromCar(car);
  const mediaAudit = auditVehicleMedia(car);
  const intel = buildVehicleIntelligence(car);
  const catalogAudit = auditVehicleCatalog(car);
  const safety = normalizeSafetyMetadata(car?.catalogMeta?.safety);

  const heroUrl =
    resolveCatalogImageUrl(car, "hero") ||
    mediaAudit.roles?.hero?.primary ||
    "";
  const galleryUrls = resolveRequestableGalleryImages(car);
  const interiorUrls = buildImageFallbackChain(car, "interior").filter(
    (u) => !isLocalFallback(u)
  );
  const chargingImageDeclared =
    car?.catalogMeta?.media?.verifiedOptionalAssets?.includes(
      "charging-port"
    ) || false;

  const price =
    Number(car?.startingPrice ?? car?.price ?? car?.variants?.[0]?.priceInr) ||
    0;
  const range =
    Number(car?.specifications?.range ?? car?.range) || 0;
  const battery =
    car?.specifications?.batteryPack || car?.batteryPack || null;
  const chargingSpec =
    car?.specifications?.chargingTime || car?.chargingTime || null;
  const accel = formatVerifiedAccelerationDisplay(
    parseVerifiedAcceleration({
      variant: car,
      catalogMeta: car?.catalogMeta,
    })
  );

  const variants = Array.isArray(car?.variants)
    ? car.variants
    : Array.isArray(car?.catalogMeta?.variants)
      ? car.catalogMeta.variants
      : [];

  const seo = car?.catalogMeta?.seo || car?.seo || {};

  const fields = {
    heroImage: statusForValue(
      isLocalFallback(heroUrl) ? null : heroUrl
    ),
    galleryCoverage:
      galleryUrls.length >= 2
        ? COMPLETENESS_STATUS.PRESENT
        : galleryUrls.length === 1
          ? COMPLETENESS_STATUS.NOT_VERIFIED
          : COMPLETENESS_STATUS.MISSING,
    interiorImage:
      interiorUrls.length > 0
        ? COMPLETENESS_STATUS.NOT_VERIFIED
        : COMPLETENESS_STATUS.MISSING,
    chargingImage: chargingImageDeclared
      ? COMPLETENESS_STATUS.NOT_VERIFIED
      : COMPLETENESS_STATUS.MISSING,
    pricingVerified:
      price > 0
        ? car?.catalogMeta?.priceVerified
          ? COMPLETENESS_STATUS.VERIFIED
          : COMPLETENESS_STATUS.NOT_VERIFIED
        : COMPLETENESS_STATUS.MISSING,
    variantsVerified:
      variants.length >= 1
        ? COMPLETENESS_STATUS.PRESENT
        : COMPLETENESS_STATUS.MISSING,
    batteryVerified: statusForValue(battery),
    rangeVerified: range > 0 ? COMPLETENESS_STATUS.NOT_VERIFIED : COMPLETENESS_STATUS.MISSING,
    chargingVerified: intel?.charging?.hasData
      ? COMPLETENESS_STATUS.NOT_VERIFIED
      : COMPLETENESS_STATUS.MISSING,
    accelerationVerified: accel
      ? COMPLETENESS_STATUS.NOT_VERIFIED
      : COMPLETENESS_STATUS.MISSING,
    safetyMetadataPresent: safety.hasData
      ? COMPLETENESS_STATUS.PRESENT
      : COMPLETENESS_STATUS.MISSING,
    compareReadiness:
      car?.compareReady !== false &&
      !isLocalFallback(
        resolveCatalogImageUrl(car, "compare") ||
          mediaAudit.roles?.compare?.primary
      ) &&
      intel?.charging?.hasData
        ? COMPLETENESS_STATUS.PRESENT
        : COMPLETENESS_STATUS.MISSING,
    seoReadiness:
      seo.metaTitle && (car?.overview || seo.metaDescription)
        ? COMPLETENESS_STATUS.PRESENT
        : COMPLETENESS_STATUS.MISSING,
  };

  const missing = Object.entries(fields)
    .filter(([, v]) => v === COMPLETENESS_STATUS.MISSING)
    .map(([k]) => k);

  const notVerified = Object.entries(fields)
    .filter(([, v]) => v === COMPLETENESS_STATUS.NOT_VERIFIED)
    .map(([k]) => k);

  const scoreKeys = Object.keys(fields);
  const completeCount = scoreKeys.filter(
    (k) =>
      fields[k] === COMPLETENESS_STATUS.VERIFIED ||
      fields[k] === COMPLETENESS_STATUS.PRESENT
  ).length;

  return {
    slug,
    familySlug,
    name: car?.name || slug,
    fields,
    completenessPercent: Math.round(
      (completeCount / scoreKeys.length) * 100
    ),
    missing,
    notVerified,
    safetyReadiness: safety.hasData ? "partial" : "missing",
    intelligenceIssues: catalogAudit.issues?.length || 0,
    mediaIssues: mediaAudit.issues?.length || 0,
  };
}

/**
 * @param {object[]} cars
 */
export function generateCatalogAuditReport(cars = []) {
  const vehicles = cars.map(auditVehicleCompleteness);
  const safety = buildSafetyCompletenessReport(cars);

  return {
    generatedAt: new Date().toISOString(),
    vehicleCount: vehicles.length,
    vehicles,
    safety,
    summary: summarizeCatalogCompleteness({ vehicles, safety }),
  };
}

export function summarizeCatalogCompleteness(report = {}) {
  const vehicles = report.vehicles || [];
  if (!vehicles.length) {
    return {
      avgCompletenessPercent: 0,
      fullyReady: 0,
      needsWork: 0,
      topGaps: [],
    };
  }

  const avgCompletenessPercent = Math.round(
    vehicles.reduce((s, v) => s + v.completenessPercent, 0) / vehicles.length
  );

  const gapCounts = {};
  for (const v of vehicles) {
    for (const gap of v.missing || []) {
      gapCounts[gap] = (gapCounts[gap] || 0) + 1;
    }
  }

  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([field, count]) => ({ field, count }));

  return {
    avgCompletenessPercent,
    fullyReady: vehicles.filter((v) => v.completenessPercent >= 85).length,
    needsWork: vehicles.filter((v) => v.completenessPercent < 60).length,
    topGaps,
    safetyReady: report.safety?.readyCount ?? 0,
    safetyPartial: report.safety?.partialCount ?? 0,
  };
}

export function missingMediaReport(report = {}) {
  return (report.vehicles || [])
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      heroImage: v.fields?.heroImage,
      galleryCoverage: v.fields?.galleryCoverage,
      interiorImage: v.fields?.interiorImage,
      chargingImage: v.fields?.chargingImage,
      gaps: ["heroImage", "galleryCoverage", "interiorImage", "chargingImage"].filter(
        (k) =>
          v.fields?.[k] === COMPLETENESS_STATUS.MISSING ||
          v.fields?.[k] === COMPLETENESS_STATUS.UNKNOWN
      ),
    }))
    .filter((r) => r.gaps.length > 0);
}

export function incompleteSpecReport(report = {}) {
  return (report.vehicles || [])
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      gaps: [
        "pricingVerified",
        "variantsVerified",
        "batteryVerified",
        "rangeVerified",
        "chargingVerified",
        "accelerationVerified",
      ].filter(
        (k) => v.fields?.[k] === COMPLETENESS_STATUS.MISSING
      ),
      notVerified: [
        "pricingVerified",
        "batteryVerified",
        "rangeVerified",
        "chargingVerified",
        "accelerationVerified",
      ].filter(
        (k) => v.fields?.[k] === COMPLETENESS_STATUS.NOT_VERIFIED
      ),
    }))
    .filter((r) => r.gaps.length > 0 || r.notVerified.length > 0);
}

export function catalogCompletenessMarkdown(report) {
  const s = report.summary || summarizeCatalogCompleteness(report);
  const lines = [
    "# Catalog completeness audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Vehicles audited: **${report.vehicleCount}**`,
    `- Average completeness: **${s.avgCompletenessPercent}%**`,
    `- Fully ready (≥85%): **${s.fullyReady}**`,
    `- Needs work (<60%): **${s.needsWork}**`,
    `- Safety ready: **${s.safetyReady}** · partial: **${s.safetyPartial}**`,
    "",
  ];

  if (s.topGaps?.length) {
    lines.push("## Top gaps", "", "| Field | Vehicles |", "| --- | --- |");
    for (const g of s.topGaps) {
      lines.push(`| ${g.field} | ${g.count} |`);
    }
    lines.push("");
  }

  lines.push("## Per vehicle", "", "| Vehicle | Completeness | Missing |", "| --- | --- | --- |");
  for (const v of report.vehicles || []) {
    lines.push(
      `| ${v.name || v.slug} | ${v.completenessPercent}% | ${(v.missing || []).join(", ") || "—"} |`
    );
  }

  return lines.join("\n");
}

export { SAFETY_FIELD_STATUS };
