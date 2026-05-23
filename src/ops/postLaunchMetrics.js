/**
 * Client-side operational metrics ring buffer (admin observability).
 */

const KEY = "evsavari-post-launch-metrics-v1";
const MAX = 120;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === "object" ? data : emptyStore();
  } catch {
    return emptyStore();
  }
}

function emptyStore() {
  return {
    apiSlow: [],
    routeSlow: [],
    imageFallback: [],
    coldStart: [],
    updatedAt: null,
  };
}

function write(store) {
  try {
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function trim(arr, max = MAX) {
  return (arr || []).slice(0, max);
}

export function recordSlowApi({ label, durationMs, error = null } = {}) {
  const store = read();
  store.apiSlow = trim([
    { at: new Date().toISOString(), label, durationMs, error },
    ...store.apiSlow,
  ]);
  write(store);
}

export function recordSlowRoute({ pathname, durationMs, label } = {}) {
  const store = read();
  store.routeSlow = trim([
    { at: new Date().toISOString(), pathname, durationMs, label },
    ...store.routeSlow,
  ]);
  write(store);
}

export function recordImageFallbackMetric({ slug, role } = {}) {
  const store = read();
  store.imageFallback = trim([
    { at: new Date().toISOString(), slug, role },
    ...store.imageFallback,
  ]);
  write(store);
}

export function recordColdStartProbe({ latencyMs, ok } = {}) {
  const store = read();
  store.coldStart = trim([
    { at: new Date().toISOString(), latencyMs, ok },
    ...store.coldStart,
  ]);
  write(store);
}

export function getPostLaunchMetrics() {
  return read();
}

export function summarizePostLaunchMetrics(store = read()) {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const inWindow = (row) => new Date(row.at).getTime() >= last24h;

  const apiRecent = store.apiSlow.filter(inWindow);
  const routeRecent = store.routeSlow.filter(inWindow);
  const imgRecent = store.imageFallback.filter(inWindow);
  const coldRecent = store.coldStart.filter(inWindow);

  const byRoute = {};
  for (const r of routeRecent) {
    const k = r.pathname || "unknown";
    byRoute[k] = (byRoute[k] || 0) + 1;
  }
  const slowPages = Object.entries(byRoute)
    .map(([pathname, count]) => ({ pathname, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byLabel = {};
  for (const r of apiRecent) {
    byLabel[r.label || "api"] = (byLabel[r.label] || 0) + 1;
  }

  return {
    updatedAt: store.updatedAt,
    apiSlowCount: apiRecent.length,
    routeSlowCount: routeRecent.length,
    imageFallbackCount: imgRecent.length,
    coldStartCount: coldRecent.filter((c) => !c.ok).length,
    slowPages,
    apiLabels: byLabel,
    avgApiLatency:
      apiRecent.length > 0
        ? Math.round(
            apiRecent.reduce((s, r) => s + (r.durationMs || 0), 0) /
              apiRecent.length
          )
        : null,
  };
}
