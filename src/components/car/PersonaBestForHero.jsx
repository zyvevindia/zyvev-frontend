import { useMemo } from "react";

import { buildPersonas } from "../../intelligence/buildPersonas.js";
import { buildRecommendationEngine } from "../../intelligence/buildRecommendationEngine.js";
import { RECOMMENDATION_LIMITS } from "../../intelligence/recommendationRules.js";
import PersonaChips from "../scoring/PersonaChips.jsx";

import "./persona-best-for-hero.css";

function normalizeBestFor(recommendation) {
  if (!recommendation || typeof recommendation !== "object") {
    return [];
  }

  return Array.isArray(recommendation.bestFor)
    ? recommendation.bestFor.filter(Boolean)
    : [];
}

/**
 * Hero identity block — persona chips plus positive best-for signals only.
 */
export default function PersonaBestForHero({
  vehicle = null,
  personas = null,
  recommendation = null,
  maxBestFor = RECOMMENDATION_LIMITS.maxBestFor,
  className = "",
  id = undefined,
}) {
  const resolvedPersonas = useMemo(() => {
    if (personas) return personas;
    if (vehicle) return buildPersonas(vehicle);
    return null;
  }, [vehicle, personas]);

  const bestFor = useMemo(() => {
    if (recommendation) {
      return normalizeBestFor(recommendation).slice(0, maxBestFor);
    }
    if (vehicle) {
      return normalizeBestFor(buildRecommendationEngine(vehicle)).slice(
        0,
        maxBestFor
      );
    }
    return [];
  }, [vehicle, recommendation, maxBestFor]);

  const personaLabels = Array.isArray(resolvedPersonas?.personas)
    ? resolvedPersonas.personas
    : [];

  if (!personaLabels.length && !bestFor.length) {
    return null;
  }

  const rootClass = ["persona-best-for-hero", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={rootClass}
      id={id}
      aria-label="Who this EV is for"
    >
      {personaLabels.length > 0 ? (
        <PersonaChips
          vehicle={vehicle}
          personas={resolvedPersonas}
          layout="inline"
          className="persona-best-for-hero__chips"
          ariaLabel="EV identity personas"
        />
      ) : null}

      {bestFor.length > 0 ? (
        <div className="persona-best-for-hero__best-for">
          <h2 className="persona-best-for-hero__heading">Best for</h2>
          <ul className="persona-best-for-hero__list">
            {bestFor.map((label) => (
              <li key={label} className="persona-best-for-hero__item">
                <span aria-hidden>✓</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
