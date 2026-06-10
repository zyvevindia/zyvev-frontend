import { OVERALL_WEIGHTS, FEATURE_POINTS } from "./scoreWeights.js";

const DIMENSION_LABELS = Object.freeze({
  range: "Range",
  charging: "Charging",
  performance: "Performance",
  feature: "Features",
  safety: "Safety",
  value: "Value",
  family: "Family suitability",
  city: "City usability",
  highway: "Highway usability",
});

const FEATURE_LABELS = Object.freeze({
  adas: "ADAS",
  sunroof: "Panoramic sunroof",
  ventilatedSeats: "Ventilated seats",
  camera360: "360° camera",
  connectedCar: "Connected car",
  v2l: "V2L (vehicle-to-load)",
  v2v: "V2V (vehicle-to-vehicle)",
});

function formatInr(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const n = Number(value);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function topDimensions(breakdown, count = 3) {
  return Object.entries(breakdown)
    .filter(([, row]) => row?.score != null)
    .map(([key, row]) => ({ key, label: DIMENSION_LABELS[key] || key, score: row.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function bottomDimensions(breakdown, count = 3) {
  return Object.entries(breakdown)
    .filter(([, row]) => row?.score != null)
    .map(([key, row]) => ({ key, label: DIMENSION_LABELS[key] || key, score: row.score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

/**
 * Deterministic per-dimension explanation snippets.
 * @param {string} dimensionKey
 * @param {object} row breakdown row with score + signals
 * @returns {string|null}
 */
export function explainDimension(dimensionKey, row) {
  if (!row || row.score == null) return null;
  const s = row.signals || {};

  switch (dimensionKey) {
    case "range":
      if (s.claimedRangeKm != null && s.efficiencyKmPerKwh != null) {
        return `Range score uses ${s.claimedRangeKm} km claimed range and ${s.efficiencyKmPerKwh.toFixed(1)} km/kWh efficiency.`;
      }
      if (s.claimedRangeKm != null) {
        return `Range score based on ${s.claimedRangeKm} km certified range.`;
      }
      return "Range score derived from available battery and range signals.";

    case "charging":
      if (s.dcChargingKw != null && s.dcChargingTimeMinutes != null) {
        return `Charging score reflects ${s.dcChargingKw} kW DC peak and ~${s.dcChargingTimeMinutes} min DC time.`;
      }
      if (s.dcChargingKw != null) {
        return `Charging score weighted on ${s.dcChargingKw} kW DC fast-charging capability.`;
      }
      return "Charging score from AC/DC power and charge-time signals where verified.";

    case "performance":
      if (s.powerPs != null && s.torqueNm != null) {
        return `Performance score from ${s.powerPs} PS and ${s.torqueNm} Nm torque.`;
      }
      return "Performance score from power and torque specifications.";

    case "feature": {
      const present = Object.entries(FEATURE_LABELS)
        .filter(([key]) => row.signals?.[key] === true || row.signals?.[key] === "yes")
        .map(([, label]) => label);
      if (present.length) {
        return `Feature score includes verified: ${present.join(", ")}.`;
      }
      return "Feature score counts verified ADAS, comfort, and connectivity equipment.";
    }

    case "safety":
      if (s.ncapRating != null) {
        return `Safety score includes ${s.ncapRating}-star NCAP rating${s.airbags != null ? ` and ${s.airbags} airbags` : ""}.`;
      }
      return "Safety score from NCAP, airbag count, and ADAS availability.";

    case "value": {
      const price = formatInr(s.startingPrice);
      if (price) {
        return `Value score balances ${price} entry price against range, features, and charging capability.`;
      }
      return "Value score compares price to range, features, and charging.";
    }

    case "family":
      if (s.bootSpaceL != null) {
        return `Family score considers ${s.bootSpaceL} L boot space plus safety and comfort features.`;
      }
      return "Family score from boot space, safety, features, and comfort signals.";

    case "city":
      if (s.efficiencyKmPerKwh != null) {
        return `City score favours ${s.efficiencyKmPerKwh.toFixed(1)} km/kWh efficiency and compact dimensions.`;
      }
      return "City score from efficiency, size, and home-charging practicality.";

    case "highway":
      return "Highway score combines long-range capability, fast charging, and performance.";

    default:
      return null;
  }
}

/**
 * Build strengths, weaknesses, and delta reasons for a vehicle score.
 * @param {object} breakdown full breakdown from buildVehicleBreakdown
 * @param {number|null} overallScore
 * @returns {object}
 */
export function buildScoreExplanation(breakdown, overallScore) {
  const coreKeys = [
    "range",
    "charging",
    "performance",
    "feature",
    "safety",
    "value",
    "family",
    "city",
    "highway",
  ];

  const strengths = [];
  const weaknesses = [];
  const increases = [];
  const decreases = [];

  for (const key of coreKeys) {
    const row = breakdown[key];
    if (!row || row.score == null) continue;
    const label = DIMENSION_LABELS[key];
    const detail = explainDimension(key, row);

    if (row.score >= 78) {
      strengths.push({
        dimension: key,
        label,
        score: row.score,
        reason: detail || `${label} is a standout at ${row.score}/100.`,
      });
      increases.push({
        dimension: key,
        label,
        score: row.score,
        reason: `${label} contributed strongly (${row.score}/100) to the overall score.`,
      });
    } else if (row.score <= 55) {
      weaknesses.push({
        dimension: key,
        label,
        score: row.score,
        reason: detail || `${label} is below segment average at ${row.score}/100.`,
      });
      decreases.push({
        dimension: key,
        label,
        score: row.score,
        reason: `${label} limited the overall score (${row.score}/100).`,
      });
    }
  }

  const top = topDimensions(breakdown, 2);
  const bottom = bottomDimensions(breakdown, 2);

  if (strengths.length === 0 && top.length) {
    strengths.push({
      dimension: top[0].key,
      label: top[0].label,
      score: top[0].score,
      reason: `${top[0].label} leads this EV at ${top[0].score}/100.`,
    });
  }

  if (weaknesses.length === 0 && bottom.length && bottom[0].score < 70) {
    weaknesses.push({
      dimension: bottom[0].key,
      label: bottom[0].label,
      score: bottom[0].score,
      reason: `${bottom[0].label} is the weakest area at ${bottom[0].score}/100.`,
    });
  }

  const dimensionExplanations = {};
  for (const key of coreKeys) {
    const text = explainDimension(key, breakdown[key]);
    if (text) dimensionExplanations[key] = text;
  }

  return {
    strengths,
    weaknesses,
    increases,
    decreases,
    dimensionExplanations,
    summary:
      overallScore != null
        ? `EVSavari overall score ${overallScore}/100 — deterministic blend of range, charging, safety, value, and use-case fit.`
        : "Insufficient verified data for a composite EVSavari score.",
  };
}

/**
 * Explain why a variant was picked for a role.
 * @param {string} role
 * @param {object} variant scored variant row
 * @returns {string}
 */
export function explainVariantPick(role, variant) {
  const name = variant.variantName || variant.name || "This variant";
  switch (role) {
    case "recommended":
      return `${name} balances value (${variant.scores?.value ?? "—"}), range (${variant.scores?.longRange ?? "—"}), charging (${variant.scores?.fastCharge ?? "—"}), and features (${variant.scores?.feature ?? "—"}).`;
    case "bestValue":
      return `${name} offers the strongest price-to-capability ratio (value score ${variant.scores?.value ?? "—"}/100).`;
    case "longestRange":
      return `${name} delivers the highest certified range (${variant.signals?.rangeKm ?? "—"} km).`;
    case "fastestCharging":
      return `${name} has the best DC charging profile (${variant.signals?.dcChargingKw ?? "—"} kW).`;
    default:
      return `${name} selected based on deterministic variant scoring.`;
  }
}

export { DIMENSION_LABELS, FEATURE_LABELS };
