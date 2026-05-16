import { useEffect, useState } from "react";
import { fetchMarketHealth } from "../../../services/editorial/editorialApi";
import { card, h1, h2, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function MarketHealthPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketHealth(false)
      .then((res) => setReport(res.data))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={h1}>Market health</h1>
      <p style={muted}>Ongoing trust, SEO, lead, and observation monitoring.</p>
      {error && <p style={{ color: editorialColors.danger }}>{error}</p>}
      {report && (
        <div style={card}>
          <h2 style={h2}>
            Status: {report.status} ({report.healthScore}/100)
          </h2>
          <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
            <li>Beta ready: {String(report.betaReady)}</li>
            <li>Observations: {report.observations?.verified} verified</li>
            <li>SEO URLs: {report.seo?.crawlableUrls}</li>
            <li>Canonical errors: {report.seo?.canonicalErrors}</li>
          </ul>
          {report.alerts?.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16 }}>Alerts</h3>
              <ul style={{ fontSize: 13 }}>
                {report.alerts.map((a) => (
                  <li key={a.code}>
                    [{a.severity}] {a.code}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
