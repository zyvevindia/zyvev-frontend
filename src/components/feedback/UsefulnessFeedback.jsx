import { useState } from "react";

import { submitUsefulnessFeedback } from "../../services/feedbackApi";
import {
  trackUsefulnessFeedback,
  trackIncorrectDataReport,
} from "../../analytics/funnel";
import { useReportIssue } from "./ReportIssueProvider";

import "../../styles/usefulness-feedback.css";

/**
 * Minimal "Was this useful?" — no popups.
 */
export default function UsefulnessFeedback({
  context = "compare",
  sourcePage = "",
  metadata = {},
  showReportLink = true,
}) {
  const [vote, setVote] = useState(null);
  const [busy, setBusy] = useState(false);
  const { openReportIssue } = useReportIssue();

  const submit = async (useful) => {
    if (vote != null || busy) return;
    setBusy(true);
    setVote(useful);

    try {
      await submitUsefulnessFeedback({
        useful,
        context,
        route: sourcePage,
        metadata,
      });
      trackUsefulnessFeedback({
        useful,
        context,
        sourcePage,
      });
    } catch {
      setVote(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="usefulness-feedback" aria-label="Section feedback">
      <span className="usefulness-feedback__label">Was this useful?</span>
      <div className="usefulness-feedback__actions">
        <button
          type="button"
          className={`usefulness-feedback__btn${vote === true ? " usefulness-feedback__btn--active" : ""}`}
          disabled={vote != null || busy}
          onClick={() => submit(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`usefulness-feedback__btn${vote === false ? " usefulness-feedback__btn--active" : ""}`}
          disabled={vote != null || busy}
          onClick={() => submit(false)}
        >
          Not really
        </button>
      </div>
      {vote != null && (
        <span className="usefulness-feedback__thanks">Thanks — this helps us improve.</span>
      )}
      {showReportLink && (
        <button
          type="button"
          className="usefulness-feedback__report"
          onClick={() => {
            trackIncorrectDataReport({ context, sourcePage });
            openReportIssue({
              defaultCategory: context === "compare" ? "compare" : "wrong_data",
              context: { ...metadata, sourcePage, feedbackContext: context },
            });
          }}
        >
          Report incorrect EV data
        </button>
      )}
    </div>
  );
}
