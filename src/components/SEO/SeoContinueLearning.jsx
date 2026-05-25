import { Link } from "react-router-dom";

/**
 * Continue learning pathway — session depth without nav redesign.
 */
export default function SeoContinueLearning({ steps = [], pathwayLabel = "Continue learning" }) {
  if (!steps?.length) return null;

  return (
    <nav
      aria-label={pathwayLabel}
      style={{
        marginTop: "2rem",
        padding: "1.15rem 1.25rem",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
      }}
    >
      <h2
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 0.65rem",
        }}
      >
        {pathwayLabel}
      </h2>
      <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
        Build confidence step by step — no pressure to decide today.
      </p>
      <ol
        style={{
          margin: 0,
          paddingLeft: "1.25rem",
          fontSize: "0.9rem",
          color: "#334155",
          lineHeight: 1.6,
        }}
      >
        {steps.map((step) => (
          <li key={step.href} style={{ marginBottom: "0.4rem" }}>
            <Link to={step.href} style={{ color: "#2563eb", fontWeight: 500 }}>
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
