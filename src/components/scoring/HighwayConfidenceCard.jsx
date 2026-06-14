import { useMemo } from "react";

import { buildHighwayConfidenceScore } from "../../intelligence/buildHighwayConfidenceScore.js";

import "./highway-confidence-card.css";

function normalizeHighwayConfidence(highwayConfidence) {
  if (!highwayConfidence || typeof highwayConfidence !== "object") {
    return null;
  }

  const label = String(highwayConfidence.label || "").trim();
  if (!label) return null;

  return { label };
}

/**
 * Simple long-distance / highway confidence card from buildHighwayConfidenceScore().
 * Use on car detail and compare surfaces.
 */
export default function HighwayConfidenceCard({
  vehicle = null,
  highwayConfidence = null,
  variant = "default",
  layout = "card",
  className = "",
  id = undefined,
  title = "Long-distance Travel",
}) {
  const resolved = useMemo(() => {
    if (highwayConfidence) {
      return normalizeHighwayConfidence(highwayConfidence);
    }
    if (vehicle) {
      return normalizeHighwayConfidence(buildHighwayConfidenceScore(vehicle));
    }
    return null;
  }, [vehicle, highwayConfidence]);

  if (!resolved) {
    return null;
  }

  const rootClass = [
    "highway-confidence",
    variant === "compact" ? "highway-confidence--compact" : "",
    layout === "card" ? "highway-confidence--card" : "highway-confidence--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      <h4 className="highway-confidence__heading">{title}</h4>
      <p className="highway-confidence__label">{resolved.label}</p>
    </div>
  );
}
