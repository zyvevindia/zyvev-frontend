import { analyticsConfig, isSentryConfigured } from "../analytics/config";

let initialized = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-evsavari-sentry="${src}"]`
    );

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.evsavariSentry = src;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("sentry_script_failed"));
    document.head.appendChild(script);
  });
}

export async function initSentry() {
  if (
    typeof window === "undefined" ||
    initialized ||
    !isSentryConfigured()
  ) {
    return;
  }

  initialized = true;

  try {
    await loadScript(
      "https://browser.sentry-cdn.com/8.55.0/bundle.tracing.replay.min.js"
    );

    if (!window.Sentry?.init) {
      return;
    }

    window.Sentry.init({
      dsn: analyticsConfig.sentryDsn,
      environment: analyticsConfig.appEnv,
      release: import.meta.env.VITE_APP_RELEASE || undefined,
      enabled:
        analyticsConfig.isProd ||
        analyticsConfig.appEnv === "staging",
      tracesSampleRate: analyticsConfig.sentryTracesSampleRate,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  } catch (err) {
    if (analyticsConfig.debug) {
      console.warn("[sentry] init skipped", err?.message);
    }
  }
}

export function captureException(error, context = {}) {
  if (window.Sentry?.captureException) {
    window.Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message, level = "info") {
  if (window.Sentry?.captureMessage) {
    window.Sentry.captureMessage(message, level);
  }
}
