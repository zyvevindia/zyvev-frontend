import { analyticsConfig } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { initGa4 } from "./providers/ga4";
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

  initGa4();
  void initPostHog();
}
