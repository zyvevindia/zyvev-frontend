import CatalogTrustBadge from "../catalog/CatalogTrustBadge";
import ScoreCircle from "../common/ScoreCircle";
import EvSavariScorePanel from "../scoring/EvSavariScorePanel";
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

      {(headlineScore != null || v1Scores?.hasData) &&
        (v1Scores?.hasData ? (
          <EvSavariScorePanel
            scores={v1Scores}
            showVariants={!familyOverviewMode}
            collapsibleBreakdown
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
              <div className="cd-overview-dashboard__score-bars">
                {categoryScores.map((row) => (
                  <ScoreBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

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
