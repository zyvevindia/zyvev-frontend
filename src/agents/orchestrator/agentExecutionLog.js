/**
 * Orchestrator execution log — append-only audit trail.
 * Browser: localStorage. Node/tests: in-memory via setLogBackend.
 */

const STORAGE_KEY = "evsavari-orchestrator-executions-v1";
const MAX_LOGS = 200;

let memoryBackend = null;

function defaultBackend() {
  if (memoryBackend) return memoryBackend;
  if (typeof window === "undefined" || !window.localStorage) {
    memoryBackend = { logs: [] };
    return memoryBackend;
  }
  return null;
}

function readAll() {
  const mem = defaultBackend();
  if (mem) return [...mem.logs];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(logs) {
  const trimmed = logs.slice(0, MAX_LOGS);
  const mem = defaultBackend();
  if (mem) {
    mem.logs = trimmed;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function newId() {
  return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** @param {{ logs: object[] }} backend */
export function setLogBackend(backend) {
  memoryBackend = backend;
}

export function clearLogBackend() {
  memoryBackend = null;
}

/**
 * @param {object} entry
 * @returns {object}
 */
export function createExecutionLog(entry) {
  const now = new Date().toISOString();
  const log = {
    id: newId(),
    agentId: entry.agentId,
    agentName: entry.agentName || entry.agentId,
    status: entry.status || "running",
    input: entry.input ?? null,
    output: entry.output ?? null,
    recommendation: entry.recommendation ?? null,
    approvalRequired: entry.approvalRequired ?? false,
    approval: entry.approval ?? null,
    executedAt: entry.executedAt ?? null,
    executedBy: entry.executedBy ?? null,
    durationMs: entry.durationMs ?? null,
    error: entry.error ?? null,
    linkedJobId: entry.linkedJobId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const logs = readAll();
  logs.unshift(log);
  writeAll(logs);
  return log;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {object|null}
 */
export function updateExecutionLog(id, patch) {
  const logs = readAll();
  const idx = logs.findIndex((l) => l.id === id);
  if (idx < 0) return null;

  logs[idx] = {
    ...logs[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeAll(logs);
  return logs[idx];
}

export function getExecutionLog(id) {
  return readAll().find((l) => l.id === id) || null;
}

/**
 * @param {object} filters
 * @returns {object[]}
 */
export function listExecutionLogs(filters = {}) {
  let logs = readAll();
  if (filters.agentId) {
    logs = logs.filter((l) => l.agentId === filters.agentId);
  }
  if (filters.status) {
    logs = logs.filter((l) => l.status === filters.status);
  }
  const limit = filters.limit ?? 50;
  return logs.slice(0, limit);
}

export function getLastExecutionForAgent(agentId) {
  return listExecutionLogs({ agentId, limit: 1 })[0] || null;
}
