/**
 * Real-world ownership snippets — detail page, flag-gated.
 */

import {
  getRangeRealitySnippet,
  hasOwnershipReality,
  pickChargingIndicators,
} from "../../utils/ownershipReality";

import useTrackOnView from "../../hooks/useTrackOnView";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

const card = {
  background: "white",
  borderRadius: "24px",
  padding: "28px 32px",
  boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: "24px",
};

const h2 = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const body = {
  fontSize: "15px",
  lineHeight: 1.75,
  color: "#475569",
  margin: "0 0 12px 0",
};

const note = {
  fontSize: "12px",
  color: "#64748b",
  margin: "12px 0 0",
  lineHeight: 1.5,
};

export default function OwnershipRealityPanel({ car }) {
  if (!hasOwnershipReality(car)) return null;

  const slug =
    car?.slug || car?.catalogMeta?.slug || "";

  const viewRef = useTrackOnView(
    BUYER_EVENTS.OWNERSHIP_PANEL_VIEWED,
    {
      vehicleSlugs: slug ? [slug] : [],
      sourcePage:
        typeof window !== "undefined"
          ? window.location.pathname
          : "",
      panel: "ownership_reality",
    },
    Boolean(slug)
  );

  const meta = car.catalogMeta;
  const range = getRangeRealitySnippet(meta);
  const charging = pickChargingIndicators(meta);
  const trade = meta.ownershipTradeoffs;

  return (
    <article ref={viewRef} style={card}>
      <h2 style={h2}>Real-world ownership</h2>

      {range && (
        <>
          <p style={body}>
            {range.city && (
              <>
                City (summer band): <strong>{range.city}</strong>
              </>
            )}
            {range.highway && (
              <>
                {range.city ? " · " : ""}
                Highway band: <strong>{range.highway}</strong>
              </>
            )}
            {range.claimed && (
              <>
                {" "}
                (ARAI certified: {range.claimed} km)
              </>
            )}
          </p>
          <p style={note}>{range.disclaimer}</p>
        </>
      )}

      {charging.length > 0 && (
        <p style={{ ...body, marginTop: "16px" }}>
          Charging life:{" "}
          {charging.map((c) => c.label).join(" · ")}
        </p>
      )}

      {trade?.primaryCompromise && (
        <p style={{ ...body, marginTop: "16px" }}>
          <span style={{ color: "#b45309", fontWeight: "700" }}>
            Honest compromise:
          </span>{" "}
          {trade.primaryCompromise}
        </p>
      )}

      {trade?.idealUsagePattern && (
        <p style={body}>
          <span style={{ fontWeight: "700", color: "#0f172a" }}>
            Better aligned for:
          </span>{" "}
          {trade.idealUsagePattern}
        </p>
      )}
    </article>
  );
}
