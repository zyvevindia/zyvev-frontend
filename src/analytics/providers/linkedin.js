/**
 * LinkedIn Insight Tag — future provider stub.
 * Activated only when VITE_LINKEDIN_PARTNER_ID is set.
 */
import { analyticsConfig, isLinkedInConfigured } from "../config.js";

let initialized = false;

export function initLinkedInInsight() {
  if (typeof window === "undefined" || !isLinkedInConfigured() || initialized) {
    return;
  }

  if (window.__EVSAVARI_LINKEDIN_INIT__) {
    initialized = true;
    return;
  }

  window.__EVSAVARI_LINKEDIN_INIT__ = true;
  initialized = true;

  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(analyticsConfig.linkedinPartnerId);

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  document.head.appendChild(script);

  if (analyticsConfig.debug) {
    console.info("[analytics] LinkedIn Insight initialized");
  }
}

export function linkedInEvent(_eventName, _params = {}) {
  /* LinkedIn Insight Tag does not support arbitrary custom events via JS API.
   * Conversion rules are configured in Campaign Manager. Stub for symmetry. */
  if (!isLinkedInConfigured()) return;
}
