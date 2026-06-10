import { scoreVehicle } from "../../scoring/index.js";

/**
 * Compact EVSavari score + grade for listing cards.
 */
export default function CatalogScoreBadge({ vehicle, className = "" }) {
  const scored =
    vehicle?.evSavariScores?.overall?.score != null
      ? vehicle.evSavariScores
      : scoreVehicle(vehicle);

  const score = scored?.overall?.score;
  const grade = scored?.overall?.grade;

  if (score == null || !Number.isFinite(Number(score))) {
    return null;
  }

  const rounded = Math.round(Number(score));

  return (
    <span
      className={`catalog-score-badge ${className}`.trim()}
      title={`EVSavari Score ${rounded}${grade ? ` (${grade})` : ""}`}
      aria-label={`EVSavari score ${rounded}${grade ? `, grade ${grade}` : ""}`}
    >
      <span className="catalog-score-badge__score">{rounded}</span>
      {grade ? (
        <span className="catalog-score-badge__grade">{grade}</span>
      ) : null}
    </span>
  );
}
