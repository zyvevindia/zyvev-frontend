/**
 * Persistent ops audit API client.
 */

import { API_URL } from "../config";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * @param {object} opts
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 * @param {string} [opts.targetId]
 * @param {string} [opts.action]
 * @param {string} [opts.targetType]
 * @param {number} [opts.days]
 * @param {string} [opts.from]
 * @param {string} [opts.to]
 */
export async function fetchOpsAuditPage(opts = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      entries: [],
      total: 0,
      page: 1,
      totalPages: 1,
      retentionDays: 180,
    };
  }

  const qs = new URLSearchParams();
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));
  if (opts.targetId) qs.set("targetId", opts.targetId);
  if (opts.action) qs.set("action", opts.action);
  if (opts.targetType) qs.set("targetType", opts.targetType);
  if (opts.days) qs.set("days", String(opts.days));
  if (opts.from) qs.set("from", opts.from);
  if (opts.to) qs.set("to", opts.to);

  try {
    const res = await fetch(
      `${API_URL}/api/admin/ops-audit?${qs}`,
      { headers: authHeaders(token) }
    );
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

/**
 * @param {object} entry
 */
export async function postOpsAuditEntry(entry) {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/admin/ops-audit`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(entry),
      keepalive: true,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.entry || data;
  } catch {
    return null;
  }
}
