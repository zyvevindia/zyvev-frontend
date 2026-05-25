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
import {
  OPTIONAL_CATALOG_ASSET_BASENAMES,
  VERIFIED_OPTIONAL_ASSETS_BY_FAMILY,
} from "../media/catalogMediaAvailability.js";
import { familyCatalogUrl } from "../media/cloudinary.js";

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

const OPTIONAL_ROLE_KEYS = [
  { key: "exterior", label: "Exterior", filenames: ["exterior-1.jpg", "exterior-2.jpg", "exterior-3.jpg"] },
  { key: "interior", label: "Interior", filenames: ["interior-1.jpg"] },
  { key: "charging-port", label: "Charging port", filenames: ["charging-port.jpg"] },
  { key: "og", label: "OG / social", filenames: ["og"] },
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

/**
 * Tier-1 optional media roles — operational gaps (no runtime probing).
 */
export function buildTier1OptionalMediaRoleReport() {
  return TIER1_FAMILY_SLUGS.map((familySlug) => {
    const verified =
      VERIFIED_OPTIONAL_ASSETS_BY_FAMILY[familySlug] || [];
    const roles = OPTIONAL_ROLE_KEYS.map(({ key, label, filenames }) => {
      const expected = filenames.map((f) =>
        familyCatalogUrl(familySlug, f === "og" ? "og" : f)
      );
      const missingFiles = filenames.filter((file) => {
        const base = file.replace(/\.(jpg|jpeg|png)$/i, "");
        return !verified.includes(base);
      });
      return {
        key,
        label,
        status: missingFiles.length === 0 ? "verified" : "not_uploaded",
        missingFiles,
        runtimeRequested: false,
      };
    });

    return {
      familySlug,
      oem:
        TIER1_OEM_GROUPS.find((g) => g.families.includes(familySlug))?.oem ||
        "—",
      roles,
      verifiedOptionalCount: verified.length,
      incompleteRoles: roles.filter((r) => r.status !== "verified"),
    };
  });
}

/**
 * Summary for admin dashboards / ops scripts.
 */
/**
 * Cloudinary path consistency: evsavari/catalog/families/<slug>/<role>
 */
export function expectedCloudinaryRolePath(familySlug, roleBasename) {
  return `evsavari/catalog/families/${familySlug}/${roleBasename}`;
}

/**
 * Detect duplicate/conflicting role URLs across manifest block.
 */
export function detectMediaRoleConflicts(families = PRODUCTION_FAMILY_SLUGS) {
  const conflicts = [];
  for (const familySlug of families) {
    const media = PRODUCTION_FAMILY_MEDIA[familySlug];
    if (!media) continue;
    const seen = new Map();
    for (const [key, value] of Object.entries(media)) {
      const urls = Array.isArray(value) ? value : [value];
      for (const url of urls.filter(Boolean)) {
        const pathKey = url.split("/upload/").pop()?.split("?")[0] || url;
        if (seen.has(pathKey) && seen.get(pathKey) !== key) {
          conflicts.push({
            familySlug,
            roles: [seen.get(pathKey), key],
            path: pathKey,
          });
        } else {
          seen.set(pathKey, key);
        }
      }
    }
  }
  return conflicts;
}

/**
 * @param {ReturnType<typeof buildTier1FamilyMediaRows>[0]} row
 */
export function buildTier1MediaCompletenessScore(row = {}) {
  const coreRoles = ["hero", "compare", "listing"];
  const optionalRoles = OPTIONAL_ROLE_KEYS.map((r) => r.key);
  let coreOk = 0;
  let optionalOk = 0;

  for (const key of coreRoles) {
    const r = row.roles?.[key];
    if (r?.status === "ok" && r.cloudinaryReady && !r.usesPlaceholder) {
      coreOk += 1;
    }
  }

  const optionalReport = buildTier1OptionalMediaRoleReport().find(
    (r) => r.familySlug === row.familySlug
  );
  optionalOk =
    optionalReport?.roles?.filter((r) => r.status === "verified").length || 0;

  const corePct = Math.round((coreOk / coreRoles.length) * 100);
  const optionalPct = Math.round(
    (optionalOk / Math.max(optionalRoles.length, 1)) * 100
  );
  const mediaCompletenessPercent = Math.round(corePct * 0.75 + optionalPct * 0.25);

  return {
    familySlug: row.familySlug,
    oem: row.oem,
    mediaCompletenessPercent,
    coreCompletenessPercent: corePct,
    optionalCompletenessPercent: optionalPct,
    missingCoreRoles: coreRoles.filter(
      (k) => row.roles?.[k]?.status !== "ok"
    ),
    missingOptionalRoles:
      optionalReport?.incompleteRoles?.map((r) => r.key) || optionalRoles,
    status: row.status,
  };
}

/**
 * Full tier-1 media completeness report for ops.
 */
export function buildTier1MediaCompletenessReport() {
  const rows = buildTier1FamilyMediaRows();
  const scored = rows.map(buildTier1MediaCompletenessScore);
  const optional = buildTier1OptionalMediaRoleReport();
  const conflicts = detectMediaRoleConflicts();
  const byOem = TIER1_OEM_GROUPS.map((group) => ({
    oem: group.oem,
    families: scored.filter((s) => group.families.includes(s.familySlug)),
    avgCompleteness:
      group.families.length > 0
        ? Math.round(
            scored
              .filter((s) => group.families.includes(s.familySlug))
              .reduce((sum, s) => sum + s.mediaCompletenessPercent, 0) /
              group.families.length
          )
        : 0,
  }));

  return {
    generatedAt: new Date().toISOString(),
    families: scored,
    optional,
    conflicts,
    byOem,
    summary: {
      avgMediaCompletenessPercent:
        scored.length > 0
          ? Math.round(
              scored.reduce((s, r) => s + r.mediaCompletenessPercent, 0) /
                scored.length
            )
          : 0,
      familiesBelow60: scored.filter((s) => s.mediaCompletenessPercent < 60)
        .length,
      conflictCount: conflicts.length,
      cloudinaryPrefix: "evsavari/catalog/families/<slug>/<role>",
    },
  };
}

export function tier1MediaCompletenessMarkdown(report) {
  const lines = [
    "# Tier-1 media completeness",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Average completeness: **${report.summary?.avgMediaCompletenessPercent}%**`,
    `- Families below 60%: **${report.summary?.familiesBelow60}**`,
    `- Role conflicts: **${report.summary?.conflictCount}**`,
    "",
    "## Per OEM",
    "",
    "| OEM | Avg completeness |",
    "| --- | --- |",
  ];
  for (const o of report.byOem || []) {
    lines.push(`| ${o.oem} | ${o.avgCompleteness}% |`);
  }
  lines.push("", "## Families", "", "| Family | Score | Missing core | Missing optional |", "| --- | --- | --- | --- |");
  for (const f of report.families || []) {
    lines.push(
      `| ${f.familySlug} | ${f.mediaCompletenessPercent}% | ${(f.missingCoreRoles || []).join(", ") || "—"} | ${(f.missingOptionalRoles || []).join(", ") || "—"} |`
    );
  }
  return lines.join("\n");
}

export function summarizeTier1OptionalMediaGaps(
  rows = buildTier1OptionalMediaRoleReport()
) {
  const incompleteFamilies = rows.filter(
    (r) => r.incompleteRoles.length > 0
  );
  return {
    familiesAudited: rows.length,
    familiesWithGaps: incompleteFamilies.length,
    optionalAssetCatalog: [...OPTIONAL_CATALOG_ASSET_BASENAMES],
    byOem: TIER1_OEM_GROUPS.map((group) => ({
      oem: group.oem,
      families: group.families.map((slug) => {
        const row = rows.find((r) => r.familySlug === slug);
        return {
          familySlug: slug,
          missing: row?.incompleteRoles.map((r) => r.key) || [],
        };
      }),
    })),
    rows: incompleteFamilies,
    auditedAt: new Date().toISOString(),
  };
}
