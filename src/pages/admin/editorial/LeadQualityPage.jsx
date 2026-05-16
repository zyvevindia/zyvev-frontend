import { useEffect, useState } from "react";
import { fetchLeadQuality } from "../../../services/editorial/editorialApi";
import { card, h1, h2, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function LeadQualityPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeadQuality(7)
      .then((res) => setReport(res.data))
      .catch((e) => setError(e.message));
  }, []);

  const tiers = report?.tierDistribution || {};

  return (
    <div>
      <h1 style={h1}>Lead quality intelligence</h1>
      <p style={muted}>
        Internal indicators only — not shown to buyers or dealers publicly.
      </p>
      {error && <p style={{ color: editorialColors.danger }}>{error}</p>}

      <div style={card}>
        <h2 style={h2}>Last 7 days</h2>
        <p style={{ fontSize: 14 }}>Total leads: {report?.totalLeads ?? 0}</p>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          <li>High quality tier: {tiers.high ?? 0}</li>
          <li>Medium quality tier: {tiers.medium ?? 0}</li>
          <li>Low quality tier: {tiers.low ?? 0}</li>
        </ul>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16 }}>Signal rates</h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          <li>Compare-engaged: {report?.rates?.compareEngaged ?? 0}%</li>
          <li>Trust-engaged: {report?.rates?.trustEngaged ?? 0}%</li>
          <li>Charging concern: {report?.rates?.chargingConcern ?? 0}%</li>
          <li>First-time buyer pattern: {report?.rates?.firstTimeBuyer ?? 0}%</li>
        </ul>
        {report?.calibrationObservations?.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16 }}>
              Calibration observations
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 1.7 }}>
              {report.calibrationObservations.map((o) => (
                <li key={o.id}>
                  [{o.priority}] {o.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
