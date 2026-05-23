/**
 * Operational confidence index — performance, API, images, compare routes.
 */

import {
  getPostLaunchMetrics,
  summarizePostLaunchMetrics,
} from "./postLaunchMetrics.js";
import { buildPerformanceLearningReport } from "./performanceLearningOps.js";
import { runSystemHealthProbe, classifyApiHealthState } from "../utils/systemStatus.js";

const SNAPSHOT_KEY = "evsavari-confidence-snapshots-v1";
const MAX_SNAPSHOTS = 14;

function readSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSnapshots(arr) {
  try {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify(arr.slice(0, MAX_SNAPSHOTS))
    );
  } catch {
    /* quota */
  }
}

/**
 * Record daily confidence snapshot (call from monitor page).
 */
export function recordConfidenceSnapshot(index) {
  const snapshots = readSnapshots();
  const day = new Date().toISOString().slice(0, 10);
  const filtered = snapshots.filter((s) => s.day !== day);
  writeSnapshots([
    { day, at: new Date().toISOString(), index },
    ...filtered,
  ]);
}

export async function buildOperationalConfidenceReport() {
  const metrics = summarizePostLaunchMetrics();
  const perf = buildPerformanceLearningReport();
  const health = await runSystemHealthProbe();
  const apiState = classifyApiHealthState(health.api);

  const apiHealthConfidence =
    apiState === "green" ? 92 : apiState === "yellow" ? 62 : 35;

  const comparePerfConfidence = Math.max(
    0,
    100 - perf.compareLoadEvents * 8 - (perf.regressionAlerts?.length || 0) * 12
  );

  const imageReliabilityConfidence = Math.max(
    0,
    100 - Math.min(metrics.imageFallbackCount * 5, 40)
  );

  const routeConfidence = Math.max(
    0,
    100 - Math.min(metrics.routeSlowCount * 4, 35)
  );

  const operationalConfidenceIndex = Math.round(
    apiHealthConfidence * 0.35 +
      comparePerfConfidence * 0.2 +
      imageReliabilityConfidence * 0.2 +
      routeConfidence * 0.15 +
      (perf.performanceConfidence === "high"
        ? 10
        : perf.performanceConfidence === "medium"
          ? 5
          : 0)
  );

  const regressions = perf.regressionAlerts || [];
  const snapshots = readSnapshots();
  const prev = snapshots[1]?.index;
  const trend =
    prev != null && operationalConfidenceIndex < prev - 8
      ? "declining"
      : prev != null && operationalConfidenceIndex > prev + 5
        ? "improving"
        : "stable";

  recordConfidenceSnapshot(operationalConfidenceIndex);

  return {
    operationalConfidenceIndex,
    trend,
    apiHealthConfidence,
    comparePerformanceConfidence: comparePerfConfidence,
    imageReliabilityConfidence,
    routeConfidence,
    apiState,
    metrics,
    perf,
    regressions,
    historicalSnapshots: readSnapshots().slice(0, 7),
    generatedAt: new Date().toISOString(),
  };
}
