/**
 * Unified operational timeline for a lead.
 */

import { labelForStatus } from "../crm/leadPipeline";
import { AUDIT_ACTIONS } from "../services/opsAuditLog";

const STAGE_ORDER = [
  "created",
  "assigned",
  "contacted",
  "follow_up",
  "converted",
  "lost",
];

function auditActionLabel(action) {
  const map = {
    [AUDIT_ACTIONS.LEAD_ASSIGNED]: "Assignment updated",
    [AUDIT_ACTIONS.LEAD_READ_ADMIN]: "Read by admin",
    [AUDIT_ACTIONS.LEAD_READ_DEALER]: "Read by dealer",
    [AUDIT_ACTIONS.LEAD_READ_ALL_DEALER]: "All leads read (dealer)",
    [AUDIT_ACTIONS.LEAD_STATUS_CHANGED]: "Status changed",
    [AUDIT_ACTIONS.WHATSAPP_INTENT]: "WhatsApp intent",
    [AUDIT_ACTIONS.DEALER_OVERRIDE]: "Dealer override",
    [AUDIT_ACTIONS.ADMIN_OVERRIDE]: "Admin override",
    [AUDIT_ACTIONS.BULK_LEAD_ASSIGN]: "Bulk assignment",
    [AUDIT_ACTIONS.BULK_LEAD_READ]: "Bulk read",
    [AUDIT_ACTIONS.BULK_STATUS_UPDATE]: "Bulk status update",
  };
  return map[action] || action;
}

/**
 * @param {object} lead
 * @param {Array<object>} [auditEntries]
 */
export function buildLeadTimeline(lead, auditEntries = []) {
  if (!lead) return [];

  const events = [];

  if (lead.createdAt) {
    events.push({
      stage: "created",
      label: "Lead created",
      at: lead.createdAt,
      detail: lead.leadSource
        ? `Source: ${lead.leadSource}`
        : undefined,
      source: "system",
    });
  }

  if (
    lead.leadSource === "whatsapp" ||
    lead.leadMetadata?.whatsappIntent
  ) {
    events.push({
      stage: "contacted",
      label: "WhatsApp intent",
      at:
        lead.leadMetadata?.whatsappAt ||
        lead.updatedAt ||
        lead.createdAt,
      detail: lead.sourcePage
        ? `From ${lead.sourcePage}`
        : "WhatsApp CTA",
      source: "whatsapp",
    });
  }

  if (lead.assignedAt || lead.dealer || lead.assignedTo) {
    events.push({
      stage: "assigned",
      label: "Assigned",
      at: lead.assignedAt || lead.updatedAt || lead.createdAt,
      detail: [
        lead.dealer?.name && `Dealer: ${lead.dealer.name}`,
        lead.assignedTo?.name && `Sales: ${lead.assignedTo.name}`,
        lead.assignedDealer && `Desk: ${lead.assignedDealer}`,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      source: "assignment",
    });
  }

  const history = Array.isArray(lead.statusHistory)
    ? lead.statusHistory
    : [];

  for (const h of history) {
    const key =
      h.status === "follow-up" || h.status === "followup"
        ? "follow_up"
        : h.status;
    let stage = key;
    if (key === "won" || key === "converted") stage = "converted";
    if (key === "lost") stage = "lost";
    if (key === "contacted") stage = "contacted";
    if (key === "follow_up") stage = "follow_up";

    events.push({
      stage,
      label: labelForStatus(h.status),
      at: h.at,
      detail: h.changedByDealer?.name
        ? `By dealer ${h.changedByDealer.name}`
        : h.changedBy?.name
          ? `By ${h.changedBy.name}`
          : undefined,
      source: "status_history",
    });
  }

  if (!history.length && lead.status && lead.status !== "new") {
    const s = lead.status === "converted" ? "converted" : lead.status;
    events.push({
      stage: s === "won" ? "converted" : s,
      label: labelForStatus(lead.status),
      at: lead.updatedAt || lead.createdAt,
      source: "status",
    });
  }

  if (lead.firstRespondedAt) {
    events.push({
      stage: "contacted",
      label: "Dealer first response",
      at: lead.firstRespondedAt,
      detail: "Response timestamp recorded",
      source: "response",
    });
  }

  if (Array.isArray(lead.notes)) {
    for (const n of lead.notes) {
      events.push({
        stage: "follow_up",
        label: "Note added",
        at: n.createdAt,
        detail: n.text,
        source: "note",
      });
    }
  }

  for (const a of auditEntries) {
    if (a.targetId !== lead._id && a.metadata?.leadId !== lead._id) {
      continue;
    }
    const meta = a.metadata || {};
    const label = auditActionLabel(a.action);
    let stage = "contacted";

    if (a.action === AUDIT_ACTIONS.LEAD_ASSIGNED) {
      stage = "assigned";
    } else if (a.action === AUDIT_ACTIONS.WHATSAPP_INTENT) {
      stage = "contacted";
    } else if (
      a.action === AUDIT_ACTIONS.DEALER_OVERRIDE ||
      a.action === AUDIT_ACTIONS.ADMIN_OVERRIDE
    ) {
      stage = "follow_up";
    } else if (a.action === AUDIT_ACTIONS.LEAD_STATUS_CHANGED) {
      stage =
        meta.status === "won" || meta.status === "converted"
          ? "converted"
          : meta.status === "lost"
            ? "lost"
            : meta.status === "follow_up"
              ? "follow_up"
              : "contacted";
    }

    events.push({
      stage,
      label:
        a.action === AUDIT_ACTIONS.LEAD_STATUS_CHANGED && meta.status
          ? `Status → ${labelForStatus(meta.status)}`
          : label,
      at: a.at,
      detail:
        meta.summary ||
        a.actorLabel ||
        (meta.sourcePage ? `Page: ${meta.sourcePage}` : undefined),
      source: "audit",
    });
  }

  events.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return ta - tb;
  });

  const deduped = [];
  const seen = new Set();
  for (const e of events) {
    const key = `${e.stage}-${e.at}-${e.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  return deduped;
}

export function timelineStageIndex(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : 0;
}

export function hoursSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round((ms / 3600000) * 10) / 10;
}

/**
 * @param {Array<object>} events
 */
export function timelineToCsvRows(events) {
  return events.map((e) => ({
    stage: e.stage,
    label: e.label,
    at: e.at || "",
    detail: e.detail || "",
    source: e.source || "",
  }));
}
