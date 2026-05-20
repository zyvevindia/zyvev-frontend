import { useEffect } from "react";

import { initAnalytics } from "../analytics/init";
import { initWebVitals } from "../analytics/webVitals";
import { initSentry } from "../monitoring/sentry";

/**
 * One-time production observability bootstrap (analytics + vitals + Sentry).
 */
export default function AnalyticsBootstrap() {
  useEffect(() => {
    initSentry();
    initAnalytics();
    initWebVitals();
  }, []);

  return null;
}
