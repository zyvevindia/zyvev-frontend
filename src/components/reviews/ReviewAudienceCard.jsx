/**
 * @param {{
 *   title: string,
 *   items?: string[],
 *   tone?: "positive" | "neutral",
 *   emptyCopy?: string,
 * }} props
 */
export default function ReviewAudienceCard({
  title,
  items = [],
  tone = "positive",
  emptyCopy = "No strong signal available from current ownership data.",
}) {
  if (!items.length) {
    return null;
  }

  return (
    <article
      className={[
        "review-page__audience-card",
        tone === "neutral"
          ? "review-page__audience-card--neutral"
          : "review-page__audience-card--positive",
      ].join(" ")}
    >
      <h2 className="review-page__section-title">{title}</h2>
      <ul className="review-page__audience-list">
        {items.map((item) => (
          <li key={item} className="review-page__audience-item">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
