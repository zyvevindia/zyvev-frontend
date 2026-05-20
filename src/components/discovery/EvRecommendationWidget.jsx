import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  recommendFamilies,
  DEFAULT_RECOMMENDATION_PRIORITIES,
} from "../../intelligence/recommendations.js";
import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import {
  trackRecommendationGenerated,
  trackRecommendationAbandoned,
} from "../../analytics/funnel";
import UsefulnessFeedback from "../feedback/UsefulnessFeedback";

import "../../styles/ev-discovery.css";

const PRIORITY_FIELDS = [
  { key: "city", label: "City driving" },
  { key: "highway", label: "Highway trips" },
  { key: "family", label: "Family use" },
  { key: "charging", label: "Charging ease" },
  { key: "budget", label: "Budget" },
  { key: "performance", label: "Performance & tech" },
];

export default function EvRecommendationWidget({
  families = [],
  sourcePage = "listing",
}) {
  const [priorities, setPriorities] = useState({
    ...DEFAULT_RECOMMENDATION_PRIORITIES,
  });

  const results = useMemo(() => {
    return recommendFamilies(families, priorities, { limit: 4 });
  }, [families, priorities]);

  const handleSlider = (key, value) => {
    setPriorities((p) => ({ ...p, [key]: Number(value) }));
  };

  const handleShowResults = () => {
    interactedRef.current = true;
    trackRecommendationGenerated({
      sourcePage,
      priorityKeys: Object.keys(priorities).join(","),
      resultCount: results.length,
    });
  };

  const interactedRef = useRef(false);
  const resultsShownRef = useRef(false);

  useEffect(() => {
    if (results.length > 0) resultsShownRef.current = true;
  }, [results.length]);

  useEffect(() => {
    return () => {
      if (interactedRef.current && resultsShownRef.current) return;
      if (!resultsShownRef.current) return;
      trackRecommendationAbandoned({
        sourcePage,
        hadResults: true,
      });
    };
  }, [sourcePage]);

  if (!families.length) return null;

  return (
    <section className="ev-recommend-widget" aria-labelledby="ev-recommend-title">
      <h2 id="ev-recommend-title" className="ev-recommend-widget__title">
        Find your EV match
      </h2>
      <p className="ev-recommend-widget__intro">
        Set what matters to you — we rank EVs with transparent, rule-based
        scores (not AI guesses).
      </p>

      <div className="ev-recommend-sliders">
        {PRIORITY_FIELDS.map((field) => (
          <div key={field.key} className="ev-recommend-slider">
            <label htmlFor={`prio-${field.key}`}>
              <span>{field.label}</span>
              <span>{priorities[field.key]}/5</span>
            </label>
            <input
              id={`prio-${field.key}`}
              type="range"
              min={0}
              max={5}
              step={1}
              value={priorities[field.key]}
              onChange={(e) =>
                handleSlider(field.key, e.target.value)
              }
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="ev-discovery-filter-chip ev-discovery-filter-chip--active"
        onClick={handleShowResults}
      >
        Update recommendations
      </button>

      {results.length > 0 && (
        <div className="ev-recommend-results">
          {results.map(({ family, reasons, tradeoffs, bestFor }) => (
            <article key={family.familySlug} className="ev-recommend-card">
              <div className="ev-recommend-card__head">
                <Link
                  to={vehicleDetailPath(family)}
                  className="ev-recommend-card__name"
                >
                  {family.familyName}
                </Link>
                {family.evScores?.composite != null && (
                  <span className="ev-recommend-card__score">
                    {family.evScores.composite}/100
                  </span>
                )}
              </div>
              {bestFor && (
                <p className="ev-recommend-card__reasons">
                  <strong>{bestFor}</strong>
                </p>
              )}
              {reasons?.length > 0 && (
                <ul className="ev-recommend-card__reasons">
                  {reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {tradeoffs?.length > 0 && (
                <ul className="ev-recommend-card__reasons">
                  {tradeoffs.map((t) => (
                    <li key={t}>
                      <em>{t}</em>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <UsefulnessFeedback
          context="recommendation"
          sourcePage={sourcePage}
          showReportLink={false}
        />
      )}
    </section>
  );
}
