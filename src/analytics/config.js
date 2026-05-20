/**
 * Analytics configuration — environment-aware, no PII in defaults.
 */

const GA_ID = String(import.meta.env.VITE_GA_ID || "").trim();

const POSTHOG_KEY = String(
  import.meta.env.VITE_POSTHOG_KEY || ""
).trim();

const POSTHOG_HOST = String(
  import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"
).trim().replace(/\/$/, "");

const SENTRY_DSN = String(
  import.meta.env.VITE_SENTRY_DSN || ""
).trim();

const APP_ENV =
  import.meta.env.VITE_APP_ENV ||
  import.meta.env.MODE ||
  "development";

const IS_PROD = import.meta.env.PROD;

const ANALYTICS_ENABLED =
  import.meta.env.VITE_ANALYTICS_ENABLED !== "false";

const REQUIRE_CONSENT =
  import.meta.env.VITE_ANALYTICS_REQUIRE_CONSENT === "true";

const SAMPLE_RATE = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1
);

export const analyticsConfig = {
  gaId: GA_ID,
  posthogKey: POSTHOG_KEY,
  posthogHost: POSTHOG_HOST,
  sentryDsn: SENTRY_DSN,
  appEnv: APP_ENV,
  isProd: IS_PROD,
  analyticsEnabled: ANALYTICS_ENABLED,
  requireConsent: REQUIRE_CONSENT,
  sentryTracesSampleRate: Number.isFinite(SAMPLE_RATE)
    ? Math.min(Math.max(SAMPLE_RATE, 0), 1)
    : 0.1,
  debug: import.meta.env.VITE_ANALYTICS_DEBUG === "true",
};

export function isGa4Configured() {
  return Boolean(analyticsConfig.gaId);
}

export function isPostHogConfigured() {
  return Boolean(analyticsConfig.posthogKey);
}

export function isSentryConfigured() {
  return Boolean(analyticsConfig.sentryDsn);
}
