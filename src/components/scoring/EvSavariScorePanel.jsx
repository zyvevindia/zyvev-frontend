import { useState } from "react";

import { trackScorePanelOpened } from "../../analytics/traffic";
import ScoreCircle from "../common/ScoreCircle";
import { DIMENSION_LABELS } from "../../scoring/scoreExplanations";
import "./ev-savari-score-panel.css";

function ScoreBar({ label, value, explanation }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="ev-score-bar">
      <div className="ev-score-bar__head">
        <span>{label}</span>
        <span>{pct}/100</span>
      </div>
      <div className="ev-score-bar__track">
        <div className="ev-score-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      {explanation ? (
        <p className="ev-score-bar__hint">{explanation}</p>
      ) : null}
    </div>
  );
}

const BREAKDOWN_ORDER = [
  "range",
  "charging",
  "performance",
  "feature",
  "safety",
  "value",
  "family",
  "city",
  "highway",
];

export default function EvSavariScorePanel({
  scores,
  compact = false,
  showVariants = true,
  collapsibleBreakdown = !compact,
  familySlug = null,
  sourcePage = "car_details",
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scores?.hasData && scores?.overall?.score == null) return null;

  const overall = scores.overall?.score;
  const grade = scores.overall?.grade;
  const breakdown = scores.breakdown || {};
  const explanation = scores.explanation || {};
  const variants = scores.variants || {};

  const bars = BREAKDOWN_ORDER.map((key) => ({
    key,
    label: DIMENSION_LABELS[key] || key,
    value: breakdown[key]?.score,
    explanation: compact ? null : breakdown[key]?.explanation,
  })).filter((row) => row.value != null);

  const hasInsights =
    !compact &&
    (explanation.strengths?.length > 0 || explanation.weaknesses?.length > 0);
  const hasVariants = showVariants && variants.hasData;
  const hasCollapsibleContent =
    bars.length > 0 || hasInsights || hasVariants;
  const showCollapsibleToggle =
    collapsibleBreakdown && hasCollapsibleContent;

  function handleToggleBreakdown() {
    setIsExpanded((open) => {
      const next = !open;
      if (next) {
        trackScorePanelOpened({
          familySlug,
          sourcePage,
          panelType: "detail_score_breakdown",
        });
      }
      return next;
    });
  }

  return (
    <div className={`ev-score-panel${compact ? " ev-score-panel--compact" : ""}`}>
      <div
        className={`ev-score-panel__header${
          showCollapsibleToggle
            ? " ev-score-panel__header--with-toggle"
            : ""
        }`}
      >
        {overall != null && (
          <ScoreCircle
            score={overall}
            className="ev-score-panel__gauge"
            valueClassName="ev-score-panel__gauge-value"
            suffixClassName="ev-score-panel__gauge-suffix"
          />
        )}
        <div className="ev-score-panel__headline">
          <p className="ev-score-panel__title">
            EVSavari score
            {grade ? (
              <span className="ev-score-panel__grade">{grade}</span>
            ) : null}
          </p>
          {explanation.summary ? (
            <p className="ev-score-panel__summary">{explanation.summary}</p>
          ) : null}
        </div>
      </div>

      {showCollapsibleToggle && (
        <button
          type="button"
          className="ev-score-panel__toggle"
          aria-expanded={isExpanded}
          aria-controls="ev-score-panel-breakdown"
          onClick={handleToggleBreakdown}
        >
          {isExpanded
            ? "▲ Hide score breakdown"
            : "▼ Show score breakdown"}
        </button>
      )}

      {(!collapsibleBreakdown || isExpanded) && hasCollapsibleContent && (
        <div
          id="ev-score-panel-breakdown"
          className="ev-score-panel__details"
        >
      {bars.length > 0 && (
        <div className="ev-score-panel__breakdown">
          {bars.map((row) => (
            <ScoreBar
              key={row.key}
              label={row.label}
              value={row.value}
              explanation={row.explanation}
            />
          ))}
        </div>
      )}

      {hasInsights && (
        <div className="ev-score-panel__insights">
          {explanation.strengths?.length > 0 && (
            <div className="ev-score-panel__insight">
              <h4>Strengths</h4>
              <ul>
                {explanation.strengths.slice(0, 4).map((item, i) => (
                  <li key={i}>{item.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {explanation.weaknesses?.length > 0 && (
            <div className="ev-score-panel__insight ev-score-panel__insight--weak">
              <h4>Weaknesses</h4>
              <ul>
                {explanation.weaknesses.slice(0, 4).map((item, i) => (
                  <li key={i}>{item.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {hasVariants && (
        <div className="ev-score-panel__variants">
          <h4>Variant recommendations</h4>
          <ul className="ev-score-panel__variant-list">
            {variants.recommended ? (
              <li>
                <strong>Recommended:</strong> {variants.recommended.variantName}
                {" — "}
                {variants.recommended.reason}
              </li>
            ) : null}
            {variants.bestValue &&
            variants.bestValue.variantName !== variants.recommended?.variantName ? (
              <li>
                <strong>Best value:</strong> {variants.bestValue.variantName}
                {" — "}
                {variants.bestValue.reason}
              </li>
            ) : null}
            {variants.longestRange ? (
              <li>
                <strong>Longest range:</strong> {variants.longestRange.variantName}
                {" — "}
                {variants.longestRange.reason}
              </li>
            ) : null}
            {variants.fastestCharging ? (
              <li>
                <strong>Fastest charging:</strong>{" "}
                {variants.fastestCharging.variantName}
                {" — "}
                {variants.fastestCharging.reason}
              </li>
            ) : null}
          </ul>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
