import { Link } from "react-router-dom";

import { buildOwnershipToolHref } from "../../tools/ownershipToolLinks.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

import "./hero-summary.css";

function SummaryCard({ label, value, className = "", toolLink = null }) {
  if (!value) return null;

  return (
    <article
      className={["hero-summary__card", className].filter(Boolean).join(" ")}
    >
      <p className="hero-summary__label">{label}</p>
      <p className="hero-summary__value">{value}</p>
      {toolLink ? (
        <Link to={toolLink.href} className="hero-summary__tool-link">
          {toolLink.label}
        </Link>
      ) : null}
    </article>
  );
}

export default function HeroSummary({ summary = null, familySlug = "" }) {
  if (!summary) return null;

  const {
    priceRange,
    realWorldRange,
    batteryRange,
    powerRange,
    chargingRange,
    variantCount = 0,
  } = summary;

  const hasMetricCards =
    priceRange ||
    realWorldRange ||
    batteryRange ||
    powerRange ||
    chargingRange;

  if (!hasMetricCards && variantCount <= 0) {
    return null;
  }

  const variantLabel =
    variantCount === 1 ? "1 variant" : `${variantCount} variants`;

  const slug = normalizeVehicleSlug(familySlug);
  const priceToolLink =
    slug && priceRange
      ? {
          href: buildOwnershipToolHref("tco", slug),
          label: "See ownership cost →",
        }
      : null;

  return (
    <div className="hero-summary">
      <div className="hero-summary__grid">
        <SummaryCard
          label="Price Range"
          value={priceRange}
          toolLink={priceToolLink}
        />
        <SummaryCard label="Real-world Range" value={realWorldRange} />
        <SummaryCard label="Battery Range" value={batteryRange} />
        <SummaryCard label="Power Range" value={powerRange} />
        <SummaryCard label="Charging Range" value={chargingRange} />
        <SummaryCard label="Variants Available" value={variantCount > 0 ? variantLabel : null} />
      </div>
    </div>
  );
}
