/**
 * Fetch paginated admin data for CSV export.
 */

import { API_URL } from "../config";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * @param {string} token
 * @param {object} [opts]
 */
export async function fetchAllAdminLeads(token, opts = {}) {
  const { maxPages = 20, filter, dealerId, days } = opts;
  const all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const qs = new URLSearchParams({
      page: String(page),
      limit: "50",
    });
    if (filter) qs.set("filter", filter);

    const res = await fetch(
      `${API_URL}/api/admin/leads?${qs}`,
      { headers: authHeaders(token) }
    );
    if (!res.ok) break;
    const data = await res.json();
    let batch = data.leads || [];

    if (dealerId) {
      batch = batch.filter(
        (l) =>
          l.dealer?._id === dealerId ||
          l.dealer === dealerId
      );
    }

    if (days && Number(days) > 0) {
      const from = Date.now() - Number(days) * 86400000;
      batch = batch.filter(
        (l) => l.createdAt && new Date(l.createdAt).getTime() >= from
      );
    }

    all.push(...batch);
    totalPages = data.totalPages || 1;
    page += 1;
  }

  return all;
}

/**
 * Server CSV export with date filter.
 * @param {string} token
 * @param {object} [opts]
 */
export async function downloadServerLeadsExport(token, opts = {}) {
  const { days, carId } = opts;
  const qs = new URLSearchParams();
  if (days) qs.set("days", String(days));
  if (carId) qs.set("carId", carId);

  const res = await fetch(
    `${API_URL}/api/admin/export-leads?${qs}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) return false;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-export-${days || "all"}d.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * @param {string} token
 * @param {string} dealerId
 */
export async function fetchDealerLeadsForExport(token, dealerId) {
  const leads = await fetchAllAdminLeads(token, {
    maxPages: 30,
    dealerId,
  });
  return leads;
}

/**
 * @param {string} token
 * @param {string} [status]
 */
export async function fetchDealerApplicationsForExport(token, status = "") {
  const qs = status ? `?status=${status}` : "";
  const res = await fetch(
    `${API_URL}/api/admin/dealer-applications${qs}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.applications || [];
}
