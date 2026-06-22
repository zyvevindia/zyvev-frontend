/**
 * @param {{
 *   label: string,
 *   value: string,
 *   loading?: boolean,
 * }} props
 */
export default function OwnershipQuickAnswerCard({
  label,
  value,
  loading = false,
}) {
  if (loading) return null;

  return (
    <section
      className="ownership-page__quick-answer"
      aria-labelledby="ownership-quick-answer-label"
    >
      <p id="ownership-quick-answer-label" className="ownership-page__quick-answer-label">
        {label}
      </p>
      <p className="ownership-page__quick-answer-value">{value || "—"}</p>
    </section>
  );
}
