import { API_URL } from "../config";
import { logProduction } from "../utils/productionLog";

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
  };
  writeLocal([row, ...readLocal()]);
  return row;
}

export function listLocalFeedback() {
  return readLocal();
}

/**
 * Submit site feedback (server + local buffer).
 */
export async function submitUserFeedback(payload = {}) {
  const body = {
    category: payload.category || "other",
    description: String(payload.description || "").trim(),
    email: String(payload.email || "").trim(),
    name: String(payload.name || "").trim(),
    route: payload.route || "",
    context: payload.context || {},
    screenshotDataUrl: payload.screenshotDataUrl
      ? String(payload.screenshotDataUrl).slice(0, MAX_SCREENSHOT_CHARS)
      : "",
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
