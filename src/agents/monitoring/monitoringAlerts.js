/**
 * Monitoring Agent v1 — alert construction (deterministic, no auto-fix).
 */
import { ALERT_LEVEL } from "./monitoringStatus.js";
import { MONITORING_CATEGORIES } from "./monitoringRules.js";

let alertCounter = 0;

function newAlertId() {
  alertCounter += 1;
  return `alert_${Date.now()}_${alertCounter}`;
}

export function resetAlertCounter() {
  alertCounter = 0;
}

/**
 * @param {object} params
 * @returns {object}
 */
export function createAlert({
  level = ALERT_LEVEL.INFO,
  category,
  code,
  message,
  entityId = null,
  metadata = {},
  recommendation = null,
}) {
  return {
    id: newAlertId(),
    level,
    category,
    code,
    message,
    entityId,
    metadata,
    recommendation,
    detectedAt: new Date().toISOString(),
    autoFixApplied: false,
  };
}

export function sortAlerts(alerts = []) {
  const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return [...alerts].sort(
    (a, b) =>
      (order[a.level] ?? 9) - (order[b.level] ?? 9) ||
      String(a.category).localeCompare(String(b.category))
  );
}

export function groupAlertsByCategory(alerts = []) {
  const groups = {};
  for (const alert of alerts) {
    const key = alert.category || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(alert);
  }
  return groups;
}

export function countByLevel(alerts = []) {
  return {
    INFO: alerts.filter((a) => a.level === ALERT_LEVEL.INFO).length,
    WARNING: alerts.filter((a) => a.level === ALERT_LEVEL.WARNING).length,
    CRITICAL: alerts.filter((a) => a.level === ALERT_LEVEL.CRITICAL).length,
    total: alerts.length,
  };
}

export { ALERT_LEVEL, MONITORING_CATEGORIES };
