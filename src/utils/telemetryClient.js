/**
 * Silent telemetry / analytics POSTs — never pollute console or block UI.
 */

const DEFAULT_TIMEOUT_MS = 6000;
const MAX_BACKOFF_MS = 120_000;

/** Per-endpoint backoff after 5xx / network failure */
const endpointState = new Map();

function endpointKey(url = "") {
  try {
    return new URL(url, "https://evsavari.com").pathname;
  } catch {
    return String(url).slice(0, 80);
  }
}

function isTelemetryPath(path = "") {
  return (
    path === "/views" ||
    path.startsWith("/api/behavioral") ||
    path.includes("page-view") ||
    path.includes("telemetry")
  );
}

function scheduleBackoff(url, status = 0) {
  const key = endpointKey(url);
  const prev = endpointState.get(key) || { failures: 0, until: 0 };
  const failures =
    status >= 500 || status === 0 ? prev.failures + 1 : prev.failures;
  const delay = Math.min(
    MAX_BACKOFF_MS,
    15_000 * Math.pow(2, Math.min(failures - 1, 4))
  );
  endpointState.set(key, {
    failures,
    until: Date.now() + delay,
  });
}

function isBackedOff(url) {
  const state = endpointState.get(endpointKey(url));
  return state && Date.now() < state.until;
}

/**
 * Fire-and-forget POST/GET for telemetry. Swallows errors; applies backoff on failure.
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number; label?: string }} [options]
 * @returns {Promise<void>}
 */
export async function postTelemetrySilently(url, options = {}) {
  if (!url || typeof window === "undefined") return;
  if (isBackedOff(url)) return;

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    label = "telemetry",
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      keepalive: true,
    });

    if (!res.ok) {
      scheduleBackoff(url, res.status);
      if (import.meta.env.DEV) {
        console.info("[EVSavari telemetry] skipped", {
          label,
          status: res.status,
          path: endpointKey(url),
        });
      }
    } else {
      endpointState.delete(endpointKey(url));
    }
  } catch {
    scheduleBackoff(url, 0);
    if (import.meta.env.DEV) {
      console.info("[EVSavari telemetry] network skip", {
        label,
        path: endpointKey(url),
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

export function isSilentTelemetryUrl(url = "") {
  return isTelemetryPath(endpointKey(url));
}
