/**
 * Lightweight client-side usage signals for internal ops dashboards.
 * Buffers funnel-friendly events (no PII). Cap ~200; ring-style trim.
 */

const STORAGE_KEY = "evsavari-usage-learning-v1";
const MAX = 200;

function read() {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(entries) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ type: string; meta?: object }} event
 */
const SESSION_KEY = "evsavari-usage-session-v1";

export function getUsageSessionId() {
  if (typeof sessionStorage === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

export function appendUsageLearningEvent(event) {
  const row = {
    id: `ul-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    type: String(event.type || "unknown").slice(0, 64),
    meta: event.meta && typeof event.meta === "object" ? event.meta : {},
    sessionId: getUsageSessionId(),
  };
  write([row, ...read()]);
  return row;
}

export function listUsageLearningEvents(limit = 200) {
  return read().slice(0, limit);
}

/**
 * Counts by type for ops summaries.
 */
export function summarizeUsageLearningBuffer(events = listUsageLearningEvents()) {
  const byType = {};
  for (const e of events) {
    const t = e.type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  }
  return {
    total: events.length,
    byType,
    recent: events.slice(0, 12),
  };
}
