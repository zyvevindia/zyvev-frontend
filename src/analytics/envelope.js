/**
 * Standard analytics event envelope — every event carries the same core fields.
 */
import { analyticsConfig } from "./config.js";
import { getAnalyticsSessionId } from "./session.js";

/**
 * @param {object} options
 * @param {string} options.eventName
 * @param {string} [options.category]
 * @param {Record<string, unknown>} [options.properties]
 * @param {string} [options.pagePath]
 */
export function buildEventEnvelope({
  eventName,
  category = "engagement",
  properties = {},
  pagePath,
} = {}) {
  const path =
    pagePath ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  return {
    event_name: eventName,
    event_category: category,
    timestamp: new Date().toISOString(),
    page_path: path,
    page_url:
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path,
    session_id: getAnalyticsSessionId(),
    app_env: analyticsConfig.appEnv,
    /** Reserved for Sprint 5+ dealer context — never PII */
    dealer_context: null,
    /** Reserved for campaign UTM capture — populated when present */
    campaign_context: readCampaignContext(),
    ...properties,
  };
}

function readCampaignContext() {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = params.get(key);
      if (val) utm[key] = val.slice(0, 120);
    }
    return Object.keys(utm).length ? utm : null;
  } catch {
    return null;
  }
}
