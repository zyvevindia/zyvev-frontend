/**
 * Lightweight acquisition context — session-scoped, no PII.
 * Captures UTM + referrer host once per session for ops buffer meta.
 */

const STORAGE_KEY = "evsavari-acquisition-context-v1";

const CHANNEL_PATTERNS = [
  { id: "whatsapp", match: /whatsapp|wa\.me/i },
  { id: "linkedin", match: /linkedin/i },
  { id: "reddit", match: /reddit/i },
  { id: "organic_search", match: /google|bing|duckduckgo|search/i },
  { id: "direct", match: /^direct$|^\(direct\)$/i },
];

export function classifyAcquisitionLabel(label = "") {
  const text = String(label || "").trim();
  if (!text) return "unknown";
  for (const { id, match } of CHANNEL_PATTERNS) {
    if (match.test(text)) return id;
  }
  if (text.includes("ev_community") || text.includes("community")) {
    return "ev_communities";
  }
  return "other_referral";
}

/**
 * Call once on app load — stores channel hints for buffer events.
 */
export function captureAcquisitionContext() {
  if (typeof window === "undefined") return null;
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing);
  } catch {
    /* continue */
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") || "";
  const utmMedium = params.get("utm_medium") || "";
  let referrerHost = "";
  try {
    if (document.referrer) {
      referrerHost = new URL(document.referrer).hostname;
    }
  } catch {
    referrerHost = "";
  }

  const channel =
    classifyAcquisitionLabel(utmSource) !== "unknown"
      ? classifyAcquisitionLabel(utmSource)
      : classifyAcquisitionLabel(referrerHost) !== "unknown"
        ? classifyAcquisitionLabel(referrerHost)
        : referrerHost
          ? "other_referral"
          : "direct";

  const ctx = {
    channel,
    utmSource: utmSource.slice(0, 40),
    utmMedium: utmMedium.slice(0, 40),
    referrerHost: referrerHost.slice(0, 80),
    capturedAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* quota */
  }
  return ctx;
}

export function getAcquisitionContext() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function acquisitionMetaForBuffer() {
  const ctx = getAcquisitionContext();
  if (!ctx) return {};
  return {
    acquisitionChannel: ctx.channel,
    utmSource: ctx.utmSource || undefined,
    utmMedium: ctx.utmMedium || undefined,
  };
}
