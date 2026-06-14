import { useMemo } from "react";

import { buildChargingPracticalityScore } from "../../intelligence/buildChargingPracticalityScore.js";

import "./charging-intelligence-card.css";

function isUnavailableExperience(text) {
  return /unavailable/i.test(String(text || ""));
}

function normalizeChargingPracticality(chargingPracticality) {
  if (!chargingPracticality || typeof chargingPracticality !== "object") {
    return null;
  }

  const label = String(chargingPracticality.label || "").trim();
  const acChargingExperience = String(
    chargingPracticality.acChargingExperience || ""
  ).trim();
  const dcChargingExperience = String(
    chargingPracticality.dcChargingExperience || ""
  ).trim();

  if (!label) return null;

  const acLine = isUnavailableExperience(acChargingExperience)
    ? null
    : acChargingExperience;
  const dcLine = isUnavailableExperience(dcChargingExperience)
    ? null
    : dcChargingExperience;

  if (!acLine && !dcLine) {
    return null;
  }

  return {
    label,
    acChargingExperience: acLine,
    dcChargingExperience: dcLine,
  };
}

/**
 * Simple charging practicality card from buildChargingPracticalityScore().
 * Use on car detail, compare, and future recommendation surfaces.
 */
export default function ChargingIntelligenceCard({
  vehicle = null,
  chargingPracticality = null,
  variant = "default",
  layout = "card",
  className = "",
  id = undefined,
  title = "Charging Experience",
}) {
  const resolved = useMemo(() => {
    if (chargingPracticality) {
      return normalizeChargingPracticality(chargingPracticality);
    }
    if (vehicle) {
      return normalizeChargingPracticality(
        buildChargingPracticalityScore(vehicle)
      );
    }
    return null;
  }, [vehicle, chargingPracticality]);

  if (!resolved) {
    return null;
  }

  const rootClass = [
    "charging-intelligence",
    variant === "compact" ? "charging-intelligence--compact" : "",
    layout === "card" ? "charging-intelligence--card" : "charging-intelligence--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      <h4 className="charging-intelligence__heading">{title}</h4>
      <p className="charging-intelligence__label">{resolved.label}</p>
      {resolved.acChargingExperience ? (
        <p className="charging-intelligence__detail">
          {resolved.acChargingExperience}
        </p>
      ) : null}
      {resolved.dcChargingExperience ? (
        <p className="charging-intelligence__detail">
          {resolved.dcChargingExperience}
        </p>
      ) : null}
    </div>
  );
}
