import ScoreTierBadge from "./ScoreTierBadge.jsx";
import "./score2.css";

export default function ScoreSummaryCard({
  overallTier,
  summary,
  title = "Overall guidance",
  className = "",
}) {
  if (!overallTier && !summary) return null;

  return (
    <section className={`score2-card score2-summary-card ${className}`.trim()}>
      <div className="score2-card__header">
        <h3 className="score2-card__title">{title}</h3>
        {overallTier ? (
          <ScoreTierBadge tier={overallTier} size="large" />
        ) : null}
      </div>
      {summary ? <p className="score2-summary-card__text">{summary}</p> : null}
    </section>
  );
}
