import { Link } from "react-router-dom";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

const ul = { margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: "#475569", lineHeight: 1.7 };

export default function LaunchReadinessPage() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/launch-status">Launch status (API checks)</Link>
        {" · "}
        <Link to="/admin/soft-launch-ops">Soft launch ops</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Traffic readiness checklist</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6, maxWidth: "720px" }}>
        Human-run list for controlled soft launch and first traffic scaling. Pair with
        repo docs under <code>docs/launch/</code> (post-deploy, production verification).
      </p>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Build &amp; automation</h2>
        <ul style={ul}>
          <li>
            <code>npm run build</code> — no regressions before tagging release
          </li>
          <li>
            <code>npm run post-launch:smoke</code> — SEO, trust, soft-launch, catalog ops
            smoke scripts (CI-friendly)
          </li>
          <li>
            <code>npm run media:audit</code> — broken / missing hero or listing media on
            tier-1 families
          </li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Buyer journey (manual)</h2>
        <ul style={ul}>
          <li>Home → listing filters → detail page (images, trust panel, intelligence)</li>
          <li>Compare 2–3 vehicles → below-fold intelligence loads → lead / WhatsApp CTAs</li>
          <li>Discovery preset with results (indexed) and edge case with noindex when thin</li>
          <li>Mobile: compare horizontal spec table, discovery filters, lead modal</li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Observability</h2>
        <ul style={ul}>
          <li>Analytics: page views + funnel events still firing (staging/production keys)</li>
          <li>Web vitals events (LCP / CLS / INP) in analytics payload</li>
          <li>Admin → traffic / ops QA / soft-launch dashboard after deploy</li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>SEO &amp; crawl</h2>
        <ul style={ul}>
          <li>
            <code>npm run seo:qa</code> — canonicals, sitemap manifest, thin routes
          </li>
          <li>Search Console: sitemaps submitted, no spike in 404/5xx on compare or guides</li>
        </ul>
      </div>
    </div>
  );
}
