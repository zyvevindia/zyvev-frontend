import { Link } from "react-router-dom";

const blockStyle = {
  marginBottom: "1.75rem",
};
const h2Style = {
  fontSize: "1.15rem",
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: "0.75rem",
  lineHeight: 1.3,
};
const pStyle = {
  fontSize: "0.95rem",
  color: "#334155",
  lineHeight: 1.65,
  margin: "0 0 0.75rem",
};
const ulStyle = {
  margin: "0.5rem 0 0",
  paddingLeft: "1.25rem",
  color: "#334155",
  lineHeight: 1.6,
  fontSize: "0.95rem",
};
const mythStyle = {
  marginBottom: "0.85rem",
  padding: "0.75rem 1rem",
  background: "#f1f5f9",
  borderRadius: "8px",
  borderLeft: "3px solid #94a3b8",
};

/**
 * Renders structured authority editorial sections from generated SEO JSON.
 */
export default function SeoAuthorityEditorial({
  sections = [],
  compareSupportLinks = [],
}) {
  if (!sections?.length && !compareSupportLinks?.length) return null;

  return (
    <div className="seo-authority-editorial" style={{ marginTop: "1.25rem" }}>
      {sections.map((section) => (
        <section
          key={section.id || section.title}
          id={section.id}
          style={blockStyle}
          aria-labelledby={`auth-${section.id}`}
        >
          {section.title ? (
            <h2 id={`auth-${section.id}`} style={h2Style}>
              {section.title}
            </h2>
          ) : null}
          {(section.paragraphs || []).map((para, i) => (
            <p key={i} style={pStyle}>
              {para}
            </p>
          ))}
          {section.bullets?.length ? (
            <ul style={ulStyle}>
              {section.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}
          {(section.misconceptions || []).map((item, i) => (
            <div key={i} style={mythStyle}>
              <p style={{ ...pStyle, marginBottom: "0.35rem", fontWeight: 600 }}>
                Myth: {item.myth}
              </p>
              <p style={{ ...pStyle, margin: 0 }}>Reality: {item.reality}</p>
            </div>
          ))}
          {section.links?.length ? (
            <ul style={{ ...ulStyle, listStyle: "none", paddingLeft: 0 }}>
              {section.links.map((link) => (
                <li key={link.href} style={{ marginBottom: "0.35rem" }}>
                  <Link to={link.href} style={{ color: "#2563eb", fontWeight: 500 }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {compareSupportLinks?.length ? (
        <aside
          style={{
            ...blockStyle,
            padding: "1rem 1.15rem",
            background: "#eff6ff",
            borderRadius: "10px",
            border: "1px solid #bfdbfe",
          }}
          aria-label="Compare support"
        >
          <h2 style={{ ...h2Style, fontSize: "1.05rem" }}>Still unsure?</h2>
          <p style={pStyle}>
            Use these calm explainers alongside side-by-side compare — no pressure
            to decide today.
          </p>
          <ul style={{ ...ulStyle, listStyle: "none", paddingLeft: 0 }}>
            {compareSupportLinks.map((link) => (
              <li key={link.href} style={{ marginBottom: "0.4rem" }}>
                <Link to={link.href} style={{ color: "#1d4ed8", fontWeight: 600 }}>
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
