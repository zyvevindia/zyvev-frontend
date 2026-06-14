import { useMemo } from "react";

import { buildOwnershipCostScore } from "../../intelligence/buildOwnershipCostScore.js";

import "./ownership-intelligence-card.css";

function normalizeOwnershipCost(ownershipCost) {
  if (!ownershipCost || typeof ownershipCost !== "object") {
    return null;
  }

  const costPerKmMin = Number(ownershipCost.costPerKmMin);
  const costPerKmMax = Number(ownershipCost.costPerKmMax);

  if (
    !Number.isFinite(costPerKmMin) ||
    !Number.isFinite(costPerKmMax) ||
    costPerKmMin < 0 ||
    costPerKmMax < 0
  ) {
    return null;
  }

  return {
    label: ownershipCost.label || "Ownership cost",
    costPerKmMin,
    costPerKmMax,
  };
}

function formatCostPerKm(value) {
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

function formatCostPerKmRange(costPerKmMin, costPerKmMax) {
  return `₹${formatCostPerKm(costPerKmMin)}–${formatCostPerKm(costPerKmMax)}/km`;
}

/**
 * Simple ownership cost card from buildOwnershipCostScore().
 * Use on car detail and compare surfaces.
 */
export default function OwnershipIntelligenceCard({
  vehicle = null,
  ownershipCost = null,
  variant = "default",
  layout = "card",
  className = "",
  id = undefined,
  title = "Ownership Cost",
}) {
  const resolved = useMemo(() => {
    if (ownershipCost) {
      return normalizeOwnershipCost(ownershipCost);
    }
    if (vehicle) {
      return normalizeOwnershipCost(buildOwnershipCostScore(vehicle));
    }
    return null;
  }, [vehicle, ownershipCost]);

  if (!resolved) {
    return null;
  }

  const rootClass = [
    "ownership-intelligence",
    variant === "compact" ? "ownership-intelligence--compact" : "",
    layout === "card" ? "ownership-intelligence--card" : "ownership-intelligence--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      <h4 className="ownership-intelligence__heading">{title}</h4>
      <p className="ownership-intelligence__label">{resolved.label}</p>
      <p className="ownership-intelligence__range">
        {formatCostPerKmRange(resolved.costPerKmMin, resolved.costPerKmMax)}
      </p>
    </div>
  );
}
