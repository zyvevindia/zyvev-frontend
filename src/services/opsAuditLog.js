/**
 * Operational audit log — server-first with local fallback buffer.
 */

import { fetchOpsAuditPage, postOpsAuditEntry } from "./opsAuditApi";

const STORAGE_KEY = "evsavari-ops-audit-v1";
const MAX_LOCAL = 200;

export const AUDIT_ACTIONS = {
  DEALER_APPLICATION_REVIEW: "dealer_application_review",
  LEAD_ASSIGNED: "lead_assigned",
  LEAD_STATUS_CHANGED: "lead_status_changed",
  LEAD_READ_ADMIN: "lead_read_admin",
  LEAD_READ_DEALER: "lead_read_dealer",
  LEAD_READ_ALL_DEALER: "lead_read_all_dealer",
  DEALER_OVERRIDE: "dealer_override",
  ADMIN_OVERRIDE: "admin_override",
  WHATSAPP_INTENT: "whatsapp_intent",
  BULK_LEAD_READ: "bulk_lead_read",
  BULK_LEAD_ASSIGN: "bulk_lead_assign",
  BULK_STATUS_UPDATE: "bulk_status_update",
};

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_LOCAL))
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {object} entry
 */
export function logOpsAudit(entry) {
  const row = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    action: entry.action,
    actorRole: entry.actorRole || "admin",
    actorId: entry.actorId || "",
    actorLabel: entry.actorLabel || "",
    targetType: entry.targetType || "",
    targetId: entry.targetId || "",
    metadata: entry.metadata || {},
  };

  const prev = readLocal();
  writeLocal([row, ...prev]);

  postOpsAuditEntry({
    id: row.id,
    ...row,
  }).catch(() => {
    /* non-blocking */
  });

  return row;
}

/**
 * @param {object} [opts]
 */
export async function fetchOpsAuditLog(opts = {}) {
  const {
    limit = 50,
    page = 1,
    targetId,
    action,
    days,
    from,
    to,
  } = opts;

  const remote = await fetchOpsAuditPage({
    page,
    limit,
    targetId,
    action,
    days,
    from,
    to,
  });

  if (remote?.entries?.length) {
    return remote.entries;
  }

  if (remote && Array.isArray(remote.entries)) {
    return [];
  }

  const local = readLocal();
  let filtered = local;

  if (targetId) {
    filtered = local.filter(
      (r) =>
        r.targetId === targetId ||
        r.metadata?.leadId === targetId
    );
  }
  if (action) {
    filtered = filtered.filter((r) => r.action === action);
  }

  return filtered.slice(0, limit);
}

/**
 * Paginated fetch for admin audit panel.
 */
export async function fetchOpsAuditPaginated(opts = {}) {
  const remote = await fetchOpsAuditPage(opts);
  if (remote) {
    return remote;
  }

  const entries = await fetchOpsAuditLog(opts);
  return {
    entries,
    total: entries.length,
    page: 1,
    totalPages: 1,
    limit: opts.limit || 50,
    retentionDays: 180,
    source: "local",
  };
}

export function getLocalOpsAudit() {
  return readLocal();
}
