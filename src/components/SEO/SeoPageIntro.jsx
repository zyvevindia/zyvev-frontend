export default function SeoPageIntro({ intro, recommendationLogic }) {
  return (
    <section style={styles.section}>
      <p style={styles.intro}>{intro}</p>

      {recommendationLogic?.methodology && (
        <p style={styles.methodology}>
          <strong>How we rank:</strong>{" "}
          {recommendationLogic.methodology}
        </p>
      )}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: "1.75rem",
  },
  intro: {
    fontSize: "1.05rem",
    lineHeight: 1.65,
    color: "#334155",
    margin: "0 0 1rem",
  },
  methodology: {
    fontSize: "0.9rem",
    lineHeight: 1.55,
    color: "#64748b",
    margin: 0,
    padding: "0.75rem 1rem",
    background: "#f8fafc",
    borderRadius: "8px",
    borderLeft: "3px solid #2563eb",
  },
};
