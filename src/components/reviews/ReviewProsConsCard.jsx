import { REVIEW_LIMITS } from "../../reviews/constants.js";

/**
 * @param {{ variant: "pros" | "cons", items?: string[] }} props
 */
export default function ReviewProsConsCard({ variant, items = [] }) {
  const isPros = variant === "pros";
  const title = isPros ? "Pros" : "Cons";
  const limit = isPros ? REVIEW_LIMITS.maxPros : REVIEW_LIMITS.maxCons;
  const limitedItems = items.slice(0, limit);
  const emptyCopy = isPros
    ? "No standout strengths surfaced from current intelligence data."
    : "No major trade-offs flagged from current intelligence data.";

  return (
    <article
      className={[
        "review-page__pros-cons-card",
        isPros
          ? "review-page__pros-cons-card--pros"
          : "review-page__pros-cons-card--cons",
      ].join(" ")}
    >
      <h2 className="review-page__section-title">{title}</h2>
      {limitedItems.length ? (
        <ul className="review-page__pros-cons-list">
          {limitedItems.map((item) => (
            <li key={item} className="review-page__pros-cons-item">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="review-page__section-body review-page__pros-cons-empty">
          {emptyCopy}
        </p>
      )}
    </article>
  );
}
