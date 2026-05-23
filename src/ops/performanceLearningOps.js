/**
 * Performance learning from client-side metrics buffer.
 */

import { summarizePostLaunchMetrics, getPostLaunchMetrics } from "./postLaunchMetrics.js";

export function buildPerformanceLearningReport() {
  const metrics = summarizePostLaunchMetrics();
  const raw = getPostLaunchMetrics();

  const compareSlow = raw.routeSlow.filter((r) =>
    String(r.pathname || "").includes("/compare")
  );
  const homeSlow = raw.routeSlow.filter(
    (r) => r.pathname === "/" || r.pathname === "/home"
  );

  const regressionAlerts = [];
  if (metrics.routeSlowCount >= 8) {
    regressionAlerts.push({
      code: "route_slow_spike",
      message: "Multiple slow route paints in last 24h — check bundle or API.",
      severity: "medium",
    });
  }
  if (metrics.avgApiLatency != null && metrics.avgApiLatency > 6000) {
    regressionAlerts.push({
      code: "api_latency_high",
      message: `Average buffered API latency ${metrics.avgApiLatency}ms`,
      severity: "high",
    });
  }
  if (metrics.imageFallbackCount >= 10) {
    regressionAlerts.push({
      code: "image_fallback_spike",
      message: "Image fallback frequency elevated — review tier-1 media.",
      severity: "medium",
    });
  }

  const confidence =
    regressionAlerts.some((a) => a.severity === "high")
      ? "low"
      : regressionAlerts.length
        ? "medium"
        : "high";

  return {
    metrics,
    slowPageRanking: metrics.slowPages,
    compareLoadEvents: compareSlow.length,
    homepageLcpProxy: homeSlow.length
      ? Math.round(
          homeSlow.reduce((s, r) => s + r.durationMs, 0) / homeSlow.length
        )
      : null,
    regressionAlerts,
    performanceConfidence: confidence,
    note: "LCP and payload trends use route-paint proxy until RUM is wired — no speculative AI.",
    generatedAt: new Date().toISOString(),
  };
}
