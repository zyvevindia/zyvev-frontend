import { useMemo } from "react";

import { buildConfidenceLabels } from "../../intelligence/buildConfidenceLabels.js";
import { CONFIDENCE_LABELS } from "../../intelligence/confidenceRules.js";

import "./confidence-badge.css";

/** @typedef {import("../../intelligence/types.js").ConfidenceLabel} ConfidenceLabel */
/** @typedef {import("../../intelligence/types.js").ConfidenceEngineResult} ConfidenceEngineResult */

export const CONFIDENCE_DISPLAY_LABELS = Object.freeze({
  [CONFIDENCE_LABELS.VERIFIED]: "Verified",
  [CONFIDENCE_LABELS.PARTIAL]: "Partial",
  [CONFIDENCE_LABELS.ESTIMATED]: "Estimated",
  [CONFIDENCE_LABELS.DIRECTIONAL]: "Directional",
  [CONFIDENCE_LABELS.REVIEW_PENDING]: "Review Pending",
});

/** @type {ReadonlySet<string>} */
export const CONFIDENCE_DIMENSIONS = new Set([
  "overall",
  "range",
  "ownership",
  "chargingPracticality",
  "highwayConfidence",
  "apartmentSuitability",
  "familySuitability",
  "serviceNetwork",
]);

/**
 * @param {ConfidenceLabel|null|undefined} label
 * @returns {string|null}
 */
export function formatConfidenceLabel(label) {
  if (!label) return null;
  return CONFIDENCE_DISPLAY_LABELS[label] || null;
}

/**
 * Subtle confidence pill from buildConfidenceLabels().
 */
export default function ConfidenceBadge({
  vehicle = null,
  confidenceLabels = null,
  dimension = null,
  label = null,
  variant = "default",
  className = "",
}) {
  const resolvedLabel = useMemo(() => {
    if (label) return label;

    if (confidenceLabels && dimension && confidenceLabels[dimension]) {
      return confidenceLabels[dimension];
    }

    if (vehicle && dimension) {
      const labels = buildConfidenceLabels(vehicle);
      return labels[dimension] || null;
    }

    return null;
  }, [vehicle, confidenceLabels, dimension, label]);

  const displayText = formatConfidenceLabel(resolvedLabel);

  if (!displayText) {
    return null;
  }

  const rootClass = [
    "confidence-badge",
    `confidence-badge--${resolvedLabel}`,
    variant === "compact" ? "confidence-badge--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={rootClass}>{displayText}</span>;
}
