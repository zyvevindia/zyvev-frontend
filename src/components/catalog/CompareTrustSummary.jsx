import { useEffect, useRef } from "react";

import { buildCompareTrustSummary } from "../../intelligence/compareTrustSummary.js";
import { trackCompareTrustViewed } from "../../analytics/funnel";

import "../../styles/ev-trust.css";

export default function CompareTrustSummary({ cars = [] }) {
  const tracked = useRef(false);
  const summary = buildCompareTrustSummary(cars);

  useEffect(() => {
    if (!summary.hasData || tracked.current) return;
    tracked.current = true;
    trackCompareTrustViewed({
      vehicleSlugs: (cars ?? []).map((c) => c?.slug).filter(Boolean),
    });
  }, [summary.hasData, cars]);

  if (!summary.hasData || cars.length < 2) return null;

  return (
    <section
      className="compare-trust-summary"
      aria-labelledby="compare-trust-summary-title"
    >
      <h2
        id="compare-trust-summary-title"
        className="compare-trust-summary__title"
      >
        Real-world comparison (estimated where noted)
      </h2>

      <div className="compare-trust-summary__row">
        <div className="compare-trust-summary__card">
          <h3>Range</h3>
          {summary.rangeRows.map((row) => (
            <p key={row.carId}>
              <strong>{row.carName}:</strong> {row.realWorld} real-world
              {row.claimed !== "—" ? ` · ${row.claimed} claimed` : ""}
              {row.confidence !== "—" ? ` · ${row.confidence}` : ""}
            </p>
          ))}
        </div>

        <div className="compare-trust-summary__card">
          <h3>Ownership (est.)</h3>
          {summary.ownershipRows.map((row) => (
            <p key={row.carId}>
              <strong>{row.carName}:</strong> {row.monthly}
              {row.savings !== "—" ? ` · ${row.savings}` : ""}
            </p>
          ))}
        </div>

        <div className="compare-trust-summary__card">
          <h3>Charging practicality</h3>
          {summary.chargingRows.map((row) => (
            <p key={row.carId}>
              <strong>{row.carName}:</strong> {row.practicality}
            </p>
          ))}
        </div>

        {summary.freshnessRows?.length > 0 && (
          <div className="compare-trust-summary__card">
            <h3>Data freshness</h3>
            {summary.freshnessRows.map((row) => (
              <p key={row.carId}>
                <strong>{row.carName}:</strong> {row.freshness}
                {row.updated !== "—" ? ` · ${row.updated}` : ""}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="ev-trust-panel__disclaimer">{summary.disclaimer}</p>
    </section>
  );
}
