import { scoreVehicle } from "../../scoring/index.js";

function resolveValueScore(vehicle, scored) {
  const fromVehicle = vehicle?.evSavariScores?.breakdown?.value?.score;
  if (fromVehicle != null && Number.isFinite(Number(fromVehicle))) {
    return Math.round(Number(fromVehicle));
  }

  const fromBreakdown = scored?.breakdown?.value?.score;
  if (fromBreakdown != null && Number.isFinite(Number(fromBreakdown))) {
    return Math.round(Number(fromBreakdown));
  }

  const legacy = vehicle?.evScores?.subScores?.ownershipAffordability;
  if (legacy != null && Number.isFinite(Number(legacy))) {
    return Math.round(Number(legacy));
  }

  return null;
}

/**
 * Compact EVSavari score + grade for listing cards.
 */
export default function CatalogScoreBadge({
  vehicle,
  className = "",
  showValueScore = false,
}) {
  const scored =
    vehicle?.evSavariScores?.overall?.score != null
      ? vehicle.evSavariScores
      : scoreVehicle(vehicle);

  const score = scored?.overall?.score;
  const grade = scored?.overall?.grade;
  const valueScore = showValueScore ? resolveValueScore(vehicle, scored) : null;

  if (score == null || !Number.isFinite(Number(score))) {
    if (valueScore == null) return null;

    return (
      <span
        className={`catalog-score-badge catalog-score-badge--value-only ${className}`.trim()}
        title={`Value score ${valueScore}`}
        aria-label={`Value score ${valueScore}`}
      >
        <span className="catalog-score-badge__label">Value</span>
        <span className="catalog-score-badge__score">{valueScore}</span>
      </span>
    );
  }

  const rounded = Math.round(Number(score));

  return (
    <span className={`catalog-score-badge-group ${className}`.trim()}>
      <span
        className="catalog-score-badge"
        title={`EVSavari Score ${rounded}${grade ? ` (${grade})` : ""}`}
        aria-label={`EVSavari score ${rounded}${grade ? `, grade ${grade}` : ""}`}
      >
        <span className="catalog-score-badge__score">{rounded}</span>
        {grade ? (
          <span className="catalog-score-badge__grade">{grade}</span>
        ) : null}
      </span>
      {valueScore != null ? (
        <span
          className="catalog-score-badge catalog-score-badge--value"
          title={`Value score ${valueScore}`}
          aria-label={`Value score ${valueScore}`}
        >
          <span className="catalog-score-badge__label">Value</span>
          <span className="catalog-score-badge__score">{valueScore}</span>
        </span>
      ) : null}
    </span>
  );
}
