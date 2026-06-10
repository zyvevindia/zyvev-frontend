/**
 * Scenario compare intelligence 2.0 — lightweight compare page block.
 */

import { CATALOG_INTELLIGENCE } from "../../utils/catalogIntelligence";

import { pickScenarioLeaders } from "../../utils/ownershipReality";

import useTrackOnView from "../../hooks/useTrackOnView";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

const wrap = {
  margin: "24px 20px 0",
  maxWidth: "1200px",
  marginLeft: "auto",
  marginRight: "auto",
  padding: "20px 24px",
  background: "#f8fafc",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
};

const title = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 14px 0",
};

const item = {
  marginBottom: "14px",
  fontSize: "14px",
  lineHeight: 1.55,
  color: "#475569",
};

const label = {
  fontWeight: "700",
  color: "#1d4ed8",
};

export default function CompareScenarioPanel({ cars }) {
  const leaders = pickScenarioLeaders(cars ?? []);
  const vehicleSlugs = (cars ?? [])
    .map((c) => c?.slug || c?.catalogMeta?.slug)
    .filter(Boolean);
  const enabled =
    CATALOG_INTELLIGENCE &&
    Boolean(cars?.length) &&
    leaders.length > 0 &&
    vehicleSlugs.length >= 2;

  const viewRef = useTrackOnView(
    BUYER_EVENTS.SCENARIO_COMPARE_VIEWED,
    {
      vehicleSlugs,
      sourcePage: "/compare",
      compareDepth: vehicleSlugs.length,
    },
    enabled
  );

  if (!enabled) return null;

  return (
    <section
      ref={viewRef}
      style={wrap}
      aria-label="Scenario compare guidance"
    >
      <h2 style={title}>Scenario guidance</h2>
      <p style={{ ...item, marginBottom: "16px", fontSize: "13px" }}>
        Better aligned for each use case in this compare set — not overall
        winners.
      </p>
      {leaders.map((l) => (
        <div key={l.key} style={item}>
          <span style={label}>{l.label}:</span>{" "}
          <strong>{l.carName}</strong>
          {l.explanation && (
            <span style={{ display: "block", marginTop: "4px" }}>
              {l.explanation}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}
