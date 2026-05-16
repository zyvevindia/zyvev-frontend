/**
 * Client-side structured logging for operational validation.
 * No PII — metadata only.
 */

const PREFIX = "[EVSavari]";

export function logProduction(category, event, meta = {}, level = "info") {
  const entry = {
    ts: new Date().toISOString(),
    category,
    event,
    ...meta,
  };

  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.info;

  fn(PREFIX, JSON.stringify(entry));
}

export async function fetchWithLog(url, options = {}, context = {}) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      logProduction(
        "api",
        "request_failed",
        {
          url: sanitizeUrl(url),
          status: res.status,
          ...context,
        },
        "warn"
      );
    }

    return res;
  } catch (err) {
    logProduction(
      "api",
      "request_error",
      {
        url: sanitizeUrl(url),
        message: err?.message,
        ...context,
      },
      "error"
    );
    throw err;
  }
}

function sanitizeUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    return `${u.pathname}`;
  } catch {
    return String(url).slice(0, 120);
  }
}
