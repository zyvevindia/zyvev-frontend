/**
 * Production runtime diagnostics for /admin/system-status.
 */

import { API_URL, API_URL_MISCONFIGURED_FOR_PROD, APP_CONFIG } from "../config";
import {
  CLOUDINARY_CLOUD_NAME,
  CATALOG_MEDIA_PREFIX,
} from "../config/media";
import {
  analyticsConfig,
  isGa4Configured,
  isPostHogConfigured,
  isSentryConfigured,
} from "../analytics/config";
import { getBuildMetadataSnapshot } from "./buildMetadata";
import { BEHAVIORAL_INTELLIGENCE_ENABLED, WHATSAPP_SALES_NUMBER } from "../config";
import { LAUNCH_PROFILE } from "../config/launchProfiles";
import { probeApiHealth, probeCloudinaryHealth } from "../launch/healthCheck";
import { isLikelyApiColdStart } from "./apiDiagnostics";
import { safeFetchJsonWithRetry } from "./safeFetch";
import { recordColdStartProbe } from "../ops/postLaunchMetrics.js";

export const API_HEALTH_LABELS = {
  green: "Healthy",
  yellow: "Degraded / cold start",
  red: "Unavailable",
};

/**
 * @returns {'green'|'yellow'|'red'}
 */
export function classifyApiHealthState(apiResult = {}) {
  if (!apiResult.ok) {
    if (
      isLikelyApiColdStart({
        error: apiResult.error,
        status: apiResult.status,
        durationMs: apiResult.latencyMs,
      })
    ) {
      return "yellow";
    }
    return "red";
  }
  const ms = apiResult.latencyMs ?? 0;
  if (ms >= 3500) return "yellow";
  return "green";
}

export function classifyCloudinaryHealthState(cloudinaryResult = {}) {
  if (!cloudinaryResult.ok) return "red";
  if (cloudinaryResult.broken > 0) return "yellow";
  return "green";
}

export function collectRuntimeEnvRows() {
  const env = import.meta.env;
  return [
    {
      key: "VITE_API_URL",
      value: env.VITE_API_URL || "(unset — using fallback)",
      resolved: API_URL,
      ok: !API_URL_MISCONFIGURED_FOR_PROD,
    },
    {
      key: "VITE_CLOUDINARY_CLOUD_NAME",
      value: env.VITE_CLOUDINARY_CLOUD_NAME || "(unset — default)",
      resolved: CLOUDINARY_CLOUD_NAME,
      ok:
        CLOUDINARY_CLOUD_NAME === "dznvmumze" ||
        Boolean(env.VITE_CLOUDINARY_CLOUD_NAME),
    },
    {
      key: "VITE_GA_ID",
      value: env.VITE_GA_ID ? "set" : "(unset)",
      resolved: isGa4Configured() ? "enabled" : "disabled",
      ok: true,
    },
    {
      key: "VITE_SENTRY_DSN",
      value: env.VITE_SENTRY_DSN ? "set" : "(unset)",
      resolved: isSentryConfigured() ? "enabled" : "disabled",
      ok: true,
    },
    {
      key: "VITE_ANALYTICS_ENABLED",
      value: String(env.VITE_ANALYTICS_ENABLED ?? "default"),
      resolved: analyticsConfig.analyticsEnabled ? "on" : "off",
      ok: true,
    },
    {
      key: "VITE_BEHAVIORAL_INTELLIGENCE",
      value: String(env.VITE_BEHAVIORAL_INTELLIGENCE ?? "false"),
      resolved: BEHAVIORAL_INTELLIGENCE_ENABLED ? "on" : "off",
      ok: true,
    },
    {
      key: "VITE_WHATSAPP_SALES_NUMBER",
      value: WHATSAPP_SALES_NUMBER ? "set" : "(unset)",
      resolved: WHATSAPP_SALES_NUMBER ? "configured" : "not configured",
      ok: true,
    },
    {
      key: "VITE_LAUNCH_PROFILE",
      value: LAUNCH_PROFILE || "(unset)",
      resolved: LAUNCH_PROFILE || "default",
      ok: true,
    },
  ];
}

export function collectDeploymentDiagnostics() {
  const build = getBuildMetadataSnapshot();
  return {
    environment: APP_CONFIG.environment,
    deploymentEnvironment: analyticsConfig.appEnv || import.meta.env.MODE,
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    appVersion: APP_CONFIG.version,
    releaseVersion: build.releaseVersion,
    commit: build.commit,
    builtAt: build.builtAt,
    builtAtFormatted: build.builtAtFormatted,
    apiUrl: API_URL,
    apiMisconfigured: API_URL_MISCONFIGURED_FOR_PROD,
    cloudinaryCloud: CLOUDINARY_CLOUD_NAME,
    cloudinaryPrefix: CATALOG_MEDIA_PREFIX,
    analytics: {
      enabled: analyticsConfig.analyticsEnabled,
      ga4: isGa4Configured(),
      posthog: isPostHogConfigured(),
      sentry: isSentryConfigured(),
      appEnv: analyticsConfig.appEnv,
      sentrySampleRate: analyticsConfig.sentryTracesSampleRate,
    },
  };
}

/** @deprecated Use collectDeploymentDiagnostics */
export const collectBuildInfo = collectDeploymentDiagnostics;

/**
 * Probe API + Cloudinary with retry-safe fetch.
 */
export async function runSystemHealthProbe(fetchImpl = globalThis.fetch) {
  const [api, cloudinary] = await Promise.all([
    probeApiHealth(fetchImpl),
    probeCloudinaryHealth(fetchImpl),
  ]);

  recordColdStartProbe({ latencyMs: api.latencyMs, ok: api.ok });

  const apiState = classifyApiHealthState(api);
  const cloudinaryState = classifyCloudinaryHealthState(cloudinary);

  return {
    api,
    apiState,
    apiStateLabel: API_HEALTH_LABELS[apiState],
    cloudinary,
    cloudinaryState,
    cloudinaryStateLabel: API_HEALTH_LABELS[cloudinaryState],
    likelyColdStart: isLikelyApiColdStart({
      error: api.error,
      status: api.status,
      durationMs: api.latencyMs,
    }),
    timeoutDetected:
      api.error === "request_timeout" ||
      (api.latencyMs != null && api.latencyMs >= 15000),
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Browser-friendly probe using safeFetchJsonWithRetry for catalog sample.
 */
export async function probeCatalogReachability() {
  return safeFetchJsonWithRetry(`${API_URL}/cars?limit=1`, {
    label: "system-status-catalog",
    timeoutMs: 20000,
  });
}
