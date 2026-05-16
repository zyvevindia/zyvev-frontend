import { useEffect, useState } from "react";
import {
  fetchPublicBetaChecklist,
  fetchDealerReadiness,
} from "../../../services/editorial/editorialApi";
import {
  card,
  h1,
  h2,
  muted,
  editorialColors,
} from "../../../components/editorial/editorialStyles";

export default function PublicBetaPage() {
  const [checklist, setChecklist] = useState(null);
  const [dealer, setDealer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchPublicBetaChecklist(), fetchDealerReadiness(7)])
      .then(([c, d]) => {
        setChecklist(c.data);
        setDealer(d.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={h1}>Public beta readiness</h1>
      <p style={muted}>Controlled exposure checklist — not a launch approval.</p>
      {error && <p style={{ color: editorialColors.danger }}>{error}</p>}

      <div style={card}>
        <h2 style={h2}>Beta status</h2>
        <p style={{ fontSize: 16, fontWeight: 700 }}>
          {checklist?.betaReady ? "Ready for controlled beta" : "Gaps remain"}
        </p>
        <p style={muted}>
          {checklist?.summary?.passed}/{checklist?.summary?.total} checks passed
        </p>
        <ul style={{ fontSize: 13, lineHeight: 1.7 }}>
          {(checklist?.items || []).map((item) => (
            <li key={item.id} style={{ color: item.pass ? "#166534" : "#b45309" }}>
              {item.pass ? "✓" : "○"} {item.label}
              {item.detail && (
                <span style={{ color: "#64748b" }}> — {item.detail}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div style={card}>
        <h2 style={h2}>Dealer readiness (internal)</h2>
        <p style={muted}>{dealer?.status}</p>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          {(dealer?.dealerValueNarrative || []).map((n) => (
            <li key={n.slice(0, 40)}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
