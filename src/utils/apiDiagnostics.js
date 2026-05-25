/**
 * Lightweight API request diagnostics (production-safe, deduped).
 */

const LOG_COOLDOWN_MS = 30_000;
const recentFailures = new Map();

/**
 * Render/API may be waking from cold start (e.g. Render free tier).
 * @param {{ error?: string | null; status?: number; durationMs?: number }} ctx
 */
export function isLikelyApiColdStart(ctx = {}) {
  const { error, status, durationMs = 0 } = ctx;
  if (status === 503 || status === 502) return true;
  if (error === "request_timeout" && durationMs >= 8000) return true;
  if (error === "network_error" || status === 0) return true;
  return false;
}

/**
 * User-facing catalog error copy.
 * @param {{ error?: string | null; status?: number; durationMs?: number }} ctx
 */
export function catalogUnavailableMessage(ctx = {}) {
  if (isLikelyApiColdStart(ctx)) {
    return "Our EV catalog is starting up — this can take a few seconds on first load. Please try again.";
  }
  return "Unable to load EV data right now. Check your connection and try again.";
}

/**
 * User-facing detail page error copy.
 */
export function detailUnavailableMessage(ctx = {}) {
  if (isLikelyApiColdStart(ctx)) {
    return "Vehicle data is still loading on the server. Wait a moment and tap Try again.";
  }
  return "The catalog may be temporarily unavailable. Check your connection and try again.";
}

/**
 * Log failed API calls once per label+error per 30s (avoids console spam).
 */
export function logApiRequest({
  label = "api",
  url = "",
  ok = true,
  status = 0,
  error = null,
  durationMs = 0,
  silent = false,
} = {}) {
  if (ok) {
    if (import.meta.env.DEV && !silent) {
      console.info("[EVSavari API]", {
        label,
        status,
        durationMs,
        url: url.slice(0, 120),
      });
    }
    return;
  }

  if (silent && !import.meta.env.DEV) {
    return;
  }

  const dedupeKey = `${label}:${error || status}`;
  const last = recentFailures.get(dedupeKey) || 0;
  if (Date.now() - last < LOG_COOLDOWN_MS && !import.meta.env.DEV) {
    return;
  }
  recentFailures.set(dedupeKey, Date.now());

  const payload = {
    label,
    status,
    error,
    durationMs,
    likelyColdStart: isLikelyApiColdStart({ error, status, durationMs }),
    url: url.slice(0, 160),
  };

  if (import.meta.env.DEV) {
    console.warn("[EVSavari API]", payload);
  } else if (!silent) {
    console.warn("[EVSavari API] request failed", payload);
  }
}
