import { useMemo } from "react";

import { buildRecommendationEngine } from "../../intelligence/buildRecommendationEngine.js";
import { RECOMMENDATION_LIMITS } from "../../intelligence/recommendationRules.js";

import "./recommendation-insights-card.css";

function normalizeRecommendation(recommendation) {
  if (!recommendation || typeof recommendation !== "object") {
    return { bestFor: [], avoidFor: [] };
  }

  return {
    bestFor: Array.isArray(recommendation.bestFor)
      ? recommendation.bestFor.filter(Boolean)
      : [],
    avoidFor: Array.isArray(recommendation.avoidFor)
      ? recommendation.avoidFor.filter(Boolean)
      : [],
  };
}

/**
 * Compact best-for / avoid-if card from buildRecommendationEngine().
 * Use on car detail, compare, and future recommendation surfaces.
 */
export default function RecommendationInsightsCard({
  vehicle = null,
  recommendation = null,
  variant = "default",
  layout = "card",
  maxBestFor = RECOMMENDATION_LIMITS.maxBestFor,
  maxAvoidFor = RECOMMENDATION_LIMITS.maxAvoidFor,
  className = "",
  id = undefined,
}) {
  const resolved = useMemo(() => {
    if (recommendation) {
      return normalizeRecommendation(recommendation);
    }
    if (vehicle) {
      return normalizeRecommendation(buildRecommendationEngine(vehicle));
    }
    return normalizeRecommendation(null);
  }, [vehicle, recommendation]);

  const bestFor = resolved.bestFor.slice(0, maxBestFor);
  const avoidFor = resolved.avoidFor.slice(0, maxAvoidFor);

  if (!bestFor.length && !avoidFor.length) {
    return null;
  }

  const rootClass = [
    "recommendation-insights",
    variant === "compact" ? "recommendation-insights--compact" : "",
    layout === "card" ? "recommendation-insights--card" : "recommendation-insights--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} id={id}>
      {bestFor.length > 0 ? (
        <div className="recommendation-insights__block">
          <h4 className="recommendation-insights__heading">Best for</h4>
          <ul className="recommendation-insights__list">
            {bestFor.map((label) => (
              <li
                key={`best-${label}`}
                className="recommendation-insights__item recommendation-insights__item--best"
              >
                <span className="recommendation-insights__icon" aria-hidden>
                  ✓
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {avoidFor.length > 0 ? (
        <div className="recommendation-insights__block">
          <h4 className="recommendation-insights__heading">Avoid if</h4>
          <ul className="recommendation-insights__list">
            {avoidFor.map((label) => (
              <li
                key={`avoid-${label}`}
                className="recommendation-insights__item recommendation-insights__item--avoid"
              >
                <span className="recommendation-insights__icon" aria-hidden>
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
