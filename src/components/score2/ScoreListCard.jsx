import "./score2.css";

/**
 * @param {{
 *   title: string,
 *   items?: string[],
 *   className?: string,
 *   tone?: "default" | "positive" | "neutral",
 * }} props
 */
export default function ScoreListCard({
  title,
  items = [],
  className = "",
  tone = "default",
}) {
  const cleaned = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (!cleaned.length) return null;

  const rootClass = [
    "score2-card",
    "score2-list-card",
    tone === "positive" ? "score2-list-card--positive" : "",
    tone === "neutral" ? "score2-list-card--neutral" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClass}>
      <h3 className="score2-card__title">{title}</h3>
      <ul className="score2-list-card__list">
        {cleaned.map((item) => (
          <li key={item} className="score2-list-card__item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
