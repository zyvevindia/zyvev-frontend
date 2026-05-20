import { analyticsConfig } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { shouldEmitEvent } from "./dedupe";
import { ga4Event, ga4PageView } from "./providers/ga4";
import {
  posthogCapture,
  posthogPageView,
} from "./providers/posthog";

function sanitizeProps(props = {}) {
  const clean = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) {
      continue;
    }

    const lower = key.toLowerCase();

    if (
      lower.includes("email") ||
      lower.includes("phone") ||
      lower === "name"
    ) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value
        .slice(0, 12)
        .map((v) => String(v).slice(0, 80));
    }
  }

  return clean;
}

/**
 * Central analytics track — fans out to GA4 + PostHog when configured.
 */
export function trackAnalytics(
  eventName,
  properties = {},
  options = {}
) {
  if (
    typeof window === "undefined" ||
    !analyticsConfig.analyticsEnabled ||
    !hasAnalyticsConsent()
  ) {
    return;
  }

  const dedupeKey =
    options.dedupeKey ||
    `${properties.source_page || ""}:${properties.family_slug || ""}`;

  if (
    options.dedupe !== false &&
    !shouldEmitEvent(eventName, dedupeKey)
  ) {
    return;
  }

  const props = sanitizeProps({
    app_env: analyticsConfig.appEnv,
    ...properties,
  });

  if (analyticsConfig.debug) {
    console.info("[analytics]", eventName, props);
  }

  ga4Event(eventName, props);
  posthogCapture(eventName, props);
}

export function trackPageView(path, title = "") {
  if (
    typeof window === "undefined" ||
    !analyticsConfig.analyticsEnabled ||
    !hasAnalyticsConsent()
  ) {
    return;
  }

  const pagePath = path || window.location.pathname;

  if (!shouldEmitEvent("page_view", pagePath)) {
    return;
  }

  ga4PageView(pagePath, title);
  posthogPageView(pagePath);
  trackAnalytics(
    "page_view",
    {
      page_path: pagePath,
      page_title: title || document.title,
    },
    { dedupe: false }
  );
}
