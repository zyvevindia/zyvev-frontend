import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import ScorePerspectiveCard from "./ScorePerspectiveCard.jsx";

/**
 * Minimal EVSavari perspective on tools pages when ?vehicle= is set.
 * Tier badge + one-line summary only.
 */
export default function Score2ToolsPerspective({ vehicleSlug = "" }) {
  if (!vehicleSlug) {
    return null;
  }

  return (
    <ScorePerspectiveCard
      familySlug={vehicleSlug}
      variant="tools"
      oneLineSummary
      showExpand={false}
      showStrengths={false}
      showBestFor={false}
      analyticsViewEvent={ANALYTICS_EVENTS.SCORE2_VIEW_TOOLS}
      analyticsSource="tools"
      className="score2-perspective--tools-slot"
    />
  );
}
