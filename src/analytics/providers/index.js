/**
 * Provider dispatcher — single fan-out point. Pages never call providers directly.
 */
import { ga4Event, ga4PageView } from "./ga4.js";
import { posthogCapture, posthogPageView } from "./posthog.js";
import { metaEvent } from "./meta.js";
import { linkedInEvent } from "./linkedin.js";
import { serverSideEvent } from "./serverSide.js";

/**
 * Dispatch custom event to all configured providers.
 * @param {string} eventName
 * @param {Record<string, unknown>} envelope
 */
export function dispatchAnalyticsEvent(eventName, envelope = {}) {
  ga4Event(eventName, envelope);
  posthogCapture(eventName, envelope);
  metaEvent(eventName, envelope);
  linkedInEvent(eventName, envelope);
  serverSideEvent(eventName, envelope);
}

/**
 * Dispatch SPA page view once (no duplicate gtag + trackAnalytics).
 * @param {string} path
 * @param {string} title
 * @param {Record<string, unknown>} envelope
 */
export function dispatchPageView(path, title, envelope = {}) {
  ga4PageView(path, title);
  posthogPageView(path);
  posthogCapture("page_view", {
    page_path: path,
    page_title: title,
    ...envelope,
  });
  serverSideEvent("page_view", {
    event_name: "page_view",
    page_path: path,
    page_title: title,
    ...envelope,
  });
}
