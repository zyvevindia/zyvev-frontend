import { formatConfidenceLevelLabel, formatScoreTierLabel } from "./score2DisplayUtils.js";
import "./score2.css";

/**
 * Qualitative tier badge — no stars, percentages, or numeric scores.
 */
export default function ScoreTierBadge({
  tier,
  className = "",
  size = "default",
}) {
  if (!tier) return null;

  const label = formatScoreTierLabel(tier);
  const rootClass = [
    "score2-tier-badge",
    `score2-tier-badge--${tier}`,
    size === "large" ? "score2-tier-badge--large" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={rootClass}>{label}</span>;
}

/**
 * Confidence trust badge.
 */
export function ScoreConfidenceBadge({
  level,
  className = "",
}) {
  if (!level) return null;

  const label = formatConfidenceLevelLabel(level);
  const rootClass = [
    "score2-confidence-badge",
    `score2-confidence-badge--${level}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={rootClass}>{label}</span>;
}
