/**
 * Image fallback metrics — dev verbose, production deduped warnings.
 */

import { devWarn } from "./devDiagnostics";
import { recordImageFallbackMetric } from "../ops/postLaunchMetrics.js";

const logged = new Set();
const COOLDOWN_MS = 60_000;
const lastProdWarn = new Map();

export function logImageFallback({
  role = "listing",
  failedUrl = "",
  fallbackUrl = "",
  slug = "",
} = {}) {
  const key = `${slug}|${role}|${failedUrl}`;

  if (import.meta.env.DEV) {
    if (logged.has(key)) return;
    logged.add(key);
    devWarn("Image fallback activated", {
      slug: slug || "(unknown)",
      role,
      failedUrl: failedUrl || "(empty)",
      fallbackUrl: fallbackUrl || "(local)",
    });
    return;
  }

  const dedupeKey = `${slug}:${role}`;
  const last = lastProdWarn.get(dedupeKey) || 0;
  if (Date.now() - last < COOLDOWN_MS) return;
  lastProdWarn.set(dedupeKey, Date.now());

  recordImageFallbackMetric({ slug, role });

  console.warn("[EVSavari Media] image fallback", {
    slug: slug || "(unknown)",
    role,
    usedPlaceholder: !fallbackUrl || fallbackUrl.includes("fallback"),
  });
}
