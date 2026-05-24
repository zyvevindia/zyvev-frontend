/**
 * Compare trust guidance — lifestyle-fit differences.
 */

import { ensureArray } from "../../utils/compareArrayUtils";
import { CATALOG_INTELLIGENCE } from "../../utils/catalogIntelligence";
import { pickCompareTrustLeaders } from "../../utils/trustIntelligence";
import useTrackOnView from "../../hooks/useTrackOnView";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

const wrap = {
  margin: "16px clamp(12px, 3vw, 20px) 0",
  maxWidth: "1200px",
  marginLeft: "auto",
  marginRight: "auto",
  padding: "clamp(16px, 3vw, 20px) clamp(14px, 3vw, 24px)",
  background: "#f0fdf4",
  borderRadius: "20px",
  border: "1px solid #bbf7d0",
};

const title = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 8px 0",
};

const item = {
  marginBottom: "12px",
  fontSize: "14px",
  lineHeight: 1.55,
  color: "#475569",
};

const label = { fontWeight: "700", color: "#166534" };

export default function CompareTrustPanel({ cars }) {
  if (!CATALOG_INTELLIGENCE || !cars?.length) return null;

  const leaders = pickCompareTrustLeaders(cars);
  if (!leaders.length) return null;

  const vehicleSlugs = ensureArray(cars)
    .map((c) => c?.slug)
    .filter(Boolean);

  const viewRef = useTrackOnView(
    BUYER_EVENTS.SCENARIO_COMPARE_VIEWED,
    {
      vehicleSlugs,
      sourcePage: "/compare",
      panel: "compare_trust",
    },
    vehicleSlugs.length >= 2
  );

  return (
    <section ref={viewRef} style={wrap} aria-label="Compare trust guidance">
      <h2 style={title}>Lifestyle fit in this compare</h2>
      <p style={{ ...item, fontSize: "13px" }}>
        Where each EV fits your routine — charging, highway, and apartment
        practicality. Editorial guidance only; not an overall winner score.
      </p>
      {leaders.map((l) => (
        <div key={l.key} style={item}>
          <span style={label}>{l.label}:</span>{" "}
          <strong>{l.carName}</strong>
          {l.note && (
            <span style={{ display: "block", marginTop: "4px" }}>{l.note}</span>
          )}
        </div>
      ))}
    </section>
  );
}
