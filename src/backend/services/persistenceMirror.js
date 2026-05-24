/**
 * Additive dual-write from usageLearningBuffer → Supabase.
 * Compare events, trust feedback, and leads only.
 */

import { isBackendPersistenceConfigured } from "../config.js";
import { insertCompareEvent } from "./compareEventService.js";
import { insertTrustFeedback } from "./trustFeedbackService.js";
import { insertLead } from "./leadService.js";
import { touchSession } from "./sessionService.js";

const COMPARE_EVENT_TYPES = new Set([
  "compare_started",
  "compare_completed",
  "compare_abandoned",
  "compare_switch_after_doubt",
  "compare_confidence_expanded",
  "compare_abandon_after_guidance",
  "multi_session_compare",
  "high_bounce_compare",
  "weak_conversion_compare",
  "compare_slow",
]);

const TRUST_FEEDBACK_TYPES = new Set([
  "recommendation_doubted",
  "trust_tooltip_opened",
  "ownership_tooltip_opened",
  "charging_practicality_opened",
]);

const LEAD_EVENT_TYPES = new Set([
  "lead_started",
  "lead_submitted",
  "lead_form_abandoned",
  "lead_abandoned",
]);

function pairSlugFromMeta(meta = {}) {
  return meta.pairSlug || meta.pair_slug || null;
}

function vehicleSlugsFromMeta(meta = {}) {
  if (Array.isArray(meta.vehicleSlugs)) return meta.vehicleSlugs;
  if (meta.familySlug) return [meta.familySlug];
  return [];
}

/**
 * @param {{ type: string; sessionId?: string; meta?: object; at?: string }} row
 */
export async function persistUsageLearningEvent(row) {
  if (!isBackendPersistenceConfigured()) {
    return { ok: true, skipped: true, reason: "not_configured" };
  }

  const type = String(row.type || "unknown");
  const sessionKey = row.sessionId || null;
  const meta = row.meta && typeof row.meta === "object" ? row.meta : {};

  if (sessionKey) {
    await touchSession({
      sessionKey,
      source: meta.sourcePage || "buffer",
      metadata: { lastEventType: type },
    });
  }

  if (COMPARE_EVENT_TYPES.has(type)) {
    return insertCompareEvent({
      eventType: type,
      sessionKey,
      pairSlug: pairSlugFromMeta(meta),
      vehicleSlugs: vehicleSlugsFromMeta(meta),
      payload: { ...meta, bufferedAt: row.at },
    });
  }

  if (TRUST_FEEDBACK_TYPES.has(type)) {
    return insertTrustFeedback({
      feedbackType: type,
      sessionKey,
      pairSlug: pairSlugFromMeta(meta),
      severity: type === "recommendation_doubted" ? "medium" : "low",
      payload: { ...meta, bufferedAt: row.at },
    });
  }

  if (LEAD_EVENT_TYPES.has(type)) {
    const confidence =
      type === "lead_submitted"
        ? "high"
        : type === "lead_started"
          ? "medium"
          : "low";

    return insertLead({
      sessionKey,
      sourcePage: meta.sourcePage || meta.source_page || null,
      pairSlug: pairSlugFromMeta(meta),
      vehicleSlugs: vehicleSlugsFromMeta(meta),
      confidence,
      payload: { eventType: type, ...meta, bufferedAt: row.at },
    });
  }

  return { ok: true, skipped: true, reason: "event_type_not_persisted" };
}

/**
 * Fire-and-forget mirror — never throws to callers.
 * @param {{ type: string; sessionId?: string; meta?: object; at?: string }} row
 */
export function mirrorUsageLearningEvent(row) {
  if (!isBackendPersistenceConfigured()) return;

  void persistUsageLearningEvent(row).catch(() => {
    /* operational-safe: local buffer remains source of truth */
  });
}
