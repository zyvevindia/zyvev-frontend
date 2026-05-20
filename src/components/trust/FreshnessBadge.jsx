import { FRESHNESS_STATE } from "../../intelligence/freshnessMetadata.js";
import { trackFreshnessBadgeOpened } from "../../analytics/funnel";

import "../../styles/ev-trust.css";

const STATE_CLASS = {
  [FRESHNESS_STATE.FRESH]: "ev-freshness-badge--fresh",
  [FRESHNESS_STATE.RECENTLY_VERIFIED]: "ev-freshness-badge--verified",
  [FRESHNESS_STATE.NEEDS_REVIEW]: "ev-freshness-badge--review",
  [FRESHNESS_STATE.POTENTIALLY_STALE]: "ev-freshness-badge--stale",
};

export default function FreshnessBadge({
  freshness,
  compact = false,
  sourcePage = "car_detail",
  familySlug = "",
}) {
  if (!freshness?.state) return null;

  const label = freshness.stateLabel || freshness.state;
  const className = STATE_CLASS[freshness.state] || "ev-freshness-badge--review";

  return (
    <button
      type="button"
      className={`ev-freshness-badge ${className} ${compact ? "ev-freshness-badge--compact" : ""}`}
      title={freshness.freshnessExplanation || label}
      onClick={() =>
        trackFreshnessBadgeOpened({
          state: freshness.state,
          familySlug,
          sourcePage,
        })
      }
    >
      {compact && freshness.isStale ? "!" : null}
      {label}
    </button>
  );
}
