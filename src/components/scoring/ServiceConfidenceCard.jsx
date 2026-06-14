import { useMemo } from "react";

import { buildServiceNetworkScore } from "../../intelligence/buildServiceNetworkScore.js";

import ConfidenceBadge from "./ConfidenceBadge.jsx";
import "./service-confidence-card.css";

function normalizeServiceNetworkScore(serviceNetworkScore) {
  if (!serviceNetworkScore || typeof serviceNetworkScore !== "object") {
    return null;
  }

  const label = String(serviceNetworkScore.label || "").trim();
  if (!label) return null;

  return { label };
}

/**
 * Simple service network confidence card from buildServiceNetworkScore().
 * Use on car detail, compare, and future recommendation surfaces.
 */
export default function ServiceConfidenceCard({
  vehicle = null,
  serviceNetworkScore = null,
  confidenceLabels = null,
  variant = "default",
  layout = "card",
  className = "",
  id = undefined,
  title = "Service Confidence",
}) {
  const resolved = useMemo(() => {
    if (serviceNetworkScore) {
      return normalizeServiceNetworkScore(serviceNetworkScore);
    }
    if (vehicle) {
      return normalizeServiceNetworkScore(buildServiceNetworkScore(vehicle));
    }
    return null;
  }, [vehicle, serviceNetworkScore]);

  if (!resolved) {
    return null;
  }

  const rootClass = [
    "service-confidence",
    variant === "compact" ? "service-confidence--compact" : "",
    layout === "card" ? "service-confidence--card" : "service-confidence--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      <h4 className="service-confidence__heading">{title}</h4>
      <p className="service-confidence__label">{resolved.label}</p>
      <ConfidenceBadge
        vehicle={vehicle}
        confidenceLabels={confidenceLabels}
        dimension="serviceNetwork"
        variant={variant === "compact" ? "compact" : "default"}
      />
    </div>
  );
}
