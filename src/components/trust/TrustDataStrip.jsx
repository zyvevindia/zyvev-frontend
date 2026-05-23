/**
 * Subtle trust metadata — detail & compare surfaces.
 */

import { buildFreshnessMetadata } from "../../intelligence/freshnessMetadata.js";
import { DATA_ORIGIN_LABELS } from "../../intelligence/trustMetadata.js";
import "../../styles/ev-trust.css";

const stripStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  alignItems: "center",
  fontSize: "11px",
  color: "#64748b",
  marginTop: "8px",
  marginBottom: "4px",
};

const chipStyle = {
  padding: "3px 8px",
  borderRadius: "6px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontWeight: 600,
  lineHeight: 1.3,
};

function formatVerifiedDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {object} car
 * @param {'detail'|'compare'} [variant]
 */
export default function TrustDataStrip({ car, variant = "detail" }) {
  if (!car) return null;

  const meta = car.catalogMeta || {};
  const freshness = buildFreshnessMetadata(car);
  const verified =
    formatVerifiedDate(meta.lastVerifiedAt) ||
    formatVerifiedDate(freshness.lastVerifiedAt) ||
    formatVerifiedDate(meta.priceLastUpdated);

  const confidence = meta.confidence;
  const origin = meta.dataOrigin || meta.sourceType;
  const estimated =
    meta.estimated === true ||
    meta.verificationBadge === "estimated" ||
    (confidence && confidence !== "high");

  const chips = [];

  if (verified) {
    chips.push({ key: "verified", label: `Verified ${verified}` });
  }

  if (confidence && confidence !== "legacy") {
    chips.push({
      key: "confidence",
      label:
        confidence === "high"
          ? "High confidence"
          : confidence === "medium"
            ? "Medium confidence"
            : "Directional data",
    });
  }

  if (origin && DATA_ORIGIN_LABELS[origin]) {
    chips.push({
      key: "origin",
      label: DATA_ORIGIN_LABELS[origin],
    });
  } else if (estimated) {
    chips.push({ key: "est", label: "Estimated · not OEM-verified" });
  } else if (meta.governanceStatus === "published") {
    chips.push({ key: "pub", label: "Catalog reviewed" });
  }

  if (!chips.length) return null;

  return (
    <p
      className={`ev-trust-strip ev-trust-strip--${variant}`}
      style={stripStyle}
      aria-label="Data trust indicators"
    >
      {chips.slice(0, variant === "compare" ? 2 : 3).map((c) => (
        <span key={c.key} style={chipStyle}>
          {c.label}
        </span>
      ))}
    </p>
  );
}
