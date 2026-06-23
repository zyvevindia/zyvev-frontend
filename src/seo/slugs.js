/**
 * Unified slug normalization — single entry for URL segments.
 * Vehicle routes stay at /cars/:slug (canonical EV detail URLs).
 */

export {
  normalizeVehicleSlug,
  isValidVehicleSlug,
  resolveSlugCandidates,
  vehicleFamilyPath,
  vehicleDetailPath,
  canonicalVehicleUrl,
} from "../utils/vehicleRoutes.js";

export { normalizeSegment } from "./slugMap.js";

/**
 * Normalize compare guide slug (editorial /compare/:slug pages).
 */
export function normalizeCompareGuideSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build deterministic compare pair slug (alphabetical family slugs).
 * @returns {string|null}
 */
export function buildComparePairSlug(slugA, slugB) {
  const a = normalizeCompareGuideSlug(slugA);
  const b = normalizeCompareGuideSlug(slugB);

  if (!a || !b || a === b) {
    return null;
  }

  const [left, right] = [a, b].sort();
  return `${left}-vs-${right}`;
}

/**
 * In-app path for editorial compare guide.
 */
export function compareGuidePath(compareSlug) {
  const slug = normalizeCompareGuideSlug(compareSlug);

  if (!slug) {
    return "/compare";
  }

  return `/compare/${slug}`;
}

/**
 * Strip trailing slashes and lowercase pathname for canonical comparison.
 */
export function normalizePathname(pathname = "") {
  let path = String(pathname || "/").trim();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path;
}
