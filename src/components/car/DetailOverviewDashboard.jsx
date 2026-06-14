import { useState } from "react";

import CatalogTrustBadge from "../catalog/CatalogTrustBadge";
import ScoreCircle from "../common/ScoreCircle";
import EvSavariScorePanel from "../scoring/EvSavariScorePanel";
import ScoreStrengthsWeaknesses from "../scoring/ScoreStrengthsWeaknesses";
import RecommendationInsightsCard from "../scoring/RecommendationInsightsCard";
import PersonaChips from "../scoring/PersonaChips";
import OwnershipIntelligenceCard from "../scoring/OwnershipIntelligenceCard";
import ChargingIntelligenceCard from "../scoring/ChargingIntelligenceCard";
import HighwayConfidenceCard from "../scoring/HighwayConfidenceCard";
import FamilyIntelligenceCard from "../scoring/FamilyIntelligenceCard";
import ServiceConfidenceCard from "../scoring/ServiceConfidenceCard";
import { formatPsychologyTag } from "../../utils/catalogExperience";
import {
  buildRangeConfidence,
  formatRangeConfidenceLabel,
} from "../../intelligence/rangeConfidence";

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

export default function DetailOverviewDashboard({
  overview,
  overviewSupplement,
  features = [],
  catalogMeta,
  catalogSource,
  vehicle = null,
  familyOverviewMode = false,
  evSavariScores = null,
}) {
  const meta = catalogMeta;
  const v1Scores = evSavariScores || vehicle?.evSavariScores || null;
  const rangeIntel =
    !familyOverviewMode && vehicle
      ? buildRangeConfidence(vehicle)
      : null;
  const categoryScores = buildCategoryScores(meta);
  const headlineScore =
    v1Scores?.overall?.score ??
    getHeadlineScore(meta, categoryScores);
  const scoreBlurb =
    v1Scores?.explanation?.summary ?? getScoreBlurb(meta, headlineScore);
  const fitTags = meta?.psychologyTags || [];
  const pros = meta?.pros || [];
  const cons = meta?.cons || [];
  const showFitLife =
    fitTags.length > 0 || meta?.compareValueScore != null;
  const useV1ScorePanel = shouldUseV1ScorePanel(v1Scores);
  const familySlug =
    vehicle?.familySlug || vehicle?.slug || null;
  const [legacyBreakdownExpanded, setLegacyBreakdownExpanded] =
    useState(false);

  return (
    <div className="cd-overview-dashboard">
      <header className="cd-overview-dashboard__top">
        <h2 className="cd-section__title">Overview</h2>
        <p className="cd-section__intro cd-overview-dashboard__desc">
          {overview}
        </p>
        {overviewSupplement ? (
          <p className="cd-section__intro cd-overview-supplement">
            {overviewSupplement}
          </p>
        ) : null}
        <CatalogTrustBadge
          catalogMeta={meta}
          catalogSource={catalogSource}
        />
        {rangeIntel?.hasData && rangeIntel.estimatedRealWorldKm && (
          <p className="cd-overview-range-confidence">
            Est. real-world range{" "}
            <strong>
              {rangeIntel.estimatedRealWorldKm.min}–
              {rangeIntel.estimatedRealWorldKm.max} km
            </strong>
            {" · "}
            {formatRangeConfidenceLabel(rangeIntel)}
          </p>
        )}
      </header>

      {(headlineScore != null || useV1ScorePanel) &&
        (useV1ScorePanel ? (
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
                  aria-controls="cd-legacy-score-breakdown"
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
                    id="cd-legacy-score-breakdown"
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
        ))}

      {vehicle && !useV1ScorePanel ? (
        <ScoreStrengthsWeaknesses vehicle={vehicle} layout="card" />
      ) : null}

      {!familyOverviewMode && vehicle ? (
        <div
          id="ev-intelligence"
          className="cd-ev-intelligence-anchor"
          aria-hidden="true"
        />
      ) : null}

      {vehicle ? (
        <RecommendationInsightsCard vehicle={vehicle} layout="card" />
      ) : null}

      {vehicle ? <PersonaChips vehicle={vehicle} layout="card" /> : null}

      {vehicle ? (
        <OwnershipIntelligenceCard vehicle={vehicle} layout="card" />
      ) : null}

      {vehicle ? (
        <ChargingIntelligenceCard vehicle={vehicle} layout="card" />
      ) : null}

      {vehicle ? (
        <HighwayConfidenceCard vehicle={vehicle} layout="card" />
      ) : null}

      {vehicle ? (
        <FamilyIntelligenceCard vehicle={vehicle} layout="card" />
      ) : null}

      {vehicle ? (
        <ServiceConfidenceCard vehicle={vehicle} layout="card" />
      ) : null}

      <div className="cd-overview-dashboard__grid">
        {features.length > 0 && (
          <div className="cd-overview-dashboard__panel">
            <h3 className="cd-overview-dashboard__panel-title">
              Features
            </h3>
            <div className="cd-overview-dashboard__chips">
              {features.slice(0, 8).map((item) => (
                <span
                  key={typeof item === "string" ? item : String(item)}
                  className="cd-overview-dashboard__chip"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {showFitLife && (
          <div className="cd-overview-dashboard__panel">
            <h3 className="cd-overview-dashboard__panel-title">
              Should this EV fit your life?
            </h3>
            {fitTags.length > 0 && (
              <div className="cd-overview-dashboard__chips">
                {fitTags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="cd-overview-dashboard__chip cd-overview-dashboard__chip--tag"
                  >
                    {formatPsychologyTag(tag)}
                  </span>
                ))}
              </div>
            )}
            {meta?.compareValueScore != null && (
              <p className="cd-overview-dashboard__value-score">
                EVSavari value score:{" "}
                <strong>{meta.compareValueScore}/100</strong> in its
                segment
              </p>
            )}
          </div>
        )}
      </div>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="cd-overview-dashboard__insights">
          {pros.length > 0 && (
            <div className="cd-overview-dashboard__insight-card">
              <h3 className="cd-overview-dashboard__panel-title">
                What owners love
              </h3>
              <ul className="cd-overview-dashboard__list cd-overview-dashboard__list--pro">
                {pros.slice(0, 4).map((item) => (
                  <li key={typeof item === "string" ? item : String(item)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div className="cd-overview-dashboard__insight-card">
              <h3 className="cd-overview-dashboard__panel-title">
                Honest trade-offs
              </h3>
              <ul className="cd-overview-dashboard__list cd-overview-dashboard__list--con">
                {cons.slice(0, 4).map((item) => (
                  <li key={typeof item === "string" ? item : String(item)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
