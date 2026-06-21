/**
 * @param {{ verdict: import("../../reviews/types.js").ReviewEvSavariVerdict }} props
 */
export default function ReviewEvSavariVerdictCard({ verdict }) {
  if (!verdict?.label) return null;

  const bestFor = verdict.bestFor ?? [];
  const considerations = verdict.considerations ?? [];

  return (
    <article className="review-page__ev-verdict-card">
      <p className="review-page__ev-verdict-eyebrow">EVSavari verdict</p>
      <h2 className="review-page__ev-verdict-label">{verdict.label}</h2>

      {bestFor.length ? (
        <div className="review-page__ev-verdict-block">
          <h3 className="review-page__ev-verdict-subtitle">Best for</h3>
          <ul className="review-page__ev-verdict-list">
            {bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {considerations.length ? (
        <div className="review-page__ev-verdict-block">
          <h3 className="review-page__ev-verdict-subtitle">Things to consider</h3>
          <ul className="review-page__ev-verdict-list review-page__ev-verdict-list--considerations">
            {considerations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
