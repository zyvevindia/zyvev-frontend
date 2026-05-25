/**
 * Graceful JSON fetch — returns structured result instead of throwing.
 */

import { logApiRequest } from "./apiDiagnostics.js";
import { logSlowApiRequest } from "./routePerformance.js";
import { devWarn } from "../launch/devDiagnostics.js";
import {
  isSilentTelemetryUrl,
  postTelemetrySilently,
} from "./telemetryClient.js";

/**
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number; fallback?: unknown; label?: string }} [options]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown; error: string | null; durationMs: number }>}
 */
export async function safeFetchJson(url, options = {}) {
  const {
    timeoutMs = 15000,
    fallback = null,
    label = url,
    silent = isSilentTelemetryUrl(url),
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    const durationMs = Date.now() - started;

    if (!res.ok) {
      if (!silent) {
        devWarn(`API ${label}: HTTP ${res.status}`);
      }
      logApiRequest({
        label,
        url,
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        durationMs,
        silent,
      });
      return {
        ok: false,
        status: res.status,
        data: fallback,
        error: `HTTP ${res.status}`,
        durationMs,
      };
    }

    const data = await res.json();
    logApiRequest({
      label,
      url,
      ok: true,
      status: res.status,
      error: null,
      durationMs,
    });
    logSlowApiRequest(label, durationMs);
    return {
      ok: true,
      status: res.status,
      data,
      error: null,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const message =
      err?.name === "AbortError"
        ? "request_timeout"
        : err?.message || "network_error";
    if (!silent) {
      devWarn(`API ${label} failed:`, message);
    }
    logApiRequest({
      label,
      url,
      ok: false,
      status: 0,
      error: message,
      durationMs,
      silent,
    });
    return {
      ok: false,
      status: 0,
      data: fallback,
      error: message,
      durationMs,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One retry on timeout/network — production-safe catalog loads.
 */
export async function safeFetchJsonWithRetry(url, options = {}) {
  const first = await safeFetchJson(url, options);
  if (first.ok) return first;

  const retryable =
    first.error === "request_timeout" ||
    first.error === "network_error" ||
    first.status === 0 ||
    first.status === 503 ||
    first.status === 502;

  if (!retryable) return first;

  return safeFetchJson(url, {
    ...options,
    timeoutMs: Math.max(options.timeoutMs ?? 15000, 20000),
    label: `${options.label || "api"} (retry)`,
  });
}

/**
 * Fire-and-forget POST/GET — never throws; logs failures only.
 */
export async function safeFetchFireAndForget(url, options = {}) {
  if (isSilentTelemetryUrl(url) || options.silent) {
    await postTelemetrySilently(url, options);
    return;
  }
  try {
    await safeFetchJson(url, {
      ...options,
      timeoutMs: options.timeoutMs ?? 8000,
      silent: options.silent ?? false,
    });
  } catch {
    /* safeFetchJson does not throw */
  }
}
