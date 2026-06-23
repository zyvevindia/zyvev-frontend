import { useCallback, useState } from "react";

import { startCompareWithSingleRival } from "../../utils/compareRivalPrefill";
import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

import OwnershipToolSecondaryLink from "../tools/OwnershipToolSecondaryLink.jsx";
import Score2QualitativeBadge from "../score2/Score2QualitativeBadge.jsx";

import "../tools/vehicle-ownership-tools.css";
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
            <h3 className="people-also-compare__card-title">
              <span>{item.title}</span>
              <Score2QualitativeBadge familySlug={item.slug} />
            </h3>
            <div className="recommendation-loop-card__actions">
              <button
                type="button"
                className="people-also-compare__cta"
                disabled={loadingSlug != null}
                onClick={() => handleCompare(item.slug)}
              >
                {loadingSlug === item.slug ? "Opening…" : "Compare →"}
              </button>
              <OwnershipToolSecondaryLink
                toolKey="tco"
                vehicleSlug={item.slug}
                className="ownership-tool-link--muted"
              >
                Ownership cost →
              </OwnershipToolSecondaryLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
