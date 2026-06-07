/**
 * EVSavari catalog media policy (effective 2026-05-20).
 *
 * Legacy families: existing Cloudinary assets are frozen — do not replace during
 * productionization. All other families follow licensed-source workflow with
 * traceable attribution in docs/operations/tier1-media-attribution.json.
 */

/** @readonly */
export const MEDIA_POLICY_VERSION = "2026-05-20";

/**
 * Pre-policy vehicles — keep Cloudinary assets unchanged.
 * @type {readonly string[]}
 */
export const LEGACY_FROZEN_MEDIA_FAMILIES = Object.freeze([
  "tata-nexon-ev",
  "tata-punch-ev",
]);

/**
 * Named vehicles on the licensed-source standard (non-exhaustive roll-call).
 * @type {readonly string[]}
 */
export const LICENSED_STANDARD_ROLLCALL = Object.freeze([
  "tata-tiago-ev",
  "tata-curvv-ev",
  "mg-zs-ev",
  "byd-atto-3",
  "hyundai-kona-electric",
]);

/** Allowed remote ingest hosts for licensed-standard uploads. */
export const ALLOWED_LICENSED_SOURCE_HOSTS = Object.freeze([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

/**
 * Prohibited source patterns — never ingest or hotlink at runtime.
 * @type {readonly RegExp[]}
 */
export const PROHIBITED_SOURCE_PATTERNS = Object.freeze([
  /googleusercontent\.com/i,
  /gstatic\.com.*images/i,
  /images\.google\./i,
  /carwale\.com/i,
  /cardekho\.com/i,
  /zigwheels\.com/i,
  /autocarindia\.com/i,
  /overdrive\.in/i,
  /team-bhp\.com/i,
  /(?:^|\.)byd\.com/i,
  /(?:^|\.)hyundai\.com/i,
  /(?:^|\.)tatamotors\.com/i,
  /(?:^|\.)hyundaimotorindia\.com/i,
]);

export function isLegacyFrozenMediaFamily(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  return LEGACY_FROZEN_MEDIA_FAMILIES.includes(key);
}

export function requiresLicensedAttribution(familySlug = "") {
  return !isLegacyFrozenMediaFamily(familySlug);
}

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isProhibitedMediaSourceUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return PROHIBITED_SOURCE_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isAllowedLicensedIngestUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return ALLOWED_LICENSED_SOURCE_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}
