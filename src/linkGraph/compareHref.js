/**
 * Compare href helper shared by link graph and legacy callers.
 */

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { buildComparePairSlug, normalizeVehicleSlug } from "./slugUtils.js";

export function resolveCompareDiscoveryHref(slugA, slugB) {
  const a = normalizeVehicleSlug(slugA);
  const b = normalizeVehicleSlug(slugB);
  if (!a || !b || a === b) return "/compare";

  const built = buildComparePairSlug(a, b);
  if (built && GENERATED_COMPARE_SLUGS.includes(built)) {
    return `/compare/${built}`;
  }

  return `/compare?cars=${encodeURIComponent(a)},${encodeURIComponent(b)}`;
}
