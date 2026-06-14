import { scrollToDetailSection } from "../../utils/detailPageNav.js";

import "./hero-summary.css";

function SummaryCard({ label, value, className = "" }) {
  if (!value) return null;

  return (
    <article
      className={["hero-summary__card", className].filter(Boolean).join(" ")}
    >
      <p className="hero-summary__label">{label}</p>
      <p className="hero-summary__value">{value}</p>
    </article>
  );
}

export default function HeroSummary({ summary = null }) {
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
    variantCount === 1
      ? "1 variant available"
      : `${variantCount} variants available`;

  function handleExploreVariants() {
    scrollToDetailSection("variants");
  }

  return (
    <div className="hero-summary">
      <div className="hero-summary__grid">
        <SummaryCard label="Price" value={priceRange} />
        <SummaryCard label="Real-world range" value={realWorldRange} />
        <SummaryCard label="Battery" value={batteryRange} />
        <SummaryCard label="Power" value={powerRange} />
        <SummaryCard label="Charging" value={chargingRange} />

        {variantCount > 0 ? (
          <article className="hero-summary__card hero-summary__card--variants">
            <div>
              <p className="hero-summary__label">Variants</p>
              <p className="hero-summary__value">{variantLabel}</p>
            </div>
            <button
              type="button"
              className="hero-summary__link"
              onClick={handleExploreVariants}
            >
              Explore all {variantCount} variants →
            </button>
          </article>
        ) : null}
      </div>
    </div>
  );
}
