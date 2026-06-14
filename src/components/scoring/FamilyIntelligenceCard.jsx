import { useMemo } from "react";

import { buildFamilyScore } from "../../intelligence/buildFamilyScore.js";

import ConfidenceBadge from "./ConfidenceBadge.jsx";
import "./family-intelligence-card.css";

function normalizeFamilyScore(familyScore) {
  if (!familyScore || typeof familyScore !== "object") {
    return null;
  }

  const label = String(familyScore.label || "").trim();
  if (!label) return null;

  return { label };
}

/**
 * Simple family suitability card from buildFamilyScore().
 * Use on car detail, compare, and family discovery surfaces.
 */
export default function FamilyIntelligenceCard({
  vehicle = null,
  familyScore = null,
  confidenceLabels = null,
  variant = "default",
  layout = "card",
  className = "",
  id = undefined,
  title = "Family Suitability",
}) {
  const resolved = useMemo(() => {
    if (familyScore) {
      return normalizeFamilyScore(familyScore);
    }
    if (vehicle) {
      return normalizeFamilyScore(buildFamilyScore(vehicle));
    }
    return null;
  }, [vehicle, familyScore]);

  if (!resolved) {
    return null;
  }

  const rootClass = [
    "family-intelligence",
    variant === "compact" ? "family-intelligence--compact" : "",
    layout === "card" ? "family-intelligence--card" : "family-intelligence--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      <h4 className="family-intelligence__heading">{title}</h4>
      <p className="family-intelligence__label">{resolved.label}</p>
      <ConfidenceBadge
        vehicle={vehicle}
        confidenceLabels={confidenceLabels}
        dimension="familySuitability"
        variant={variant === "compact" ? "compact" : "default"}
      />
    </div>
  );
}
