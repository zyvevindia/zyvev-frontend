/**
 * Legacy analytics exports — delegates to centralized analytics layer.
 */

import { trackPageView as trackPageViewCentral } from "../analytics/track";
import { trackAnalytics } from "../analytics/track";
import { ANALYTICS_EVENTS } from "../analytics/events";

export const trackPageView = trackPageViewCentral;

export function trackEvent(action, category, label = "", value = 0) {
  trackAnalytics(action, {
    event_category: category,
    event_label: String(label || "").slice(0, 120),
    value: Number(value) || 0,
  });
}

export function trackLead(carName) {
  trackAnalytics(ANALYTICS_EVENTS.LEAD_SUBMITTED, {
    vehicle_name: String(carName || "").slice(0, 80),
    form_type: "legacy_lead",
  });
}

export function trackCompare(compareCount) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_COMPLETED, {
    compare_depth: compareCount,
    source_page: "legacy",
  });
}

export function trackCarView(carName) {
  trackAnalytics(ANALYTICS_EVENTS.EV_VIEWED, {
    vehicle_name: String(carName || "").slice(0, 80),
  });
}
