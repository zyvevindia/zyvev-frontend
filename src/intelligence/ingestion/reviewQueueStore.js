import {
  CHANGE_SEVERITY,
  MAX_QUEUE_SESSIONS,
  QUEUE_STORAGE_KEY,
  REVIEW_STATUS,
  STALE_PENDING_MS,
} from "./constants.js";

function safeRead() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return { sessions: [] };
    const data = JSON.parse(raw);
    return Array.isArray(data.sessions) ? data : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

function safeWrite(state) {
  try {
    const sessions = (state.sessions || []).slice(0, MAX_QUEUE_SESSIONS);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify({ sessions }));
  } catch {
    /* quota */
  }
}

export function loadIngestionQueue() {
  return safeRead().sessions;
}

export function saveIngestionQueueSessions(sessions) {
  safeWrite({ sessions });
}

export function appendIngestionSession(session) {
  const sessions = loadIngestionQueue();
  sessions.unshift(session);
  saveIngestionQueueSessions(sessions);
  return session;
}

export function updateIngestionSession(id, partial) {
  const sessions = loadIngestionQueue();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const next = {
    ...sessions[idx],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  sessions[idx] = next;
  saveIngestionQueueSessions(sessions);
  return next;
}

export function getIngestionSession(id) {
  return loadIngestionQueue().find((s) => s.id === id) || null;
}

export function queueSummaryCounts(sessions = loadIngestionQueue()) {
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    deferred: 0,
    stalePending: 0,
    highSeverityPending: 0,
  };
  const now = Date.now();
  for (const s of sessions) {
    if (s.status === REVIEW_STATUS.PENDING) {
      counts.pending += 1;
      const created = new Date(s.createdAt).getTime();
      if (now - created > STALE_PENDING_MS) counts.stalePending += 1;
      if (s.maxSeverity === CHANGE_SEVERITY.INTELLIGENCE || s.maxSeverity === CHANGE_SEVERITY.PRICING) {
        counts.highSeverityPending += 1;
      }
    }
    if (s.status === REVIEW_STATUS.APPROVED) counts.approved += 1;
    if (s.status === REVIEW_STATUS.REJECTED) counts.rejected += 1;
    if (s.status === REVIEW_STATUS.DEFERRED) counts.deferred += 1;
  }
  return counts;
}
