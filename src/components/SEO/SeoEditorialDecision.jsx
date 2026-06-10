import { Link } from "react-router-dom";

const card = {
  background: "white",
  borderRadius: "16px",
  padding: "24px 28px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  border: "1px solid #e2e8f0",
  marginBottom: "20px",
};

const h2 = {
  fontSize: "1.125rem",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 12px 0",
};

const list = {
  margin: 0,
  paddingLeft: "20px",
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  color: "#475569",
};

const linkStyle = {
  display: "inline-block",
  marginTop: "8px",
  fontSize: "0.9375rem",
  fontWeight: 600,
  color: "#2563eb",
  textDecoration: "none",
};

function BulletList({ items, emptyLabel }) {
  if (!items?.length) return null;
  return (
    <ul style={list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Human-reviewed editorial decision layer for discovery guides.
 */
export default function SeoEditorialDecision({ editorial }) {
  if (!editorial?.humanReviewed) return null;

  const {
    pros,
    cons,
    whoShouldBuy,
    whoShouldAvoid,
    bestAlternative,
    relatedLinks,
  } = editorial;

  const hasContent =
    pros?.length ||
    cons?.length ||
    whoShouldBuy?.length ||
    whoShouldAvoid?.length ||
    bestAlternative?.href ||
    relatedLinks?.length;

  if (!hasContent) return null;

  return (
    <section aria-label="Editorial guide summary" style={{ margin: "1.5rem 0" }}>
      {pros?.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Pros</h2>
          <BulletList items={pros} />
        </article>
      )}

      {cons?.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Cons</h2>
          <BulletList items={cons} />
        </article>
      )}

      {whoShouldBuy?.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Who should buy</h2>
          <BulletList items={whoShouldBuy} />
        </article>
      )}

      {whoShouldAvoid?.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Who should avoid</h2>
          <BulletList items={whoShouldAvoid} />
        </article>
      )}

      {bestAlternative?.href && (
        <article style={card}>
          <h2 style={h2}>Best alternative</h2>
          <p style={{ margin: 0, fontSize: "0.9375rem", color: "#475569", lineHeight: 1.7 }}>
            {bestAlternative.reason}
          </p>
          <Link to={bestAlternative.href} style={linkStyle}>
            {bestAlternative.label} →
          </Link>
        </article>
      )}

      {relatedLinks?.length > 0 && (
        <article style={card}>
          <h2 style={h2}>Related guides</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {relatedLinks.map((link) => (
              <Link key={link.href} to={link.href} style={linkStyle}>
                {link.label}
              </Link>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
