import { useCallback, useState } from "react";

import { startCompareWithSingleRival } from "../../utils/compareRivalPrefill";
import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

import "./people-also-compare.css";

export default function PeopleAlsoCompareSection({
  currentVehicle,
  comparisons = [],
  navigate,
}) {
  const [loadingSlug, setLoadingSlug] = useState(null);

  const handleCompare = useCallback(
    async (rivalSlug) => {
      if (!currentVehicle || !navigate || !rivalSlug) return;

      setLoadingSlug(rivalSlug);
      try {
        trackBuyerEvent(BUYER_EVENTS.COMPARE_STARTED, {
          vehicleSlugs: [currentVehicle.slug, rivalSlug].filter(Boolean),
          sourcePage: window.location.pathname,
          sessionIntent: "people_also_compare",
        });

        await startCompareWithSingleRival({
          currentCar: currentVehicle,
          rivalSlug,
          navigate,
        });
      } finally {
        setLoadingSlug(null);
      }
    },
    [currentVehicle, navigate]
  );

  if (!comparisons.length) return null;

  return (
    <section
      className="people-also-compare"
      aria-labelledby="people-also-compare-title"
    >
      <h2 id="people-also-compare-title" className="cd-section__title">
        People also compare
      </h2>
      <p className="cd-section__intro people-also-compare__intro">
        Shoppers considering this EV also explore these alternatives.
      </p>

      <div className="people-also-compare__grid">
        {comparisons.map((item) => (
          <article key={item.slug} className="people-also-compare__card">
            <h3 className="people-also-compare__card-title">{item.title}</h3>
            <button
              type="button"
              className="people-also-compare__cta"
              disabled={loadingSlug != null}
              onClick={() => handleCompare(item.slug)}
            >
              {loadingSlug === item.slug ? "Opening…" : "Compare →"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
