import { useState } from "react";

import {
  buildCompareScoreInsight,
} from "../../utils/compareConfidence";
import {
  buildConfidenceDataNote,
  buildScoreMaturityHint,
} from "../../utils/compareTrustCopy";
import { trackTrustTooltipOpened } from "../../analytics/funnel";
import "./compare-score-insight.css";

/**
 * Score label + confidence chip + “why this score” tooltip.
 */
export default function CompareScoreInsight({ car }) {
  const [open, setOpen] = useState(false);
  const insight = buildCompareScoreInsight(car);

  if (insight.score == null && !insight.whySummary) return null;

  return (
    <div className="compare-score-insight">
      <div className="compare-score-insight__labels">
        <span className="compare-score-insight__title">EVSavari Score</span>
        {insight.confidence ? (
          <span
            className={`compare-score-insight__confidence compare-score-insight__confidence--${insight.confidence}`}
            title={insight.confidenceLabel}
          >
            {insight.confidenceLabel}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="compare-score-insight__why"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              trackTrustTooltipOpened({
                field: "compare_score",
                familySlug: car?.slug,
                sourcePage: "compare",
              });
            }
            return next;
          });
        }}
        aria-expanded={open}
        aria-label="Why this score"
      >
        Why this score?
      </button>
      {open ? (
        <div className="compare-score-insight__panel" role="tooltip">
          <p style={{ margin: "0 0 6px" }}>{insight.whySummary}</p>
          {buildConfidenceDataNote(car) ? (
            <p className="compare-score-insight__estimate-note" style={{ margin: "0 0 6px" }}>
              {buildConfidenceDataNote(car)}
            </p>
          ) : null}
          {insight.estimatedLabel ? (
            <p className="compare-score-insight__estimate-note" style={{ margin: "0 0 6px" }}>
              {insight.estimatedLabel}
            </p>
          ) : null}
          {buildScoreMaturityHint(car) ? (
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
              {buildScoreMaturityHint(car)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
