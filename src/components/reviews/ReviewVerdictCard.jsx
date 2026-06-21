/**
 * @param {{ verdict: import("../../reviews/types.js").ReviewVerdict }} props
 */
export default function ReviewVerdictCard({ verdict }) {
  const headline = String(verdict?.headline || "").trim();
  const summary = String(verdict?.summary || "").trim();
  const copy = [headline, summary].filter(Boolean).join(" ");

  return (
    <article className="review-page__verdict-card">
      <h2 className="review-page__section-title">Final Verdict</h2>
      {copy ? (
        <p className="review-page__verdict-copy">{copy}</p>
      ) : (
        <p className="review-page__section-body">
          Our closing take will appear here once enough ownership signals are
          available for this model.
        </p>
      )}
    </article>
  );
}
