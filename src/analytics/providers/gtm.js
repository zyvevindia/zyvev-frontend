import { analyticsConfig, isGtmConfigured } from "../config";

let initialized = false;

/**
 * Ensure dataLayer exists for GTM + event forwarding.
 */
export function ensureDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

/**
 * Push a structured object to GTM dataLayer.
 * @param {Record<string, unknown>} payload
 */
export function pushDataLayer(payload = {}) {
  if (typeof window === "undefined") return;
  ensureDataLayer();
  window.dataLayer.push(payload);
}

/**
 * Load Google Tag Manager container (central tag layer).
 */
export function initGtm() {
  if (
    typeof window === "undefined" ||
    !isGtmConfigured() ||
    initialized
  ) {
    return;
  }

  if (window.__EVSAVARI_GTM_INIT__) {
    initialized = true;
    return;
  }

  window.__EVSAVARI_GTM_INIT__ = true;
  initialized = true;
  ensureDataLayer();

  const gtmId = analyticsConfig.gtmId;

  pushDataLayer({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);

  if (analyticsConfig.debug) {
    console.info("[analytics] GTM initialized", gtmId);
  }
}

/**
 * Forward analytics event through GTM dataLayer.
 * @param {string} eventName
 * @param {Record<string, unknown>} params
 */
export function gtmEvent(eventName, params = {}) {
  if (!isGtmConfigured()) return;
  pushDataLayer({
    event: eventName,
    ...params,
  });
}
