import { useEffect, useRef } from "react";

import { buildCompareAdvantages } from "../../intelligence/compareAdvantages.js";
import { trackCompareAdvantageViewed } from "../../analytics/funnel";

import "../../styles/ev-discovery.css";

export default function CompareAdvantageSummary({ cars = [] }) {
  const tracked = useRef(false);
  const summary = buildCompareAdvantages(cars);

  useEffect(() => {
    if (!cars.length || tracked.current) return;
    if (!summary.highlights?.length) return;
    tracked.current = true;
    trackCompareAdvantageViewed({
      vehicleSlugs: cars.map((c) => c.slug).filter(Boolean),
      highlightCount: summary.highlights.length,
    });
  }, [cars, summary.highlights?.length]);

  if (cars.length < 2) return null;
  if (
    !summary.highlights?.length &&
    !summary.bestForRecommendations?.length
  ) {
    return null;
  }

  return (
    <section
      className="compare-advantage-panel"
      aria-labelledby="compare-advantage-title"
    >
      <h2 id="compare-advantage-title" className="compare-advantage-panel__title">
        Where each EV leads
      </h2>

      {summary.highlights.length > 0 && (
        <div className="compare-advantage-highlights">
          {summary.highlights.map((h) => (
            <span key={h.id} className="compare-advantage-pill">
              {h.text}
            </span>
          ))}
        </div>
      )}

      {summary.bestForRecommendations?.length > 0 && (
        <div className="compare-advantage-best-for">
          {summary.bestForRecommendations.map((rec) => (
            <div key={rec.type} className="compare-advantage-best-for__item">
              <span className="compare-advantage-best-for__label">
                {rec.label}
              </span>
              <span className="compare-advantage-best-for__name">
                {rec.carName}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
