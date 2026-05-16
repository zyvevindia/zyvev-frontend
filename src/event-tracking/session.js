/**
 * Anonymous session ID — sessionStorage only, no fingerprinting.
 */

const SESSION_KEY = "evsavari_anon_session";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getAnonymousSessionId() {
  if (typeof window === "undefined") return null;

  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id || id.length < 16) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

export function clearAnonymousSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
