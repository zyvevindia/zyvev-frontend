import { useState } from "react";

import ScoreCircle from "../common/ScoreCircle";
import EvSavariScorePanel from "../scoring/EvSavariScorePanel";

function ScoreBar({ label, value }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="cd-overview-score-bar">
      <div className="cd-overview-score-bar__head">
        <span>{label}</span>
        <span>{pct}/100</span>
      </div>
      <div className="cd-overview-score-bar__track">
        <div
          className="cd-overview-score-bar__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function buildCategoryScores(meta) {
  if (!meta) return [];

  const suit = meta.suitabilityScores || {};
  const psych = meta.psychologyScores || {};
  const suitValues = [suit.family, suit.city, suit.highway].filter(
    (v) => v != null
  );
  const ownershipAvg = suitValues.length
    ? Math.round(
        suitValues.reduce((a, b) => a + b, 0) / suitValues.length
      )
    : null;

  const featureCandidates = [
    psych.premium_feel,
    psych.tech_appeal,
    psych.wow_factor,
  ].filter((v) => v != null);
  const featuresScore = featureCandidates.length
    ? Math.round(Math.max(...featureCandidates))
    : null;

  return [
    { label: "Range & performance", value: suit.highway ?? psych.long_range },
    { label: "Ownership confidence", value: ownershipAvg },
    { label: "Features & tech", value: featuresScore },
    { label: "Value for money", value: meta.compareValueScore },
  ].filter((row) => row.value != null);
}

function getHeadlineScore(meta, categoryScores) {
  if (meta?.compareValueScore != null) {
    return meta.compareValueScore;
  }
  if (categoryScores.length) {
    return Math.round(
      categoryScores.reduce((a, b) => a + b.value, 0) /
        categoryScores.length
    );
  }
  return meta?.dataQualityScore ?? null;
}

function shouldUseV1ScorePanel(scores) {
  if (!scores) return false;
  if (scores.hasData === true) return true;
  if (scores.overall?.score != null) return true;
  return Object.values(scores.breakdown || {}).some(
    (row) => row?.score != null
  );
}

function getScoreBlurb(meta, headlineScore) {
  if (meta?.psychologyNarrative) {
    return meta.psychologyNarrative;
  }
  if (meta?.compareNarrative?.tradeoffSummary) {
    return meta.compareNarrative.tradeoffSummary;
  }
  if (headlineScore != null) {
    if (headlineScore >= 85) {
      return "Great choice in its segment — strong editorial confidence across range, ownership, and value.";
    }
    if (headlineScore >= 75) {
      return "Solid option in its segment with a balanced mix of range, features, and ownership confidence.";
    }
    return "Worth comparing trims and rivals before you decide — review trade-offs below.";
  }
  return null;
}

export function hasEvIntelligenceScore(vehicle, evSavariScores = null) {
  if (!vehicle) return false;

  const v1Scores = evSavariScores || vehicle?.evSavariScores || null;
  if (shouldUseV1ScorePanel(v1Scores)) return true;

  const meta = vehicle?.catalogMeta;
  const categoryScores = buildCategoryScores(meta);
  return getHeadlineScore(meta, categoryScores) != null;
}

export default function EvIntelligenceScorePanel({
  vehicle = null,
  evSavariScores = null,
  catalogMeta = null,
  familyOverviewMode = false,
  compact = false,
}) {
  const meta = catalogMeta || vehicle?.catalogMeta;
  const v1Scores = evSavariScores || vehicle?.evSavariScores || null;
  const categoryScores = buildCategoryScores(meta);
  const headlineScore =
    v1Scores?.overall?.score ?? getHeadlineScore(meta, categoryScores);
  const scoreBlurb =
    v1Scores?.explanation?.summary ?? getScoreBlurb(meta, headlineScore);
  const useV1ScorePanel = shouldUseV1ScorePanel(v1Scores);
  const familySlug = vehicle?.familySlug || vehicle?.slug || null;
  const [legacyBreakdownExpanded, setLegacyBreakdownExpanded] =
    useState(false);

  if (headlineScore == null && !useV1ScorePanel) {
    return null;
  }

  return (
    <div
      className={[
        "unified-ev-intelligence__score-block",
        compact ? "unified-ev-intelligence__score-block--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {useV1ScorePanel ? (
        <EvSavariScorePanel
          scores={v1Scores}
          vehicle={vehicle}
          showVariants={!familyOverviewMode}
          collapsibleBreakdown={true}
          familySlug={familySlug}
        />
      ) : (
        <div className="cd-overview-dashboard__score-panel">
          <div className="cd-overview-dashboard__score-main">
            <ScoreCircle
              score={headlineScore}
              className="cd-overview-dashboard__gauge"
              valueClassName="cd-overview-dashboard__gauge-value"
              suffixClassName="cd-overview-dashboard__gauge-suffix"
            />
            <div className="cd-overview-dashboard__score-copy">
              <p className="cd-overview-dashboard__score-label">
                EVSavari score
              </p>
              {scoreBlurb ? (
                <p className="cd-overview-dashboard__score-blurb">
                  {scoreBlurb}
                </p>
              ) : null}
            </div>
          </div>
          {categoryScores.length > 0 && (
            <>
              <button
                type="button"
                className="ev-score-panel__toggle cd-overview-dashboard__score-toggle"
                aria-expanded={legacyBreakdownExpanded}
                aria-controls="unified-ev-intelligence-score-breakdown"
                onClick={() =>
                  setLegacyBreakdownExpanded((open) => !open)
                }
              >
                {legacyBreakdownExpanded
                  ? "▲ Hide score breakdown"
                  : "▼ Show score breakdown"}
              </button>
              {legacyBreakdownExpanded && (
                <div
                  id="unified-ev-intelligence-score-breakdown"
                  className="cd-overview-dashboard__score-bars"
                >
                  {categoryScores.map((row) => (
                    <ScoreBar
                      key={row.label}
                      label={row.label}
                      value={row.value}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
