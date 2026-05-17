import { Link } from "react-router-dom";

export default function NetworkErrorPanel({
  title = "Could not load this page",
  message = "Please check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  children,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "2.5rem 1.5rem",
        maxWidth: "480px",
        margin: "2rem auto",
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      }}
    >
      <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }} aria-hidden>
        ⚠️
      </p>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#0f172a" }}>
        {title}
      </h2>
      <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: "1.25rem" }}>
        {message}
      </p>
      {children}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {retryLabel}
          </button>
        )}
        <Link
          to="/cars"
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            color: "#334155",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Browse EVs
        </Link>
      </div>
    </div>
  );
}