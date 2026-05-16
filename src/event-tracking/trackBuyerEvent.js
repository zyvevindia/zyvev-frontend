import { API_URL } from "../config";

import { BEHAVIORAL_INTELLIGENCE_ENABLED } from "../config";

import { getAnonymousSessionId } from "./session";

import { appendJourneyStep } from "../buyer-intelligence/journeyBuffer";

const queue = [];
let flushTimer = null;

/**
 * Track anonymous buyer behavior event.
 * @param {string} eventType
 * @param {object} [payload]
 */
export function trackBuyerEvent(eventType, payload = {}) {
  if (!BEHAVIORAL_INTELLIGENCE_ENABLED) return;

  const sessionId = getAnonymousSessionId();
  if (!sessionId) return;

  const event = {
    eventType,
    sessionId,
    timestamp: new Date().toISOString(),
    payload: sanitizeClientPayload(payload),
  };

  appendJourneyStep({
    type: eventType,
    ...payload,
  });

  queue.push(event);
  scheduleFlush();
}

function sanitizeClientPayload(payload) {
  const allowed = {};
  const keys = [
    "vehicles",
    "vehicleSlugs",
    "sourcePage",
    "sessionIntent",
    "compareDepth",
    "seoPageSlug",
    "targetSlug",
    "panel",
    "scenarioKey",
    "journeyStep",
    "metadata",
    "pageType",
    "discoveryPath",
    "ctaType",
    "citySlug",
    "compareSlug",
    "intent",
  ];

  for (const key of keys) {
    if (payload[key] !== undefined) {
      allowed[key] = payload[key];
    }
  }

  return allowed;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushQueue, 1500);
}

async function flushQueue() {
  flushTimer = null;
  if (!queue.length) return;

  const batch = queue.splice(0, 20);

  try {
    await fetch(`${API_URL}/api/behavioral/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
  }

  if (queue.length) scheduleFlush();
}

export function getAnonymousSessionIdForLead() {
  return getAnonymousSessionId();
}
