/**
 * Local ingestion telemetry for ops (browser). No server; complements review queue.
 */

const KEY = "evsavari-ingestion-telemetry-v1";
const MAX = 120;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

/**
 * @param {object} e { at?, outcome, detail?, sessionId?, meta? }
 */
export function recordIngestionTelemetryEvent(e) {
  const row = {
    at: new Date().toISOString(),
    outcome: e.outcome || "unknown",
    detail: e.detail || "",
    sessionId: e.sessionId || "",
    meta: e.meta || {},
  };
  write([row, ...read()]);
}

/**
 * Aggregate recent sessions + telemetry for ingestion ops panel.
 * @param {object[]} sessions from loadIngestionQueue
 */
export function summarizeIngestionOps(sessions = []) {
  const events = read();
  const taxonomyKeys = {};
  let parseFailures = 0;
  let approved = 0;
  for (const ev of events) {
    if (ev.outcome === "parse_failed") parseFailures += 1;
    if (ev.outcome === "approved") approved += 1;
    const keys = ev.meta?.taxonomyHintKeys;
    if (Array.isArray(keys)) {
      for (const k of keys) taxonomyKeys[k] = (taxonomyKeys[k] || 0) + 1;
    }
  }

  const reviewerCounts = {};
  for (const s of sessions) {
    if (s.reviewer) reviewerCounts[s.reviewer] = (reviewerCounts[s.reviewer] || 0) + 1;
  }

  const highRisk = sessions.filter(
    (s) =>
      s.status === "pending" &&
      (s.maxSeverity === "intelligence" || s.maxSeverity === "pricing")
  ).length;

  const repeatedTaxonomyMismatchKeys = Object.entries(taxonomyKeys)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([key, count]) => ({ key, count }));

  return {
    eventCount: events.length,
    parseFailures,
    approvedExports: approved,
    taxonomyHintHistogram: taxonomyKeys,
    repeatedTaxonomyMismatchKeys,
    reviewerCounts,
    highRiskPending: highRisk,
    sessionHistorySize: sessions.length,
  };
}

/**
 * Recent browser-local ingestion events (newest first).
 * @param {number} [limit]
 */
export function getRecentIngestionTelemetryEvents(limit = 20) {
  const n = Math.min(120, Math.max(1, Number(limit) || 20));
  return read().slice(0, n);
}

/**
 * Extract taxonomy hint keys from diagnostics for telemetry.
 */
export function taxonomyKeysFromSession(session) {
  const keys = [];
  for (const row of session?.diagnostics?.taxonomyHints || []) {
    if (row?.hint) keys.push(String(row.hint));
  }
  return [...new Set(keys)];
}
