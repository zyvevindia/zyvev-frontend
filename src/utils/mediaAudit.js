/**
 * Media completeness and fallback coverage audits.
 */

import {
  PRODUCTION_FAMILY_MEDIA,
  PRODUCTION_FAMILY_SLUGS,
  resolveFamilySlugFromCar,
  resolveFamilySlugFromVariantSlug,
} from "../media/familyMediaManifest.js";
import {
  isCloudinaryUrl,
  isLegacyCatalogCdnUrl,
  isPlaceholderMediaUrl,
} from "../media/cloudinary.js";
import { buildImageFallbackChain } from "./vehicleMedia.js";
import { LOCAL_FALLBACK_EV } from "../config/media.js";
import { resolveMediaSlugMapping } from "../media/slugMapping.js";
import {
  TIER1_FAMILY_SLUGS,
  tier1ManifestCoverage,
} from "../ops/tier1Families.js";

const REQUIRED_ROLES = ["hero", "listing", "compare"];

export function auditVehicleMedia(car = {}) {
  const slug = car?.slug || car?.catalogMeta?.slug || "unknown";
  const familySlug = resolveFamilySlugFromCar(car);
  const slugMapping = resolveMediaSlugMapping(car);
  const issues = [];
  const roles = {};

  if (slugMapping.mismatch) {
    issues.push({
      slug,
      familySlug,
      role: "mapping",
      severity: "warn",
      code: "slug_mismatch",
      message: `explicit family ${slugMapping.explicitFamily} ≠ resolved ${slugMapping.resolvedFamily}`,
    });
  }

  for (const role of [...REQUIRED_ROLES, "og", "gallery"]) {
    const chain = buildImageFallbackChain(car, role);
    const primary = chain[0] || "";
    const primaryIsLocal =
      !primary ||
      primary === LOCAL_FALLBACK_EV ||
      primary.includes("fallback-ev");

    roles[role] = {
      primary,
      chainLength: chain.length,
      usesLocalFallback: primaryIsLocal,
      isCloudinary: isCloudinaryUrl(primary),
      isLegacyCdn: isLegacyCatalogCdnUrl(primary),
      isPlaceholder: isPlaceholderMediaUrl(primary),
    };

    if (!primary) {
      issues.push({
        slug,
        familySlug,
        role,
        severity: "error",
        code: "missing_primary",
        message: `No ${role} image resolved`,
      });
    } else if (isPlaceholderMediaUrl(primary)) {
      issues.push({
        slug,
        familySlug,
        role,
        severity: "warn",
        code: "placeholder_url",
        message: `${role} still uses legacy/placeholder CDN`,
      });
    }

    if (primaryIsLocal && REQUIRED_ROLES.includes(role)) {
      issues.push({
        slug,
        familySlug,
        role,
        severity: "warn",
        code: "fallback_only",
        message: `${role} chain resolves to local SVG fallback`,
      });
    }
  }

  return { slug, familySlug, slugMapping, roles, issues };
}

export function auditProductionFamilies() {
  return PRODUCTION_FAMILY_SLUGS.map((familySlug) => {
    const media = PRODUCTION_FAMILY_MEDIA[familySlug];
    const missing = [];
    for (const [key, url] of Object.entries(media)) {
      if (key === "gallery" || key === "interior" || key === "charging") {
        const arr = Array.isArray(url) ? url : [];
        if (!arr.length) missing.push(key);
        continue;
      }
      if (!url) missing.push(key);
    }
    return {
      familySlug,
      media,
      complete: missing.length === 0,
      missing,
      variantCoverage: resolveFamilySlugFromVariantSlug(
        `${familySlug}-sample`
      ),
    };
  });
}

export function summarizeMediaAudit(vehicleResults = []) {
  const allIssues = vehicleResults.flatMap((r) => r.issues);
  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warn");
  const cloudinaryCount = vehicleResults.filter((r) =>
    REQUIRED_ROLES.every((role) => r.roles[role]?.isCloudinary)
  ).length;

  return {
    vehicles: vehicleResults.length,
    errors: errors.length,
    warnings: warnings.length,
    cloudinaryReady: cloudinaryCount,
    issues: allIssues,
  };
}

/**
 * HEAD-check URLs (browser or Node fetch). Returns broken URL list.
 */
export async function probeImageUrl(url, fetchImpl = globalThis.fetch) {
  if (!url || url.startsWith("/")) {
    return { url, ok: true, skipped: true };
  }
  try {
    let res = await fetchImpl(url, { method: "HEAD" });
    if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 403)) {
      res = await fetchImpl(url, {
        method: "GET",
        headers: { Range: "bytes=0-512" },
      });
    }
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    return { url, ok: false, error: err?.message || "fetch failed" };
  }
}

export async function probeBrokenImages(urls = [], fetchImpl = globalThis.fetch) {
  const unique = [...new Set(urls.filter(Boolean))];
  const results = await Promise.all(
    unique.map((url) => probeImageUrl(url, fetchImpl))
  );
  return results.filter((r) => !r.ok && !r.skipped);
}

/**
 * Collect all manifest Cloudinary URLs for integrity probing.
 */
export function collectManifestMediaUrls() {
  const urls = [];
  for (const familySlug of PRODUCTION_FAMILY_SLUGS) {
    const media = PRODUCTION_FAMILY_MEDIA[familySlug];
    if (!media) continue;
    for (const [key, value] of Object.entries(media)) {
      if (Array.isArray(value)) {
        urls.push(...value.filter(Boolean));
      } else if (value) {
        urls.push(value);
      }
    }
  }
  return [...new Set(urls)];
}

/** Hero, listing, compare only — production-critical probe set. */
export function collectCoreManifestMediaUrls() {
  const urls = [];
  for (const familySlug of PRODUCTION_FAMILY_SLUGS) {
    const media = PRODUCTION_FAMILY_MEDIA[familySlug];
    if (!media) continue;
    urls.push(
      media.heroImage,
      media.listingThumbnail,
      media.compareThumbnail
    );
  }
  return [...new Set(urls.filter(Boolean))];
}

/**
 * Synthetic tier-1 family cars for fallback-chain auditing (no API).
 */
export function buildSyntheticTier1Cars() {
  return TIER1_FAMILY_SLUGS.map((familySlug) => ({
    slug: familySlug,
    familySlug,
    catalogMeta: { slug: familySlug, familySlug },
  }));
}

/**
 * Full media integrity report — shared by CLI verify + admin dashboard.
 */
export function buildMediaIntegrityReport(options = {}) {
  const { brokenProbeResults = [] } = options;
  const manifestRows = auditProductionFamilies();
  const coverage = tier1ManifestCoverage();
  const syntheticCars = buildSyntheticTier1Cars();
  const vehicleAudits = syntheticCars.map((car) => auditVehicleMedia(car));
  const summary = summarizeMediaAudit(vehicleAudits);

  const fallbackUsage = vehicleAudits.filter((v) =>
    REQUIRED_ROLES.some((role) => v.roles[role]?.usesLocalFallback)
  ).length;

  const compareReady = vehicleAudits.filter(
    (v) =>
      v.roles.compare?.isCloudinary &&
      !v.roles.compare?.usesLocalFallback
  ).length;

  const galleryComplete = manifestRows.filter(
    (r) => !r.missing.includes("gallery")
  ).length;

  const slugMismatches = vehicleAudits
    .filter((v) => v.slugMapping?.mismatch)
    .map((v) => ({
      slug: v.slug,
      explicitFamily: v.slugMapping.explicitFamily,
      resolvedFamily: v.slugMapping.resolvedFamily,
    }));

  const brokenUrls = new Set(brokenProbeResults.map((r) => r.url));
  const coreUrlSet = new Set(collectCoreManifestMediaUrls());
  const brokenCoreAssets = [...brokenUrls].filter((url) => coreUrlSet.has(url));

  const topMissing = manifestRows
    .filter((r) => !r.complete)
    .map((r) => ({
      familySlug: r.familySlug,
      missing: r.missing,
    }));

  const tier1CoveragePct = coverage.percent;
  const fallbackUsagePct =
    syntheticCars.length > 0
      ? Math.round((fallbackUsage / syntheticCars.length) * 100)
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    tier1CoveragePct,
    manifestFamilyCount: PRODUCTION_FAMILY_SLUGS.length,
    tier1FamilyCount: TIER1_FAMILY_SLUGS.length,
    missingManifestFamilies: coverage.missingManifest,
    avgCompletenessPercent:
      manifestRows.length > 0
        ? Math.round(
            (manifestRows.filter((r) => r.complete).length /
              manifestRows.length) *
              100
          )
        : 0,
    fallbackUsagePct,
    compareReadyCount: compareReady,
    compareReadyPct:
      syntheticCars.length > 0
        ? Math.round((compareReady / syntheticCars.length) * 100)
        : 0,
    galleryCompleteCount: galleryComplete,
    galleryCompletePct:
      manifestRows.length > 0
        ? Math.round((galleryComplete / manifestRows.length) * 100)
        : 0,
    brokenAssetCount: brokenUrls.size,
    brokenAssets: [...brokenUrls],
    brokenCoreAssetCount: brokenCoreAssets.length,
    brokenCoreAssets,
    placeholderWarnings: summary.issues.filter(
      (i) => i.code === "placeholder_url" || i.code === "fallback_only"
    ).length,
    slugMismatches,
    topMissing,
    manifestRows,
    vehicleAudits,
    summary,
  };
}

/**
 * Media polish signals for admin — deterministic from manifest + audits.
 */
export function buildMediaPolishReport(options = {}) {
  const integrity = buildMediaIntegrityReport(options);
  const manifestRows = integrity.manifestRows || [];

  const needsOemReplacement = manifestRows
    .filter(
      (r) =>
        r.missing?.length > 0 ||
        integrity.vehicleAudits?.some(
          (v) =>
            v.familySlug === r.familySlug &&
            v.roles?.hero?.isPlaceholder
        )
    )
    .map((r) => ({
      familySlug: r.familySlug,
      missing: r.missing,
      reason: "placeholder_or_incomplete_manifest",
    }));

  const weakSocialCoverage = manifestRows
    .filter((r) => r.missing?.includes("og"))
    .map((r) => r.familySlug);

  const visualInconsistencyHotspots = integrity.vehicleAudits
    ?.filter((v) =>
      ["hero", "listing", "compare"].some(
        (role) =>
          v.roles[role]?.usesLocalFallback || v.roles[role]?.isPlaceholder
      )
    )
    .map((v) => ({
      familySlug: v.familySlug,
      roles: Object.entries(v.roles || {})
        .filter(([, data]) => data?.usesLocalFallback || data?.isPlaceholder)
        .map(([role]) => role),
    }))
    .slice(0, 11);

  const compareImageConsistent = integrity.compareReadyPct ?? 0;
  const socialCompleteness =
    manifestRows.length > 0
      ? Math.round(
          ((manifestRows.length - weakSocialCoverage.length) /
            manifestRows.length) *
            100
        )
      : 0;

  const premiumVisualConsistencyScore = Math.round(
    (integrity.compareReadyPct || 0) * 0.4 +
      (integrity.avgCompletenessPercent || 0) * 0.35 +
      (100 - integrity.fallbackUsagePct) * 0.25
  );

  const weakGalleryQuality = manifestRows
    .filter((r) => r.missing?.includes("gallery"))
    .map((r) => r.familySlug);

  const authorityContentImageCoverage =
    manifestRows.length > 0
      ? Math.round(
          (manifestRows.filter((r) => !r.missing?.includes("gallery")).length /
            manifestRows.length) *
            100
        )
      : 0;

  const socialPreviewQuality =
    socialCompleteness >= 80 ? "good" : socialCompleteness >= 50 ? "partial" : "weak";

  const compareImageTrustConsistency =
    compareImageConsistent >= 90
      ? "consistent"
      : compareImageConsistent >= 70
        ? "watch"
        : "weak";

  const weakVisualAuthorityAreas = [
    ...needsOemReplacement.map((r) => r.familySlug),
    ...weakGalleryQuality,
  ].slice(0, 12);

  const authorityContentImageGaps = manifestRows
    .filter((r) => r.missing?.includes("og") || r.missing?.includes("gallery"))
    .map((r) => ({
      familySlug: r.familySlug,
      missing: r.missing,
    }));

  const authorityVisualConsistency = premiumVisualConsistencyScore;
  const trustContentVisualQuality =
    compareImageTrustConsistency === "consistent" &&
    socialPreviewQuality !== "weak"
      ? "good"
      : "watch";
  const socialPreviewTrustQuality = socialPreviewQuality;
  const weakPracticalGuideVisuals = weakGalleryQuality;
  const weakAuthorityVisuals = [
    ...visualInconsistencyHotspots,
    ...authorityContentImageGaps.map((r) => ({
      familySlug: r.familySlug,
      roles: r.missing,
    })),
  ].slice(0, 12);
  const lowTrustSocialPreviews = weakSocialCoverage;
  const practicalGuideVisualGaps = weakGalleryQuality;

  const authorityVisualTrustTrend =
    premiumVisualConsistencyScore >= 75
      ? "trusted"
      : premiumVisualConsistencyScore >= 55
        ? "building"
        : "watch";

  const guideImageUsefulnessQuality =
    galleryComplete >= manifestRows.length * 0.8 ? "good" : "gaps";

  const socialPreviewAuthorityQuality = socialPreviewQuality;

  const lowTrustPracticalImagery =
    trustContentVisualQuality === "watch" ? weakGalleryQuality : [];
  const guideImageQualityGaps = authorityContentImageGaps;

  const authorityVisualRetentionQuality =
    premiumVisualConsistencyScore >= 75 && compareImageTrustConsistency === "consistent"
      ? "trusted"
      : "building";

  const socialPreviewTrustPersistence =
    socialPreviewQuality === "good" ? "persistent" : "developing";

  const weakPracticalGuideImagery = weakGalleryQuality;
  const guideImageRetentionGaps = practicalGuideVisualGaps;

  const authorityVisualPersistence = authorityVisualRetentionQuality;
  const authorityVisualTrustPersistence = authorityVisualPersistence;
  const socialPreviewTrustDurability = socialPreviewTrustPersistence;
  const compareImageTrustQuality = compareImageTrustConsistency;
  const weakSocialPreviewTrust =
    socialPreviewQuality === "weak" ? weakSocialCoverage : [];

  const practicalVisualUsefulness =
    trustContentVisualQuality === "good" ? "useful" : "gaps";

  const authorityVisualMemorability =
    premiumVisualConsistencyScore >= 75 ? "strong" : "developing";

  const weakTrustImageryDetection = weakAuthorityVisuals.slice(0, 8);
  const guideImageUsefulnessGaps = guideImageRetentionGaps;

  const weakTrustVisuals = visualInconsistencyHotspots;
  const weakSocialPreviewCoverage = weakSocialCoverage;

  const visualTrustConsistency =
    compareImageTrustConsistency === "consistent" && trustContentVisualQuality === "good"
      ? "consistent"
      : "watch";

  const authorityImageMemorability = authorityVisualMemorability;
  const socialPreviewConsistency =
    socialPreviewTrustPersistence === "persistent" ? "consistent" : "developing";
  const lowTrustAuthorityImagery = weakAuthorityVisuals.slice(0, 8);

  const visualQualityPersistence =
    visualTrustConsistency === "consistent" ? "persistent" : "building";

  const authorityImageConsistency =
    premiumVisualConsistencyScore >= 75 && compareImageTrustConsistency === "consistent"
      ? "consistent"
      : "watch";

  const socialPreviewReliability =
    socialPreviewConsistency === "consistent" ? "reliable" : "developing";

  const mediaReliabilityUnderTraffic = mediaReliabilityTrend;
  const mediaStabilityUnderTraffic = mediaReliabilityUnderTraffic;
  const perceivedSpeedConsistency = perceivedSpeedPersistence;

  return {
    ...integrity,
    premiumVisualConsistencyScore,
    socialImageCompletenessPct: socialCompleteness,
    compareImageConsistencyPct: compareImageConsistent,
    authorityContentImageCoverage,
    socialPreviewQuality,
    compareImageTrustConsistency,
    weakVisualAuthorityAreas,
    weakTrustVisuals,
    weakSocialPreviewCoverage,
    authorityContentImageGaps,
    needsOemReplacement: needsOemReplacement.slice(0, 11),
    weakSocialImageCoverage: weakSocialCoverage,
    visualInconsistencyHotspots,
    weakGalleryQuality,
    authorityVisualConsistency,
    trustContentVisualQuality,
    socialPreviewTrustQuality,
    weakPracticalGuideVisuals,
    weakAuthorityVisuals,
    lowTrustSocialPreviews,
    practicalGuideVisualGaps,
    authorityVisualTrustTrend,
    guideImageUsefulnessQuality,
    socialPreviewAuthorityQuality,
    lowTrustPracticalImagery,
    guideImageQualityGaps,
    authorityVisualRetentionQuality,
    socialPreviewTrustPersistence,
    weakPracticalGuideImagery,
    guideImageRetentionGaps,
    lowTrustPracticalVisuals: lowTrustPracticalImagery,
    authorityVisualPersistence,
    authorityVisualTrustPersistence,
    socialPreviewTrustDurability,
    compareImageTrustQuality,
    weakSocialPreviewTrust,
    practicalVisualUsefulness,
    authorityVisualMemorability,
    weakTrustImageryDetection,
    guideImageUsefulnessGaps,
    lowTrustAuthorityImagery,
    socialPreviewMemorability:
      socialPreviewQuality === "good" ? "memorable" : "developing",
    authorityVisualTrustDurability: authorityVisualTrustPersistence,
    visualTrustConsistency,
    authorityImageMemorability,
    socialPreviewConsistency,
    weakAuthorityImagery: lowTrustAuthorityImagery,
    visualQualityPersistence,
    authorityImageConsistency,
    socialPreviewReliability,
    mediaReliabilityUnderTraffic,
    visualTrustPersistence,
    mediaStabilityUnderTraffic,
    perceivedSpeedConsistency,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "media-polish",
      version: 1,
      generatedAt: new Date().toISOString(),
    },
  };
}
