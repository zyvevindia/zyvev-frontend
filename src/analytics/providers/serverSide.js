/**
 * Server-side analytics queue — future provider stub.
 * When VITE_ANALYTICS_SERVER_ENDPOINT is set, batches anonymized events.
 */
import { analyticsConfig, isServerSideAnalyticsConfigured } from "../config.js";
import { postTelemetrySilently } from "../../utils/telemetryClient.js";

const queue = [];
let flushTimer = null;

export function serverSideEvent(_eventName, envelope = {}) {
  if (!isServerSideAnalyticsConfigured()) return;

  queue.push({
    name: envelope.event_name,
    category: envelope.event_category,
    timestamp: envelope.timestamp,
    page_path: envelope.page_path,
    session_id: envelope.session_id,
    parameters: stripEnvelopeCore(envelope),
  });

  scheduleFlush();
}

function stripEnvelopeCore(envelope) {
  const {
    event_name: _n,
    event_category: _c,
    timestamp: _t,
    page_path: _p,
    session_id: _s,
    ...rest
  } = envelope;
  return rest;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushQueue, 2000);
}

async function flushQueue() {
  flushTimer = null;
  if (!queue.length) return;

  const batch = queue.splice(0, 25);
  const endpoint = analyticsConfig.serverEndpoint;

  await postTelemetrySilently(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: batch, source: "evsavari_web" }),
    label: "analytics_server_side",
  });

  if (queue.length) scheduleFlush();
}
