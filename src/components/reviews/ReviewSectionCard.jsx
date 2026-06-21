/**
 * @param {{ title: string, body: string, className?: string }} props
 */
export default function ReviewSectionCard({ title, body, className = "" }) {
  const copy = String(body || "").trim();

  return (
    <article
      className={["review-page__section-card", className].filter(Boolean).join(" ")}
    >
      <h2 className="review-page__section-title">{title}</h2>
      <p className="review-page__section-body">
        {copy || "Editorial insight for this section is not available yet."}
      </p>
    </article>
  );
}
