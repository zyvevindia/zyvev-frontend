/**
 * Change Detection Agent v1 — operator priority classification.
 */

import { CHANGE_SEVERITY } from "./changeClassification.js";

export const CHANGE_PRIORITY = Object.freeze({
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
});

const PRIORITY_ORDER = [
  CHANGE_PRIORITY.CRITICAL,
  CHANGE_PRIORITY.HIGH,
  CHANGE_PRIORITY.MEDIUM,
  CHANGE_PRIORITY.LOW,
];

export function classifyChangePriority(change = {}, severity = CHANGE_SEVERITY.LOW) {
  const { changeType, fieldKey, category } = change;

  if (category === "variant" || changeType === "variant_added" || changeType === "variant_removed") {
    return CHANGE_PRIORITY.CRITICAL;
  }

  if (fieldKey === "batteryCapacityKwh" || changeType === "removed") {
    return CHANGE_PRIORITY.CRITICAL;
  }

  if (severity === CHANGE_SEVERITY.HIGH) return CHANGE_PRIORITY.HIGH;

  if (
    severity === CHANGE_SEVERITY.MEDIUM ||
    ["startingPrice", "topVariantPrice", "claimedRangeKm"].includes(fieldKey)
  ) {
    return CHANGE_PRIORITY.MEDIUM;
  }

  return CHANGE_PRIORITY.LOW;
}

export function aggregateJobPriority(changes = []) {
  if (!changes.length) return null;

  let highest = CHANGE_PRIORITY.LOW;
  for (const change of changes) {
    const priority = change.priority || CHANGE_PRIORITY.LOW;
    if (PRIORITY_ORDER.indexOf(priority) < PRIORITY_ORDER.indexOf(highest)) {
      highest = priority;
    }
  }
  return highest;
}

export function priorityTone(priority) {
  if (priority === CHANGE_PRIORITY.CRITICAL) return "red";
  if (priority === CHANGE_PRIORITY.HIGH) return "red";
  if (priority === CHANGE_PRIORITY.MEDIUM) return "yellow";
  return "neutral";
}
