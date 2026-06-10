import { analyticsConfig, isClarityConfigured } from "../config";

let initialized = false;

/**
 * Microsoft Clarity — session replay, heatmaps, scroll/dead-click signals.
 * Load directly when VITE_CLARITY_ID is set (can also be deployed via GTM).
 */
export function initClarity() {
  if (
    typeof window === "undefined" ||
    !isClarityConfigured() ||
    initialized
  ) {
    return;
  }

  if (window.__EVSAVARI_CLARITY_INIT__) {
    initialized = true;
    return;
  }

  window.__EVSAVARI_CLARITY_INIT__ = true;
  initialized = true;

  const clarityId = analyticsConfig.clarityId;

  (function clarityBootstrap(c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function clarityQueue(...args) {
        (c[a].q = c[a].q || []).push(args);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = `https://www.clarity.ms/tag/${i}`;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", clarityId);

  if (analyticsConfig.debug) {
    console.info("[analytics] Clarity initialized", clarityId);
  }
}
