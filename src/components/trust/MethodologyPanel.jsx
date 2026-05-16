/**
 * Methodology visibility for SEO / guide pages.
 */

const box = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem 1.25rem",
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
  color: "#475569",
  lineHeight: 1.6,
};

export default function MethodologyPanel({ recommendationLogic, category }) {
  const methodology =
    recommendationLogic?.methodology ||
    "Deterministic composite of internal catalog scores — no manual paid overrides.";

  const tone =
    recommendationLogic?.tonePolicy === "well_suited_language_only"
      ? "Editorial tone avoids superlatives and paid ranking language."
      : null;

  return (
    <section style={box} aria-label="Ranking methodology">
      <strong style={{ color: "#0f172a", display: "block", marginBottom: "0.35rem" }}>
        How scores work
      </strong>
      <p style={{ margin: "0 0 0.5rem" }}>{methodology}</p>
      {category && (
        <p style={{ margin: "0 0 0.5rem" }}>
          Category: <span style={{ textTransform: "capitalize" }}>{category}</span>
        </p>
      )}
      {tone && <p style={{ margin: 0 }}>{tone}</p>}
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
        Scores reflect catalog data at generation time and may change as variants
        and prices update.
      </p>
    </section>
  );
}
