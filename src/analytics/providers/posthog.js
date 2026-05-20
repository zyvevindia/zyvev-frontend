import { analyticsConfig, isPostHogConfigured } from "../config";

let initialized = false;

/**
 * PostHog via official snippet (no npm dependency).
 */
export function initPostHog() {
  if (
    typeof window === "undefined" ||
    !isPostHogConfigured() ||
    initialized
  ) {
    return;
  }

  initialized = true;

  if (window.__EVSAVARI_POSTHOG_INIT__) {
    return;
  }

  window.__EVSAVARI_POSTHOG_INIT__ = true;

  const key = analyticsConfig.posthogKey;
  const host = analyticsConfig.posthogHost;

  const script = document.createElement("script");
  script.async = true;
  script.src = `${host}/static/array.js`;
  document.head.appendChild(script);

  window.posthog =
    window.posthog ||
    function posthogStub() {
      (window.posthog.q = window.posthog.q || []).push(
        arguments
      );
    };

  window.posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  });
}

export function posthogCapture(eventName, properties = {}) {
  if (!window.posthog?.capture || !isPostHogConfigured()) {
    return;
  }

  window.posthog.capture(eventName, properties);
}

export function posthogPageView(path) {
  if (!window.posthog?.capture || !isPostHogConfigured()) {
    return;
  }

  window.posthog.capture("$pageview", {
    $current_url: `${window.location.origin}${path}`,
  });
}
