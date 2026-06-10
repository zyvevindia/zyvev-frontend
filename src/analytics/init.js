import { analyticsConfig, isGtmConfigured } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { initGa4 } from "./providers/ga4";
import { initGtm } from "./providers/gtm";
import { initClarity } from "./providers/clarity";
import { initPostHog } from "./providers/posthog";

let booted = false;

export function initAnalytics() {
  if (typeof window === "undefined" || booted) {
    return;
  }

  booted = true;

  if (!analyticsConfig.analyticsEnabled) {
    return;
  }

  if (!hasAnalyticsConsent()) {
    return;
  }

  initGtm();

  if (isGtmConfigured()) {
    /* GA4 + Clarity tags are managed in GTM when container ID is set */
  } else {
    initGa4();
  }

  initClarity();
  void initPostHog();
}
