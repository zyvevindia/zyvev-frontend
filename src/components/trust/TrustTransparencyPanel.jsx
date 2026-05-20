import { useState } from "react";

import { getConfidenceLabel } from "../../intelligence/trustMetadata.js";
import {
  trackTrustTooltipOpened,
  trackTrustFaqEngaged,
} from "../../analytics/funnel";
import FreshnessBadge from "./FreshnessBadge";
import CatalogTransparencyNotes from "./CatalogTransparencyNotes";

import "../../styles/ev-trust.css";

export default function TrustTransparencyPanel({
  trust,
  range,
  ownership,
  curation,
  sourcePage = "car_detail",
  familySlug = "",
}) {
  const [faqOpen, setFaqOpen] = useState(null);

  if (!trust) return null;

  const onFaqToggle = (id) => {
    const next = faqOpen === id ? null : id;
    setFaqOpen(next);
    if (next) {
      trackTrustFaqEngaged({ faqId: id, familySlug, sourcePage });
    }
  };

  return (
    <section
      className="ev-trust-panel"
      aria-labelledby="ev-trust-panel-title"
    >
      <h2 id="ev-trust-panel-title" className="cd-section__title">
        How we show EV data
      </h2>
      <p className="ev-trust-panel__intro">{trust.transparencyIntro}</p>

      <div className="ev-trust-panel__meta">
        <span className="ev-trust-panel__chip">
          Overall: {getConfidenceLabel(trust.overallConfidence)}
        </span>
        {trust.freshness && (
          <FreshnessBadge
            freshness={trust.freshness}
            compact
            sourcePage={sourcePage}
            familySlug={familySlug}
          />
        )}
        {trust.reviewed && (
          <span className="ev-trust-panel__chip ev-trust-panel__chip--verified">
            Editorially reviewed
          </span>
        )}
        {trust.partialIntelligence && (
          <span className="ev-trust-panel__chip ev-trust-panel__chip--partial">
            Partial data — some sections unavailable
          </span>
        )}
      </div>

      {trust.freshnessExplanation && (
        <p className="ev-trust-panel__method">{trust.freshnessExplanation}</p>
      )}

      <CatalogTransparencyNotes
        transparency={trust.transparency}
        sourcePage={sourcePage}
        familySlug={familySlug}
      />

      {curation?.editorialNotes?.length > 0 && (
        <ul className="ev-trust-panel__notes">
          {curation.editorialNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {range?.estimateMethod && (
        <p className="ev-trust-panel__method">
          <button
            type="button"
            className="ev-trust-panel__link-btn"
            onClick={() =>
              trackTrustTooltipOpened({
                field: "range_estimate_method",
                familySlug,
                sourcePage,
              })
            }
          >
            Range method
          </button>
          : {range.estimateMethod.replace(/_/g, " ")} ·{" "}
          {range.confidenceExplanation || range.explanation}
        </p>
      )}

      {ownership?.disclaimer && (
        <p className="ev-trust-panel__disclaimer">{ownership.disclaimer}</p>
      )}

      {trust.faqAnchors?.length > 0 && (
        <div className="ev-trust-panel__faq">
          {trust.faqAnchors.map((item) => (
            <details
              key={item.id}
              open={faqOpen === item.id}
              onToggle={(e) => {
                if (e.target.open) onFaqToggle(item.id);
                else setFaqOpen(null);
              }}
            >
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
