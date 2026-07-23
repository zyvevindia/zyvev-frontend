/**
 * Analytics session — reuses anonymous session ID (no PII).
 */
import { getAnonymousSessionId } from "../event-tracking/session.js";

export function getAnalyticsSessionId() {
  return getAnonymousSessionId();
}
