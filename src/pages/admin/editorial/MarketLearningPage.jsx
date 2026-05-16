import { useEffect, useState } from "react";
import { fetchMarketLearning } from "../../../services/editorial/editorialApi";
import { card, h1, h2, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function MarketLearningPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketLearning(7, false)
      .then((res) => setReport(res.data))
      .catch((e) => setError(e.message));
  }, []);

  const j = report?.journeys || {};

  return (
    <div>
      <h1 style={h1}>Market learning</h1>
      <p style={muted}>Weekly behavioral + lead journey report (aggregated).</p>
      {error && <p style={{ color: editorialColors.danger }}>{error}</p>}
      {report?.behavioralNote && <p style={muted}>{report.behavioralNote}</p>}
      {report && (
        <div style={card}>
          <h2 style={h2}>Journey signals (7d)</h2>
          <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
            <li>Compare started: {j.compareHeavy?.compareStarted ?? "—"}</li>
            <li>SEO → detail: {j.seoEntry?.seoToDetail ?? "—"}</li>
            <li>Ownership panel views: {j.trustEngagement?.ownershipPanelViews ?? "—"}</li>
            <li>Lead events: {j.leadFunnel?.leadEvents ?? "—"}</li>
          </ul>
          {report.calibrationObservations?.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16 }}>
                Calibration notes
              </h3>
              <ul style={{ fontSize: 13 }}>
                {report.calibrationObservations.map((c) => (
                  <li key={c.type}>{c.message}</li>
                ))}
              </ul>
            </>
          )}
          <p style={{ ...muted, marginTop: 12 }}>
            CLI: <code>npm run ops:market-learning -- --db 7</code>
          </p>
        </div>
      )}
    </div>
  );
}
