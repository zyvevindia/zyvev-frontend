/**
 * Lightweight OEM / catalog update review queue (localStorage).
 * Human-reviewed workflow only — no automated scraping.
 */

const STORAGE_KEY = "evsavari-oem-update-queue-v1";
const MAX = 80;

function read() {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(rows) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

/**
 * @param {object} item
 * @param {string} item.familySlug
 * @param {string} [item.field] e.g. "range", "price", "charging"
 * @param {string} [item.detectedSummary] human-readable what changed / was noticed
 * @param {string} [item.status] pending | in_review | approved | dismissed
 * @param {string} [item.notes] editorial notes
 */
export function appendOemQueueItem(item = {}) {
  const row = {
    id: `oem-${Date.now()}`,
    at: new Date().toISOString(),
    status: item.status || "pending",
    familySlug: String(item.familySlug || "").trim(),
    field: String(item.field || "").trim() || "general",
    detectedSummary: String(item.detectedSummary || "").trim(),
    notes: String(item.notes || "").trim(),
    source: String(item.source || "manual").trim(),
  };
  if (!row.familySlug) return null;
  write([row, ...read()]);
  return row;
}

export function listOemQueueItems() {
  return read();
}

export function updateOemQueueItem(id, patch = {}) {
  const rows = read();
  const next = rows.map((r) =>
    r.id === id
      ? {
          ...r,
          ...patch,
          updatedAt: new Date().toISOString(),
        }
      : r
  );
  write(next);
  return next.find((r) => r.id === id) || null;
}

export function summarizeOemQueue() {
  const rows = read();
  const byStatus = {};
  for (const r of rows) {
    const s = r.status || "pending";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  return {
    total: rows.length,
    byStatus,
    pending: rows.filter((r) => (r.status || "pending") === "pending"),
    staleAlert:
      rows.filter((r) => {
        const st = r.status || "pending";
        if (st !== "pending" && st !== "in_review") return false;
        const t = new Date(r.at).getTime();
        return Date.now() - t > 14 * 24 * 60 * 60 * 1000;
      }).length,
  };
}
