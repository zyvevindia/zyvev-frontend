import { Link } from "react-router-dom";

import { buildAssistantComparePeers } from "../../aiAssistant/buildAssistantComparePeers.js";
import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { trackAnalytics } from "../../analytics/track.js";
import {
  buildReviewSlug,
  isEditorialReviewAvailable,
  reviewPagePath,
} from "../../reviews/reviewRoutes.js";
import { buildOwnershipToolHref } from "../../tools/ownershipToolLinks.js";
import { useAssistantShortlist } from "../../hooks/useAssistantShortlist.js";
import { useAssistantIntent } from "./AssistantIntentProvider.jsx";

/**
 * @param {{
 *   vehicleSlug: string,
 *   vehicleName: string,
 *   journey: import("../../buyerJourney/types.js").BuyerJourneyResult,
 *   sourcePage: string,
 * }} props
 */
export default function AssistantActionCenter({
  vehicleSlug,
  vehicleName,
  journey,
  sourcePage,
}) {
  const { add, remove, isListed, max, count } = useAssistantShortlist();
  const { markOwnershipUsed, markCompareUsed, markReviewViewed } = useAssistantIntent();

  const comparePeers = buildAssistantComparePeers(vehicleSlug, journey, 1);
  const primaryCompare = comparePeers[0] || null;
  const reviewAvailable = isEditorialReviewAvailable(vehicleSlug);
  const listed = isListed(vehicleSlug);

  const handleShortlistToggle = () => {
    if (listed) {
      remove(vehicleSlug);
      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_REMOVE, {
        source_page: sourcePage,
        vehicle_slug: vehicleSlug,
      });
      return;
    }

    const result = add({ vehicleSlug, vehicleName });
    if (result.added) {
      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_SHORTLIST_ADD, {
        source_page: sourcePage,
        vehicle_slug: vehicleSlug,
        shortlist_count: count + 1,
      });
    }
  };

  return (
    <div className="assistant-action-center" aria-label={`Actions for ${vehicleName}`}>
      {primaryCompare ? (
        <Link
          to={primaryCompare.href}
          className="assistant-action-center__action"
          onClick={() =>
            markCompareUsed(vehicleSlug, primaryCompare.compareSlug)
          }
        >
          Compare Similar EVs
        </Link>
      ) : (
        <span
          className="assistant-action-center__action assistant-action-center__action--disabled"
          aria-disabled="true"
        >
          Compare Similar EVs
        </span>
      )}

      <Link
        to={buildOwnershipToolHref("tco", vehicleSlug)}
        className="assistant-action-center__action"
        onClick={() => markOwnershipUsed(vehicleSlug, "tco")}
      >
        Estimate Ownership Cost
      </Link>

      <Link
        to={buildOwnershipToolHref("emi", vehicleSlug)}
        className="assistant-action-center__action"
        onClick={() => markOwnershipUsed(vehicleSlug, "emi")}
      >
        Calculate EMI
      </Link>

      <Link
        to={buildOwnershipToolHref("savings-vs-petrol", vehicleSlug)}
        className="assistant-action-center__action"
        onClick={() => markOwnershipUsed(vehicleSlug, "savings-vs-petrol")}
      >
        Compare With Petrol
      </Link>

      {reviewAvailable ? (
        <Link
          to={reviewPagePath(buildReviewSlug(vehicleSlug))}
          className="assistant-action-center__action"
          onClick={() => markReviewViewed(vehicleSlug)}
        >
          Read Expert Review
        </Link>
      ) : (
        <span
          className="assistant-action-center__action assistant-action-center__action--disabled"
          aria-disabled="true"
        >
          Read Expert Review
        </span>
      )}

      <button
        type="button"
        className={`assistant-action-center__action assistant-action-center__action--button${
          listed ? " assistant-action-center__action--listed" : ""
        }`}
        onClick={handleShortlistToggle}
        disabled={!listed && count >= max}
        aria-pressed={listed}
        aria-label={
          listed
            ? `Remove ${vehicleName} from shortlist`
            : count >= max
              ? `Shortlist full (${max} vehicles)`
              : `Add ${vehicleName} to shortlist`
        }
      >
        {listed ? "Remove from Shortlist" : "Add to Shortlist"}
      </button>
    </div>
  );
}
