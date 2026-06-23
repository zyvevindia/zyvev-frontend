import { useEffect, useId, useState } from "react";

import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { trackAnalytics } from "../../analytics/track.js";
import ScoreConfidenceCard from "./ScoreConfidenceCard.jsx";
import ScorePersonaCard from "./ScorePersonaCard.jsx";
import { useScore2Profile } from "./useScore2Profile.js";
import { formatScoreTierLabel } from "./score2DisplayUtils.js";
import "./score2.css";

/**
 * @param {string} text
 * @returns {string}
 */
function firstSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";

  const match = value.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : value;
}

/**
 * @param {{
 *   familySlug?: string,
 *   variant?: "full" | "compact" | "mini" | "tools",
 *   title?: string,
 *   showExpand?: boolean,
 *   showStrengths?: boolean,
 *   showBestFor?: boolean,
 *   maxStrengths?: number,
 *   maxBestFor?: number,
 *   oneLineSummary?: boolean,
 *   analyticsViewEvent?: string|null,
 *   analyticsSource?: string,
 *   className?: string,
 *   shellClassName?: string,
 * }} props
 */
export default function ScorePerspectiveCard({
  familySlug = "",
  variant = "full",
  title = "EVSavari Perspective",
  showExpand = true,
  showStrengths = true,
  showBestFor = true,
  maxStrengths = 3,
  maxBestFor = 3,
  oneLineSummary = false,
  analyticsViewEvent = null,
  analyticsSource = "car_details",
  className = "",
  shellClassName = "",
}) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const [allowExpand, setAllowExpand] = useState(showExpand);

  const { profile, loaded, isTier1 } = useScore2Profile(familySlug, {
    analyticsViewEvent,
    analyticsSource,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !showExpand) {
      setAllowExpand(false);
      return;
    }

    const media = window.matchMedia("(max-width: 390px)");

    const syncExpand = () => {
      setAllowExpand(showExpand && !media.matches);
      if (media.matches) {
        setExpanded(false);
      }
    };

    syncExpand();
    media.addEventListener("change", syncExpand);

    return () => {
      media.removeEventListener("change", syncExpand);
    };
  }, [showExpand]);

  if (!isTier1 || !loaded || !profile) {
    return null;
  }

  const { score, recommendation, confidence, explanation } = profile;
  const isToolsVariant = variant === "tools";
  const strengths = (explanation.strengths || []).slice(0, maxStrengths);
  const bestFor = showBestFor ? (explanation.bestFor || []).slice(0, maxBestFor) : [];
  const summaryText =
    oneLineSummary || isToolsVariant
      ? firstSentence(explanation.summary)
      : explanation.summary;

  const rootClass = [
    "score2-perspective",
    shellClassName,
    variant === "compact" ? "score2-perspective--compact" : "",
    variant === "mini" ? "score2-perspective--mini" : "",
    variant === "tools" ? "score2-perspective--tools" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleToggleDetails = () => {
    const nextExpanded = !expanded;

    if (nextExpanded) {
      trackAnalytics(ANALYTICS_EVENTS.SCORE2_PERSPECTIVE_EXPAND, {
        family_slug: profile.vehicleSlug,
        overall_tier: score.overall,
        source_page: analyticsSource,
      });
    }

    setExpanded(nextExpanded);
  };

  return (
    <section className={rootClass} aria-label={title}>
      {isToolsVariant ? (
        <div className="score2-perspective__tools-row">
          {score.overall ? (
            <span
              className={`score2-perspective__tier score2-perspective__tier--${score.overall}`}
            >
              {formatScoreTierLabel(score.overall)}
            </span>
          ) : null}
          {summaryText ? (
            <p className="score2-perspective__summary score2-perspective__summary--tools">
              {summaryText}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="score2-perspective__header">
            <div className="score2-perspective__heading-block">
              <p className="score2-perspective__eyebrow">{title}</p>
              {score.overall ? (
                <span
                  className={`score2-perspective__tier score2-perspective__tier--${score.overall}`}
                >
                  {formatScoreTierLabel(score.overall)}
                </span>
              ) : null}
            </div>
          </div>

          {summaryText ? (
            <p className="score2-perspective__summary">{summaryText}</p>
          ) : null}

          {showStrengths && strengths.length ? (
            <div className="score2-perspective__block">
              <h3 className="score2-perspective__block-title">Strengths</h3>
              <ul className="score2-perspective__list">
                {strengths.map((item) => (
                  <li key={item} className="score2-perspective__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {bestFor.length ? (
            <div className="score2-perspective__block">
              <h3 className="score2-perspective__block-title">Best for</h3>
              <ul className="score2-perspective__tags">
                {bestFor.map((item) => (
                  <li key={item} className="score2-perspective__tag">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {allowExpand ? (
        <button
          type="button"
          className="score2-perspective__toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={handleToggleDetails}
        >
          Why we think this →
        </button>
      ) : null}

      {allowExpand && expanded ? (
        <div id={detailsId} className="score2-perspective__details">
          {explanation.weaknesses?.length ? (
            <div className="score2-perspective__block">
              <h3 className="score2-perspective__block-title">Weaknesses</h3>
              <ul className="score2-perspective__list">
                {explanation.weaknesses.map((item) => (
                  <li key={item} className="score2-perspective__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {explanation.avoidIf?.length ? (
            <div className="score2-perspective__block">
              <h3 className="score2-perspective__block-title">Avoid if</h3>
              <ul className="score2-perspective__list">
                {explanation.avoidIf.map((item) => (
                  <li key={item} className="score2-perspective__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ScorePersonaCard
            recommendation={recommendation}
            className="score2-perspective__nested-card"
          />
          <ScoreConfidenceCard
            confidence={confidence}
            className="score2-perspective__nested-card"
          />
        </div>
      ) : null}
    </section>
  );
}
