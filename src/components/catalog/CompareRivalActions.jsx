import { Link } from "react-router-dom";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import { useCompareRivalPrefill } from "../../utils/compareRivalPrefill";
import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

import "../../styles/compare-rival-actions.css";

function slugToLabel(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detail-page "Compare with" rivals — one-click prefilled compare sessions.
 */
export default function CompareRivalActions({
  car,
  rivalSlugs = [],
  maxRivals = 5,
  sourcePage = "",
}) {
  const rivals = [...new Set(rivalSlugs)]
    .filter(Boolean)
    .slice(0, maxRivals);

  const { compareWithRivals, compareWithRival, loadingSlug } =
    useCompareRivalPrefill(car);

  if (!car || rivals.length === 0) return null;

  const trackStart = (slugs, intent) => {
    trackBuyerEvent(BUYER_EVENTS.COMPARE_STARTED, {
      vehicleSlugs: slugs,
      sourcePage: sourcePage || window.location.pathname,
      sessionIntent: intent,
    });
  };

  return (
    <div className="compare-rival-actions">
      <div
        className="compare-rival-actions__chips"
        role="list"
        aria-label="Compare with rival EVs"
      >
        {rivals.map((rivalSlug) => (
          <div key={rivalSlug} role="listitem">
            <button
              type="button"
              className="compare-rival-actions__chip"
              disabled={loadingSlug != null}
              aria-label={`Compare with ${slugToLabel(rivalSlug)}`}
              onClick={() => {
                trackStart(
                  [car.slug, rivalSlug].filter(Boolean),
                  "detail_compare_single_rival"
                );
                compareWithRival(rivalSlug);
              }}
            >
              {loadingSlug === rivalSlug ? "Opening…" : slugToLabel(rivalSlug)}
            </button>
            <Link
              to={vehicleDetailPath(rivalSlug)}
              className="compare-rival-actions__detail-link"
            >
              View
            </Link>
          </div>
        ))}
      </div>

      {rivals.length >= 2 ? (
        <button
          type="button"
          className="compare-rival-actions__all-btn"
          disabled={loadingSlug != null}
          aria-label={`Compare with ${rivals.length} rivals`}
          onClick={() => {
            trackStart(
              [car.slug, ...rivals].filter(Boolean),
              "detail_compare_all_rivals"
            );
            compareWithRivals(rivals);
          }}
        >
          {loadingSlug === "__all__"
            ? "Opening compare…"
            : `Compare all (${Math.min(rivals.length + 1, 3)} EVs)`}
        </button>
      ) : null}
    </div>
  );
}
