/**
 * Route-level performance diagnostics (production-safe, deduped).
 */

import { recordSlowApi, recordSlowRoute } from "../ops/postLaunchMetrics.js";

const SLOW_ROUTE_MS = 2800;
const SLOW_API_MS = 5000;
const recentRouteWarnings = new Map();
const ROUTE_COOLDOWN_MS = 45_000;

/**
 * @param {string} pathname
 * @param {{ durationMs?: number; label?: string }} [meta]
 */
export function logSlowRoute(pathname, meta = {}) {
  const { durationMs = 0, label = pathname } = meta;
  if (durationMs < SLOW_ROUTE_MS) return;

  const key = `${label}:${pathname}`;
  const last = recentRouteWarnings.get(key) || 0;
  if (Date.now() - last < ROUTE_COOLDOWN_MS && import.meta.env.PROD) return;
  recentRouteWarnings.set(key, Date.now());

  const payload = {
    pathname,
    durationMs,
    label,
    thresholdMs: SLOW_ROUTE_MS,
  };

  recordSlowRoute({ pathname, durationMs, label });

  if (import.meta.env.DEV) {
    console.info("[EVSavari Perf] slow route paint", payload);
  } else {
    console.warn("[EVSavari Perf] slow route", payload);
  }
}

export function logSlowApiRequest(label, durationMs, error = null) {
  if (durationMs < SLOW_API_MS) return;
  recordSlowApi({ label, durationMs, error });
  if (import.meta.env.DEV) {
    console.info("[EVSavari Perf] slow API", { label, durationMs });
  } else {
    console.warn("[EVSavari Perf] slow API", { label, durationMs });
  }
}

export { SLOW_ROUTE_MS, SLOW_API_MS };
