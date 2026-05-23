/**
 * Tier-1 OEM media completeness for admin / docs.
 */

import {
  PRODUCTION_FAMILY_MEDIA,
  PRODUCTION_FAMILY_SLUGS,
} from "../media/familyMediaManifest.js";
import {
  auditProductionFamilies,
  auditVehicleMedia,
} from "../utils/mediaAudit.js";
import {
  isCloudinaryUrl,
  isPlaceholderMediaUrl,
} from "../media/cloudinary.js";
import {
  TIER1_FAMILY_SLUGS,
  TIER1_OEM_GROUPS,
  tier1ManifestCoverage,
} from "./tier1Families.js";
import { resolveFamilySlugFromCar } from "../media/familyMediaManifest.js";

export const MEDIA_HEALTH_STATUS = Object.freeze({
  READY: "READY",
  PARTIAL: "PARTIAL",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

const ROLE_KEYS = [
  { key: "hero", label: "Hero", manifestKey: "heroImage" },
  { key: "compare", label: "Compare", manifestKey: "compareThumbnail" },
  { key: "listing", label: "Thumbnail", manifestKey: "listingThumbnail" },
  { key: "gallery", label: "Gallery", manifestKey: "gallery" },
];

function manifestRoleStatus(familySlug, roleKey, manifestKey) {
  const media = PRODUCTION_FAMILY_MEDIA[familySlug];
  if (!media) {
    return {
      status: "missing_manifest",
      url: "",
      cloudinaryReady: false,
      usesPlaceholder: true,
    };
  }
  const raw = media[manifestKey];
  const url = Array.isArray(raw) ? raw[0] || "" : raw || "";
  if (!url) {
    return {
      status: "missing",
      url: "",
      cloudinaryReady: false,
      usesPlaceholder: true,
    };
  }
  return {
    status: "ok",
    url,
    cloudinaryReady: isCloudinaryUrl(url),
    usesPlaceholder: isPlaceholderMediaUrl(url),
  };
}

/**
 * Per-family manifest row (Cloudinary block).
 */
export function buildTier1FamilyMediaRows() {
  return TIER1_FAMILY_SLUGS.map((familySlug) => {
    const inManifest = PRODUCTION_FAMILY_SLUGS.includes(familySlug);
    const roles = {};
    let completeCount = 0;
    for (const { key, manifestKey } of ROLE_KEYS) {
      const row = inManifest
        ? manifestRoleStatus(familySlug, key, manifestKey)
        : {
            status: "missing_manifest",
            url: "",
            cloudinaryReady: false,
            usesPlaceholder: true,
          };
      roles[key] = row;
      if (row.status === "ok" && row.cloudinaryReady && !row.usesPlaceholder) {
        completeCount += 1;
      }
    }
    const completenessPercent = Math.round(
      (completeCount / ROLE_KEYS.length) * 100
    );
    const oem =
      TIER1_OEM_GROUPS.find((g) => g.families.includes(familySlug))?.oem ||
      "—";

    const status = scoreTier1MediaHealth({
      inManifest,
      completenessPercent,
      placeholderUsage: Object.values(roles).some((r) => r.usesPlaceholder),
      roles,
    });

    return {
      familySlug,
      oem,
      inManifest,
      roles,
      completenessPercent,
      status,
      cloudinaryReady: Object.values(roles).every((r) => r.cloudinaryReady),
      placeholderUsage: Object.values(roles).some((r) => r.usesPlaceholder),
    };
  });
}

/**
 * Deterministic tier-1 media readiness.
 */
export function scoreTier1MediaHealth({
  inManifest = false,
  completenessPercent = 0,
  placeholderUsage = false,
  roles = {},
} = {}) {
  const heroOk = roles.hero?.status === "ok";
  const compareOk = roles.compare?.status === "ok";
  const listingOk = roles.listing?.status === "ok";

  if (!inManifest) {
    return MEDIA_HEALTH_STATUS.NEEDS_REVIEW;
  }
  if (
    completenessPercent >= 75 &&
    heroOk &&
    compareOk &&
    listingOk &&
    !placeholderUsage
  ) {
    return MEDIA_HEALTH_STATUS.READY;
  }
  if (completenessPercent >= 50 && (heroOk || compareOk)) {
    return MEDIA_HEALTH_STATUS.PARTIAL;
  }
  return MEDIA_HEALTH_STATUS.NEEDS_REVIEW;
}

/**
 * Match API cars to tier-1 families and audit resolved URLs.
 */
export function auditTier1CatalogMedia(cars = []) {
  const byFamily = new Map();

  for (const car of cars) {
    const familySlug = resolveFamilySlugFromCar(car);
    if (!familySlug || !TIER1_FAMILY_SLUGS.includes(familySlug)) continue;
    if (!byFamily.has(familySlug)) byFamily.set(familySlug, []);
    byFamily.get(familySlug).push(car);
  }

  return TIER1_FAMILY_SLUGS.map((familySlug) => {
    const variants = byFamily.get(familySlug) || [];
    const sample = variants[0];
    const vehicleAudit = sample ? auditVehicleMedia(sample) : null;
    const manifestRows = buildTier1FamilyMediaRows().find(
      (r) => r.familySlug === familySlug
    );

    return {
      familySlug,
      variantCount: variants.length,
      manifest: manifestRows,
      vehicleAudit,
      apiResolved: vehicleAudit
        ? {
            hero: vehicleAudit.roles.hero?.primary,
            compare: vehicleAudit.roles.compare?.primary,
            listing: vehicleAudit.roles.listing?.primary,
          }
        : null,
    };
  });
}

export function summarizeTier1MediaHealth(rows = []) {
  const coverage = tier1ManifestCoverage();
  const avgCompleteness =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + r.completenessPercent, 0) / rows.length
        )
      : 0;
  const manifestComplete = rows.filter(
    (r) => r.inManifest && r.completenessPercent >= 75
  ).length;

  const statusCounts = {
    [MEDIA_HEALTH_STATUS.READY]: 0,
    [MEDIA_HEALTH_STATUS.PARTIAL]: 0,
    [MEDIA_HEALTH_STATUS.NEEDS_REVIEW]: 0,
  };
  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
  }

  return {
    ...coverage,
    familiesAudited: rows.length,
    avgCompletenessPercent: avgCompleteness,
    manifestCompleteCount: manifestComplete,
    statusCounts,
    readyPercent:
      rows.length > 0
        ? Math.round(
            (statusCounts[MEDIA_HEALTH_STATUS.READY] / rows.length) * 100
          )
        : 0,
    missingHero: rows.filter((r) => r.roles?.hero?.status !== "ok").length,
    missingCompare: rows.filter((r) => r.roles?.compare?.status !== "ok")
      .length,
    missingGallery: rows.filter((r) => r.roles?.gallery?.status !== "ok")
      .length,
    placeholderFamilies: rows.filter((r) => r.placeholderUsage).length,
    auditedAt: new Date().toISOString(),
  };
}

export function auditProductionFamilyManifest() {
  return auditProductionFamilies();
}
