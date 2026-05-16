export default function SeoFaqBlock({ faq = [] }) {
  if (!faq.length) return null;

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>Frequently asked questions</h2>
      <dl style={styles.list}>
        {faq.map((item, i) => (
          <div key={i} style={styles.item}>
            <dt style={styles.question}>{item.question}</dt>
            <dd style={styles.answer}>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const styles = {
  section: { marginBottom: "2.5rem" },
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#0f172a",
  },
  list: { margin: 0 },
  item: {
    marginBottom: "1.25rem",
    paddingBottom: "1.25rem",
    borderBottom: "1px solid #e2e8f0",
  },
  question: {
    fontWeight: 600,
    margin: "0 0 0.5rem",
    color: "#0f172a",
    fontSize: "1rem",
  },
  answer: {
    margin: 0,
    lineHeight: 1.6,
    color: "#475569",
    fontSize: "0.95rem",
  },
};
