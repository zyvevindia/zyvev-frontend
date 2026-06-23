import { SCORE_TIERS } from "../../score2/constants.js";
import { useScore2Profile } from "./useScore2Profile.js";
import { formatScoreTierLabel } from "./score2DisplayUtils.js";
import "./score2.css";

/** @type {ReadonlySet<string>} */
const DISCOVERY_BADGE_TIERS = new Set([
  SCORE_TIERS.EXCELLENT,
  SCORE_TIERS.GOOD,
  SCORE_TIERS.MODERATE,
  SCORE_TIERS.LIMITED,
]);

/**
 * Small neutral qualitative badge for discovery recommendation cards.
 */
export default function Score2QualitativeBadge({ familySlug = "" }) {
  const { profile, loaded, isTier1 } = useScore2Profile(familySlug);

  if (!isTier1 || !loaded || !profile?.score?.overall) {
    return null;
  }

  const tier = profile.score.overall;
  if (!DISCOVERY_BADGE_TIERS.has(tier)) {
    return null;
  }

  return (
    <span className="score2-qualitative-badge">{formatScoreTierLabel(tier)}</span>
  );
}
