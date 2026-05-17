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

const REQUIRED_ROLES = ["hero", "listing", "compare"];

export function auditVehicleMedia(car = {}) {
  const slug = car?.slug || car?.catalogMeta?.slug || "unknown";
  const familySlug = resolveFamilySlugFromCar(car);
  const issues = [];
  const roles = {};

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

  return { slug, familySlug, roles, issues };
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
    const res = await fetchImpl(url, { method: "HEAD" });
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
