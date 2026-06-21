import { REVIEW_LIMITS } from "../../reviews/constants.js";

import "./review-pros-cons.css";

/**
 * @param {{ variant: "pros" | "cons", items?: string[] }} props
 */
export default function ReviewProsConsCard({ variant, items = [] }) {
  const isPros = variant === "pros";
  const title = isPros ? "Pros" : "Things to consider";
  const icon = isPros ? "✓" : "⚠";
  const limit = isPros ? REVIEW_LIMITS.maxPros : REVIEW_LIMITS.maxCons;
  const limitedItems = items.slice(0, limit);
  const emptyCopy = isPros
    ? "No standout strengths surfaced from current intelligence data."
    : "No major trade-offs flagged from current intelligence data.";

  return (
    <article
      className={[
        "review-pros-cons",
        isPros ? "review-pros-cons--pros" : "review-pros-cons--cons",
      ].join(" ")}
    >
      <div className="review-pros-cons__head">
        <span className="review-pros-cons__icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="review-pros-cons__title">{title}</h2>
      </div>

      {limitedItems.length ? (
        <ul className="review-pros-cons__list">
          {limitedItems.map((item) => (
            <li key={item} className="review-pros-cons__item">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="review-pros-cons__empty">{emptyCopy}</p>
      )}
    </article>
  );
}
