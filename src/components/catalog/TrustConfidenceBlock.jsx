/**
 * Editorial trust indicators — not ratings or reviews.
 */

import {
  hasTrustIntelligence,
  trustIndicatorStyle,
  rangeRealityExpandedBullets,
  chargingPracticalityBullets,
  ownershipGuidanceBullets,
} from "../../utils/trustIntelligence";

import useTrackOnView from "../../hooks/useTrackOnView";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";
import OwnershipGuidanceStrip from "../trust/OwnershipGuidanceStrip";

const card = {
  background: "white",
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)",
  boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
  border: "1px solid #e2e8f0",
  marginBottom: "24px",
};

const h2 = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 8px 0",
};

const sub = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 16px 0",
  lineHeight: 1.5,
};

const list = {
  fontSize: "14px",
  lineHeight: 1.65,
  color: "#475569",
  margin: "16px 0 0",
  paddingLeft: "18px",
};

export default function TrustConfidenceBlock({ car }) {
  if (!hasTrustIntelligence(car)) return null;

  const meta = car.catalogMeta;
  const slug = car?.slug || meta?.slug || "";

  const viewRef = useTrackOnView(
    BUYER_EVENTS.OWNERSHIP_PANEL_VIEWED,
    {
      vehicleSlugs: slug ? [slug] : [],
      sourcePage:
        typeof window !== "undefined" ? window.location.pathname : "",
      panel: "trust_confidence",
    },
    Boolean(slug)
  );

  const indicators = meta.trustPresentation?.indicators || [];
  const rangeBullets = rangeRealityExpandedBullets(meta);
  const chargeBullets = chargingPracticalityBullets(meta);
  const ownBullets = ownershipGuidanceBullets(meta);

  return (
    <article ref={viewRef} style={card}>
      <h2 style={h2}>Can you live with this EV?</h2>
      <p style={sub}>
        {meta.trustPresentation?.headline ||
          "Editorial confidence guidance — not user reviews or star ratings."}
      </p>

      <div>
        {indicators.map((ind) => (
          <span
            key={ind.id}
            style={trustIndicatorStyle(ind.tone)}
            title={meta.trustPresentation?.disclaimer}
          >
            {ind.label}
          </span>
        ))}
      </div>

      {(rangeBullets.length > 0 ||
        chargeBullets.length > 0 ||
        ownBullets.length > 0) && (
        <ul style={list}>
          {rangeBullets.map((t) => (
            <li key={`r-${t.slice(0, 24)}`}>{t}</li>
          ))}
          {chargeBullets.map((t) => (
            <li key={`c-${t.slice(0, 24)}`}>{t}</li>
          ))}
          {ownBullets.map((t) => (
            <li key={`o-${t.slice(0, 24)}`}>{t}</li>
          ))}
        </ul>
      )}

      <OwnershipGuidanceStrip car={car} variant="detail" />

      <p style={{ ...sub, marginTop: "16px", marginBottom: 0 }}>
        {meta.trustPresentation?.disclaimer ||
          "Planning guidance only — verify charging access and range for your routes."}
      </p>
    </article>
  );
}
