export default function SeoTradeoffs({ tradeoffs }) {
  if (!tradeoffs?.summary) return null;

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>Tradeoffs to consider</h2>
      <p style={styles.summary}>{tradeoffs.summary}</p>

      {tradeoffs.considerations?.length > 0 && (
        <ul style={styles.list}>
          {tradeoffs.considerations.map((c) => (
            <li key={c.slug} style={styles.item}>
              <strong>{c.slug}:</strong> {c.tradeoff}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: "2rem",
    padding: "1.25rem",
    background: "#fffbeb",
    borderRadius: "12px",
    border: "1px solid #fde68a",
  },
  heading: {
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: "0 0 0.75rem",
    color: "#92400e",
  },
  summary: {
    margin: "0 0 1rem",
    lineHeight: 1.6,
    color: "#78350f",
  },
  list: {
    margin: 0,
    paddingLeft: "1.25rem",
    color: "#78350f",
  },
  item: {
    marginBottom: "0.5rem",
    lineHeight: 1.5,
    fontSize: "0.9rem",
  },
};
