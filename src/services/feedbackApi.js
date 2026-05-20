import { API_URL } from "../config";
import { logProduction } from "../utils/productionLog";
import { normalizeFeedbackCategoryId } from "../ops/feedbackTaxonomy.js";

const STORAGE_KEY = "evsavari-user-feedback-v1";
const MAX_LOCAL = 50;
const MAX_SCREENSHOT_CHARS = 120_000;

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
 * @param {object} payload
 */
export function saveFeedbackLocally(payload) {
  const row = {
    id: `fb-${Date.now()}`,
    at: new Date().toISOString(),
    ...payload,
    category: normalizeFeedbackCategoryId(payload.category),
    severity: String(payload.severity || "medium").toLowerCase(),
  };
  writeLocal([row, ...readLocal()]);
  return row;
}

export function listLocalFeedback() {
  return readLocal();
}

const USEFULNESS_KEY = "evsavari-usefulness-feedback-v1";

function readUsefulness() {
  try {
    const raw = localStorage.getItem(USEFULNESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsefulness(entries) {
  try {
    localStorage.setItem(USEFULNESS_KEY, JSON.stringify(entries.slice(0, 200)));
  } catch {
    /* quota */
  }
}

/**
 * Lightweight usefulness vote — local buffer + optional server.
 */
export async function submitUsefulnessFeedback(payload = {}) {
  const row = {
    id: `uf-${Date.now()}`,
    at: new Date().toISOString(),
    useful: Boolean(payload.useful),
    context: payload.context || "general",
    route: payload.route || "",
    metadata: payload.metadata || {},
  };

  writeUsefulness([row, ...readUsefulness()]);

  try {
    const res = await fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "usefulness",
        description: `Usefulness: ${row.useful ? "yes" : "no"} (${row.context})`,
        route: row.route,
        context: row.metadata,
      }),
    });
    if (!res.ok) throw new Error("server");
    return { ok: true, localOnly: false };
  } catch {
    return { ok: true, localOnly: true };
  }
}

export function summarizeLocalFeedback() {
  const issues = readLocal();
  const votes = readUsefulness();
  const byCategory = {};
  const byOperationalCategory = {};
  const severityCounts = { high: 0, medium: 0, low: 0 };

  for (const row of issues) {
    const rawCat = row.category || "other";
    byCategory[rawCat] = (byCategory[rawCat] || 0) + 1;
    const norm = normalizeFeedbackCategoryId(rawCat);
    byOperationalCategory[norm] = (byOperationalCategory[norm] || 0) + 1;
    const sev = String(row.severity || "medium").toLowerCase();
    if (severityCounts[sev] != null) {
      severityCounts[sev] += 1;
    } else {
      severityCounts.medium += 1;
    }
  }

  const usefulYes = votes.filter((v) => v.useful).length;
  const usefulNo = votes.filter((v) => !v.useful).length;
  const usefulnessTotal = votes.length;
  const dissatisfactionRatio =
    usefulnessTotal > 0 ? usefulNo / usefulnessTotal : 0;

  return {
    issueCount: issues.length,
    byCategory,
    byOperationalCategory,
    severityCounts,
    usefulnessYes: usefulYes,
    usefulnessNo: usefulNo,
    usefulnessTotal,
    dissatisfactionRatio,
  };
}

/**
 * Submit site feedback (server + local buffer).
 */
export async function submitUserFeedback(payload = {}) {
  const body = {
    category: normalizeFeedbackCategoryId(payload.category || "other"),
    severity: String(payload.severity || "medium").toLowerCase(),
    description: String(payload.description || "").trim(),
    email: String(payload.email || "").trim(),
    name: String(payload.name || "").trim(),
    route: payload.route || "",
    context: payload.context || {},
    screenshotDataUrl: payload.screenshotDataUrl
      ? String(payload.screenshotDataUrl).slice(0, MAX_SCREENSHOT_CHARS)
      : "",
    turnstileToken: payload.turnstileToken || "",
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  if (!body.description) {
    throw new Error("Please describe the issue.");
  }

  const localRow = saveFeedbackLocally(body);

  try {
    const res = await fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || "Server unavailable");
    }

    return { ok: true, localOnly: false, id: localRow.id };
  } catch (err) {
    logProduction(
      "feedback",
      "submit_fallback_local",
      { route: body.route, message: err?.message },
      "warn"
    );
    return { ok: true, localOnly: true, id: localRow.id };
  }
}
