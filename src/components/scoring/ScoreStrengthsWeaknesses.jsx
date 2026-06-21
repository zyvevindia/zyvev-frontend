import { useMemo } from "react";

import { buildScoreExplanation } from "../../intelligence/buildScoreExplanation.js";
import { SCORE_EXPLANATION_LIMITS } from "../../intelligence/types.js";
import { normalizeInsightLabels } from "../../utils/normalizeInsightLabels.js";

import "./score-strengths-weaknesses.css";

function normalizeExplanation(explanation) {
  if (!explanation || typeof explanation !== "object") {
    return { strengths: [], weaknesses: [], confidence: "verified" };
  }

  return {
    strengths: normalizeInsightLabels(explanation.strengths),
    weaknesses: normalizeInsightLabels(explanation.weaknesses),
    confidence: explanation.confidence || "verified",
  };
}

/**
 * Compact, reusable strengths & weaknesses from buildScoreExplanation().
 * Use on detail pages, compare, and EV Intelligence (full mode).
 * Pass showWeaknesses={false} on browse/discovery card surfaces.
 */
export default function ScoreStrengthsWeaknesses({
  vehicle = null,
  explanation = null,
  variant = "default",
  layout = "card",
  maxStrengths = SCORE_EXPLANATION_LIMITS.maxStrengths,
  maxWeaknesses = SCORE_EXPLANATION_LIMITS.maxWeaknesses,
  showWeaknesses = true,
  className = "",
  id = undefined,
}) {
  const resolved = useMemo(() => {
    if (explanation) {
      return normalizeExplanation(explanation);
    }
    if (vehicle) {
      return normalizeExplanation(buildScoreExplanation(vehicle));
    }
    return normalizeExplanation(null);
  }, [vehicle, explanation]);

  const strengths = resolved.strengths.slice(0, maxStrengths);
  const weaknesses = showWeaknesses
    ? resolved.weaknesses.slice(0, maxWeaknesses)
    : [];

  if (!strengths.length && !weaknesses.length) {
    return null;
  }

  const rootClass = [
    "score-sw",
    variant === "compact" ? "score-sw--compact" : "",
    layout === "card" ? "score-sw--card" : "score-sw--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      id={id}
      data-confidence={resolved.confidence}
    >
      {strengths.length > 0 ? (
        <div className="score-sw__block">
          <h4 className="score-sw__heading">Strengths</h4>
          <ul className="score-sw__list">
            {strengths.map((label) => (
              <li
                key={`s-${label}`}
                className="score-sw__item score-sw__item--strength"
              >
                <span className="score-sw__icon" aria-hidden>
                  ✓
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showWeaknesses && weaknesses.length > 0 ? (
        <div className="score-sw__block">
          <h4 className="score-sw__heading">Weaknesses</h4>
          <ul className="score-sw__list">
            {weaknesses.map((label) => (
              <li
                key={`w-${label}`}
                className="score-sw__item score-sw__item--weakness"
              >
                <span className="score-sw__icon" aria-hidden>
                  ⚠
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
