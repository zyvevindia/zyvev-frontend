import { useMemo, useState } from "react";
import {
  formatIndianPrice,
  formatIndianPriceCompact,
} from "../../utils/formatIndianPrice";
import {
  getActiveVariantLabel,
  resolveVariantSpecs,
} from "../../utils/variantInsights";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes";

const INITIAL_VISIBLE = 5;

function variantInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "EV";
}

function VariantRow({
  variant,
  familyTitle,
  familyFallback,
  isActive,
  isCompared,
  onSelect,
  onOnRoadPrice,
  onViewOffers,
  onToggleCompare,
}) {
  const specs = resolveVariantSpecs(variant, familyFallback);
  const label = getActiveVariantLabel(variant, familyTitle);
  const price = specs.price;
  const batteryLine = [
    specs.battery,
    specs.range > 0 ? `${specs.range} km` : null,
    variant.power || variant.specifications?.power,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
  <>
    <tr
      className={isActive ? "cd-variants-row--active" : undefined}
      onClick={() => onSelect(variant)}
      style={{ cursor: "pointer" }}
    >
      <td>
        <div className="cd-variant-cell">
          <span className="cd-variant-badge" aria-hidden>
            {variantInitials(label)}
          </span>
          <div>
            <div className="cd-variant-name">{label}</div>
            {batteryLine && (
              <div className="cd-variant-meta">{batteryLine}</div>
            )}
          </div>
        </div>
      </td>
      <td className="cd-variant-battery">
        {specs.battery}
        {specs.range > 0 && (
          <>
            <br />
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              {specs.range} km range
            </span>
          </>
        )}
      </td>
      <td className="cd-variant-price">
        <strong>
          {price > 0
            ? `${formatIndianPriceCompact(price)}*`
            : "Price on request"}
        </strong>
        <button
          type="button"
          className="cd-variant-price-link"
          onClick={(e) => {
            e.stopPropagation();
            onOnRoadPrice(variant);
          }}
        >
          Get On-Road Price
        </button>
      </td>
      <td>
        <button
          type="button"
          className="cd-variant-offer-btn"
          onClick={(e) => {
            e.stopPropagation();
            onViewOffers(variant);
          }}
        >
          View Offers
        </button>
      </td>
      <td className="cd-variant-compare">
        <input
          type="checkbox"
          checked={isCompared}
          aria-label={`Compare ${label}`}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCompare(variant);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
    </tr>
  </>
  );
}

function VariantCard({
  variant,
  familyTitle,
  familyFallback,
  isActive,
  isCompared,
  onSelect,
  onOnRoadPrice,
  onViewOffers,
  onToggleCompare,
}) {
  const specs = resolveVariantSpecs(variant, familyFallback);
  const label = getActiveVariantLabel(variant, familyTitle);
  const price = specs.price;

  return (
    <article
      className={`cd-variant-card${isActive ? " cd-variant-card--active" : ""}`}
    >
      <div className="cd-variant-cell">
        <span className="cd-variant-badge">{variantInitials(label)}</span>
        <div>
          <div className="cd-variant-name">{label}</div>
          <div className="cd-variant-meta">
            {specs.battery}
            {specs.range > 0 ? ` · ${specs.range} km` : ""}
          </div>
        </div>
      </div>
      <p style={{ margin: "12px 0 4px", fontWeight: 700 }}>
        {price > 0
          ? formatIndianPrice(price, { prefix: "" })
          : "Price on request"}
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="cd-variant-offer-btn"
          onClick={() => onViewOffers(variant)}
        >
          View Offers
        </button>
        <button
          type="button"
          className="cd-variant-price-link"
          onClick={() => onOnRoadPrice(variant)}
        >
          Get On-Road Price
        </button>
        <label
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
          }}
        >
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare(variant)}
          />
          Compare
        </label>
      </div>
      <button
        type="button"
        style={{
          marginTop: 12,
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          background: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={() => onSelect(variant)}
      >
        Select variant
      </button>
    </article>
  );
}

export default function DetailVariantsTable({
  variants = [],
  familyTitle,
  familyFallback,
  selectedSlug,
  compareSlugs = [],
  onSelectVariant,
  onOnRoadPrice,
  onViewOffers,
  onToggleCompare,
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () =>
      [...variants].sort(
        (a, b) =>
          (Number(a.price ?? a.startingPrice) || 0) -
          (Number(b.price ?? b.startingPrice) || 0)
      ),
    [variants]
  );

  if (!sorted.length) return null;

  const visible = showAll
    ? sorted
    : sorted.slice(0, INITIAL_VISIBLE);

  const prices = sorted
    .map((v) => Number(v.price ?? v.startingPrice) || 0)
    .filter((p) => p > 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const intro =
    prices.length > 1
      ? `${familyTitle} is offered in ${sorted.length} variants, with ex-showroom prices from ${formatIndianPrice(minPrice, { prefix: "" })} to ${formatIndianPrice(maxPrice, { prefix: "" })}.`
      : `${familyTitle} is offered in ${sorted.length} variant${sorted.length > 1 ? "s" : ""}.`;

  const isCompared = (slug) =>
    compareSlugs.includes(normalizeVehicleSlug(slug));

  return (
    <section
      id="detail-variants"
      className="cd-section cd-variants cd-card"
      aria-labelledby="detail-variants-title"
    >
      <h2 id="detail-variants-title" className="cd-section__title">
        {familyTitle} variants
      </h2>
      <p className="cd-section__intro">{intro}</p>

      <div className="cd-variants-table-wrap">
        <table className="cd-variants-table">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Battery &amp; range</th>
              <th>Ex-showroom price</th>
              <th>Offers</th>
              <th aria-label="Compare" />
            </tr>
          </thead>
          <tbody>
            {visible.map((variant) => (
              <VariantRow
                key={variant.slug}
                variant={variant}
                familyTitle={familyTitle}
                familyFallback={familyFallback}
                isActive={
                  normalizeVehicleSlug(variant.slug) ===
                  normalizeVehicleSlug(selectedSlug)
                }
                isCompared={isCompared(variant.slug)}
                onSelect={onSelectVariant}
                onOnRoadPrice={onOnRoadPrice}
                onViewOffers={onViewOffers}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="cd-variants-cards">
        {visible.map((variant) => (
          <VariantCard
            key={variant.slug}
            variant={variant}
            familyTitle={familyTitle}
            familyFallback={familyFallback}
            isActive={
              normalizeVehicleSlug(variant.slug) ===
              normalizeVehicleSlug(selectedSlug)
            }
            isCompared={isCompared(variant.slug)}
            onSelect={onSelectVariant}
            onOnRoadPrice={onOnRoadPrice}
            onViewOffers={onViewOffers}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>

      {sorted.length > INITIAL_VISIBLE && (
        <button
          type="button"
          className="cd-variants-toggle"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer variants" : "View all variants"}{" "}
          <span aria-hidden>{showAll ? "▲" : "▼"}</span>
        </button>
      )}
    </section>
  );
}
