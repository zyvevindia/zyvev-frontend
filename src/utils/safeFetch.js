/**
 * Graceful JSON fetch — returns structured result instead of throwing.
 */

import { devWarn } from "../launch/devDiagnostics";

/**
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number; fallback?: unknown; label?: string }} [options]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown; error: string | null }>}
 */
export async function safeFetchJson(url, options = {}) {
  const {
    timeoutMs = 15000,
    fallback = null,
    label = url,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!res.ok) {
      devWarn(`API ${label}: HTTP ${res.status}`);
      return {
        ok: false,
        status: res.status,
        data: fallback,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    const message =
      err?.name === "AbortError"
        ? "request_timeout"
        : err?.message || "network_error";
    devWarn(`API ${label} failed:`, message);
    return {
      ok: false,
      status: 0,
      data: fallback,
      error: message,
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
    first.status === 0;

  if (!retryable) return first;

  return safeFetchJson(url, {
    ...options,
    timeoutMs: options.timeoutMs ?? 15000,
    label: `${options.label || url} (retry)`,
  });
}
