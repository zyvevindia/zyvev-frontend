import { ScoreConfidenceBadge } from "./ScoreTierBadge.jsx";
import { CONFIDENCE_DIMENSION_LABELS } from "./score2DisplayUtils.js";
import "./score2.css";

const CONFIDENCE_ROWS = Object.freeze([
  "ownership",
  "charging",
  "highway",
  "family",
  "service",
  "value",
]);

export default function ScoreConfidenceCard({
  confidence = null,
  className = "",
}) {
  if (!confidence) return null;

  return (
    <section className={`score2-card score2-confidence-card ${className}`.trim()}>
      <h3 className="score2-card__title">Data confidence</h3>
      <ul className="score2-confidence-card__list">
        {CONFIDENCE_ROWS.map((dimension) => {
          const level = confidence[dimension];
          if (!level) return null;

          return (
            <li key={dimension} className="score2-confidence-card__row">
              <span className="score2-confidence-card__label">
                {CONFIDENCE_DIMENSION_LABELS[dimension]}
              </span>
              <ScoreConfidenceBadge level={level} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
