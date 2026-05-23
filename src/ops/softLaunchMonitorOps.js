/**
 * Soft-launch operational monitor — merges metrics buffer + live probes.
 */

import {
  getPostLaunchMetrics,
  summarizePostLaunchMetrics,
} from "./postLaunchMetrics.js";
import { runSystemHealthProbe, classifyApiHealthState } from "../utils/systemStatus.js";

export async function buildSoftLaunchMonitorReport() {
  const metrics = summarizePostLaunchMetrics();
  const health = await runSystemHealthProbe();
  const apiState = classifyApiHealthState(health.api);

  const opsState =
    apiState === "red" || metrics.coldStartCount >= 3
      ? "red"
      : apiState === "yellow" ||
          metrics.apiSlowCount >= 5 ||
          metrics.imageFallbackCount >= 8
        ? "yellow"
        : "green";

  return {
    opsState,
    opsStateLabel:
      opsState === "green"
        ? "Operational"
        : opsState === "yellow"
          ? "Watch"
          : "Incident risk",
    health,
    metrics,
    raw: getPostLaunchMetrics(),
    checklistSummary: [
      metrics.apiSlowCount > 0
        ? `${metrics.apiSlowCount} slow API events (24h buffer)`
        : "No slow API events in buffer",
      metrics.imageFallbackCount > 0
        ? `${metrics.imageFallbackCount} image fallbacks (24h)`
        : "No image fallbacks logged",
      health.likelyColdStart
        ? "Cold start detected on last probe"
        : "API probe OK",
    ],
    generatedAt: new Date().toISOString(),
  };
}
