import { forwardRef, useMemo, useState } from "react";

import { formatIndianPriceCompact, formatLakhAmount } from "../../utils/formatIndianPrice";
import { buildVariantComparisonRows } from "../../utils/variantInsights";
import { scrollToDetailSection } from "../../utils/detailPageNav.js";
import { carsMatchCompareSelection } from "../../utils/compareCarsStorage.js";

import "./variant-comparison-premium.css";

const INITIAL_VISIBLE = 3;

const SCALE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" />
  </svg>
);

const SHIELD_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
  </svg>
);

const BEST_FOR_LABEL_MAP = {
  city_use: "City driving",
  family_use: "Family use",
  best_value: "Budget buyers",
  long_range: "Long-distance travel",
  fast_charging: "Daily commuting",
};

function formatPriceShortL(inr) {
  const lakhLabel = formatLakhAmount(inr, { maxDecimals: 2 });
  if (!lakhLabel) return null;
  if (/Cr/i.test(lakhLabel)) {
    return `₹${lakhLabel.replace(/\s*Cr$/i, "Cr")}`;
  }
  const num = lakhLabel.replace(/\s*Lakh$/i, "");
  return `₹${num}L`;
}

function formatVariantPriceRange(rows = []) {
  const prices = rows.map((row) => row.price).filter((p) => p > 0);
  if (!prices.length) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const minLabel = formatPriceShortL(min);
  const maxLabel = formatPriceShortL(max);

  if (!minLabel) return null;
  if (Math.abs(min - max) < 1) return minLabel;
  if (!maxLabel) return minLabel;
  return `${minLabel} – ${maxLabel}`;
}

function formatDcCharging(chargingLines) {
  if (!chargingLines?.length) return "—";
  const dcLine = chargingLines.find((line) => /^DC:/i.test(line));
  if (dcLine) return dcLine.replace(/^DC:\s*/i, "");
  return chargingLines[0].replace(/^(DC|AC):\s*/i, "");
}

function getBestForLabels(row) {
  const badges = row.badges || [];
  const mapped = badges
    .filter((badge) => badge.key !== "recommended")
    .map((badge) => BEST_FOR_LABEL_MAP[badge.key] || badge.label)
    .filter(Boolean);

  if (mapped.length) {
    return mapped.slice(0, 2);
  }

  return ["Balanced city + highway"];
}

function getRecommendedMeta(row) {
  const badges = row.badges || [];
  const hasRecommended = badges.some((badge) => badge.key === "recommended");
  const hasBestValue = badges.some((badge) => badge.key === "best_value");
  const hasLongRange = badges.some((badge) => badge.key === "long_range");

  if (hasRecommended) {
    return {
      show: true,
      title: "Recommended",
      subtitle: "Top balanced variant",
    };
  }

  if (hasBestValue) {
    return {
      show: true,
      title: "Recommended",
      subtitle: "Best value",
    };
  }

  if (hasLongRange) {
    return {
      show: true,
      title: "Recommended",
      subtitle: "Longest range",
    };
  }

  return { show: false };
}

function pickPrimaryRecommendedSlug(rows = [], variants = []) {
  if (!rows.length) return null;

  const variantBySlug = Object.fromEntries(
    variants.map((variant) => [variant.slug, variant])
  );

  const recommendedRows = rows.filter((row) =>
    row.badges?.some((badge) => badge.key === "recommended")
  );

  if (recommendedRows.length) {
    const featured = recommendedRows.find(
      (row) => variantBySlug[row.slug]?.isFeatured
    );
    if (featured) return featured.slug;

    const balanced = recommendedRows.find((row) =>
      row.badges.some((badge) =>
        ["city_use", "family_use", "long_range", "fast_charging"].includes(
          badge.key
        )
      )
    );
    if (balanced) return balanced.slug;

    return recommendedRows[0].slug;
  }

  const featuredVariant = variants.find((variant) => variant.isFeatured);
  if (featuredVariant?.slug) return featuredVariant.slug;

  const priced = [...rows]
    .filter((row) => row.price > 0)
    .sort((a, b) => a.price - b.price);

  if (priced.length >= 3) {
    return priced[Math.floor(priced.length / 2)].slug;
  }

  return priced[0]?.slug || rows[0]?.slug || null;
}

function rowClassName(row, { isActive, isPrimary, animateIn }) {
  return [
    isPrimary ? "variant-comparison__row--primary" : "",
    isActive ? "variant-comparison__row--active" : "",
    animateIn ? "variant-comparison__row--animate-in" : "",
  ]
    .filter(Boolean)
    .join(" ") || undefined;
}

const VariantComparisonTable = forwardRef(function VariantComparisonTable(
  {
    variants = [],
    selectedSlug,
    onSelect,
    onCompareAll,
    onAddToCompare,
    onToggleCompare,
    compareList = [],
    id = "variants",
    embedded = false,
    hideHeader = false,
    title,
    intro,
    showCompareAll = true,
    readOnly = false,
  },
  ref
) {
  const [showAll, setShowAll] = useState(false);

  const rows = buildVariantComparisonRows(variants);
  if (rows.length < 1) return null;

  const selectable = !readOnly && typeof onSelect === "function";
  const variantCount = rows.length;
  const resolvedTitle = title || `All Variants (${variantCount})`;
  const resolvedIntro =
    intro ||
    "Compare specifications and choose the variant that best matches your needs.";

  const primarySlug = useMemo(
    () => pickPrimaryRecommendedSlug(rows, variants),
    [rows, variants]
  );

  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, rows.length - INITIAL_VISIBLE);
  const priceRangeLabel = formatVariantPriceRange(rows);

  const isCompared = (slug) => {
    const variant = variants.find((item) => item.slug === slug);
    if (!variant || !compareList.length) return false;
    return compareList.some((car) => carsMatchCompareSelection(car, variant));
  };

  const titleId = `${id}-title`;

  function handleScrollToCompare() {
    if (typeof onCompareAll === "function") {
      onCompareAll();
      return;
    }
    scrollToDetailSection("compare");
  }

  function handleExploreVariants() {
    if (!showAll && hiddenCount > 0) {
      setShowAll(true);
      return;
    }
    scrollToDetailSection("variants");
  }

  function handleToggleCompare(slug, event) {
    event?.stopPropagation?.();
    const variant = variants.find((item) => item.slug === slug);
    if (variant && typeof onToggleCompare === "function") {
      onToggleCompare(variant);
    }
  }

  const body = (
    <>
      {!hideHeader ? (
        <header className="variant-comparison__header">
          <div className="variant-comparison__header-copy">
            <h2 id={titleId} className="cd-section__title variant-comparison__title">
              {resolvedTitle}
            </h2>
            <p className="cd-section__intro variant-comparison__intro">
              {resolvedIntro}
            </p>
          </div>

          {showCompareAll ? (
            <button
              type="button"
              className="variant-comparison__header-action"
              onClick={handleScrollToCompare}
            >
              {SCALE_ICON}
              Compare All Variants
            </button>
          ) : null}
        </header>
      ) : null}

      <div className="variant-comparison__cards">
        <div
          className="variant-comparison__cards-body"
          style={{
            maxHeight: showAll
              ? `${rows.length * 360}px`
              : `${Math.min(INITIAL_VISIBLE, rows.length) * 360}px`,
          }}
        >
          {visibleRows.map((row, index) => {
            const isActive = row.slug === selectedSlug;
            const isPrimary = row.slug === primarySlug;
            const recommended = getRecommendedMeta(row);
            const bestFor = getBestForLabels(row);
            const highlight = rowClassName(row, {
              isActive,
              isPrimary,
              animateIn: showAll && index >= INITIAL_VISIBLE,
            });

            return (
              <article
                key={row.slug}
                className={`variant-comparison-card${highlight ? ` ${highlight}` : ""}`}
              >
                <div className="variant-comparison-card__head">
                  {selectable ? (
                    <button
                      type="button"
                      className="variant-comparison-card__select"
                      onClick={() =>
                        onSelect?.(
                          variants.find((variant) => variant.slug === row.slug)
                        )
                      }
                    >
                      <span className="variant-comparison-card__name">
                        {row.name}
                      </span>
                    </button>
                  ) : (
                    <span className="variant-comparison-card__name">
                      {row.name}
                    </span>
                  )}

                  {isPrimary ? (
                    <span className="variant-comparison__primary-badge">
                      MOST RECOMMENDED
                    </span>
                  ) : null}
                </div>

                <dl className="variant-comparison-card__specs">
                  <div>
                    <dt>Price</dt>
                    <dd>
                      {row.priceLabel
                        ? formatIndianPriceCompact(row.priceLabel)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Real-world Range</dt>
                    <dd>{row.realWorldRangeLabel || "—"}</dd>
                  </div>
                  <div>
                    <dt>Battery</dt>
                    <dd>{row.battery || "—"}</dd>
                  </div>
                  <div>
                    <dt>DC Fast Charging</dt>
                    <dd>{formatDcCharging(row.chargingLines)}</dd>
                  </div>
                  <div>
                    <dt>Best For</dt>
                    <dd>{bestFor.join(" · ")}</dd>
                  </div>
                  {recommended.show ? (
                    <div>
                      <dt>Recommended</dt>
                      <dd>
                        <span className="variant-comparison__recommended-head">
                          <span className="variant-comparison__recommended-star" aria-hidden>
                            ★
                          </span>
                          {recommended.title}
                        </span>
                        <span className="variant-comparison__recommended-sub">
                          {recommended.subtitle}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {!readOnly && typeof onToggleCompare === "function" ? (
                  <div className="variant-comparison-card__footer">
                    <label className="variant-comparison-card__compare-label">
                      <input
                        type="checkbox"
                        checked={isCompared(row.slug)}
                        aria-label={`Compare ${row.name}`}
                        onChange={(event) => handleToggleCompare(row.slug, event)}
                      />
                      Compare
                    </label>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      <div className="variant-comparison__scroll variant-comparison__scroll--desktop">
        <div className="variant-comparison__table-wrap">
          <table className="variant-comparison__table">
            <thead>
              <tr>
                <th scope="col">Variant</th>
                <th scope="col">Price</th>
                <th scope="col">Real-world Range</th>
                <th scope="col">Battery</th>
                <th scope="col">Power</th>
                <th scope="col">DC Fast Charging</th>
                <th scope="col">Best For</th>
                <th scope="col">Recommended</th>
                {!readOnly && typeof onToggleCompare === "function" ? (
                  <th scope="col" aria-label="Compare" />
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => {
                const isActive = row.slug === selectedSlug;
                const isPrimary = row.slug === primarySlug;
                const recommended = getRecommendedMeta(row);
                const bestFor = getBestForLabels(row);
                const rowClass = rowClassName(row, {
                  isActive,
                  isPrimary,
                  animateIn: showAll && index >= INITIAL_VISIBLE,
                });

                return (
                  <tr key={row.slug} className={rowClass}>
                    <th scope="row">
                      <div className="variant-comparison__variant-cell">
                        {selectable ? (
                          <button
                            type="button"
                            className="variant-comparison__variant-btn"
                            onClick={() =>
                              onSelect?.(
                                variants.find(
                                  (variant) => variant.slug === row.slug
                                )
                              )
                            }
                          >
                            {row.name}
                          </button>
                        ) : (
                          <span className="variant-comparison__variant-btn">
                            {row.name}
                          </span>
                        )}
                        {isPrimary ? (
                          <span className="variant-comparison__primary-badge">
                            MOST RECOMMENDED
                          </span>
                        ) : null}
                      </div>
                    </th>
                    <td>
                      {row.priceLabel
                        ? formatIndianPriceCompact(row.priceLabel)
                        : "—"}
                    </td>
                    <td>{row.realWorldRangeLabel || "—"}</td>
                    <td>{row.battery || "—"}</td>
                    <td>{row.power || "—"}</td>
                    <td>{formatDcCharging(row.chargingLines)}</td>
                    <td>
                      <div className="variant-comparison__best-for">
                        {bestFor.map((label) => (
                          <span
                            key={`${row.slug}-${label}`}
                            className="variant-comparison__best-for-item"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {recommended.show ? (
                        <div className="variant-comparison__recommended">
                          <span className="variant-comparison__recommended-head">
                            <span
                              className="variant-comparison__recommended-star"
                              aria-hidden
                            >
                              ★
                            </span>
                            {recommended.title}
                          </span>
                          <span className="variant-comparison__recommended-sub">
                            {recommended.subtitle}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    {!readOnly && typeof onToggleCompare === "function" ? (
                      <td className="variant-comparison__compare-cell">
                        <input
                          type="checkbox"
                          checked={isCompared(row.slug)}
                          aria-label={`Compare ${row.name}`}
                          onChange={(event) =>
                            handleToggleCompare(row.slug, event)
                          }
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hiddenCount > 0 ? (
          <button
            type="button"
            className="variant-comparison__expand-btn"
            aria-expanded={showAll}
            onClick={() => setShowAll((open) => !open)}
          >
            {showAll
              ? `Show fewer variants ↑`
              : `View all ${variantCount} variants ↓`}
          </button>
        ) : null}
      </div>

      {hiddenCount > 0 ? (
        <button
          type="button"
          className="variant-comparison__expand-btn variant-comparison__expand-btn--mobile"
          aria-expanded={showAll}
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll
            ? `Show fewer variants ↑`
            : `View all ${variantCount} variants ↓`}
        </button>
      ) : null}

      <div className="variant-comparison__decision-bar">
        <div>
          <p className="variant-comparison__decision-price-label">Price range</p>
          <p className="variant-comparison__decision-price-value">
            {priceRangeLabel || "Price on request"}
          </p>
        </div>

        <button
          type="button"
          className="variant-comparison__decision-explore"
          onClick={handleExploreVariants}
        >
          Explore all variants
        </button>

        {typeof onAddToCompare === "function" ? (
          <button
            type="button"
            className="variant-comparison__decision-compare"
            onClick={onAddToCompare}
          >
            Add to Compare
          </button>
        ) : null}
      </div>

      <div className="variant-comparison__trust">
        {SHIELD_ICON}
        <span>
          All insights are based on verified data and real-world estimates.
        </span>
      </div>
    </>
  );

  const a11yProps = hideHeader
    ? { "aria-label": "Variant comparison" }
    : { "aria-labelledby": titleId };

  const rootClass = [
    "variant-comparison",
    "variant-comparison--premium",
    embedded ? "variant-comparison--embedded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (embedded) {
    return (
      <div ref={ref} id={id} className={rootClass} {...a11yProps}>
        {body}
      </div>
    );
  }

  return (
    <section ref={ref} id={id} className={`cd-section cd-card cd-content-card ${rootClass}`} {...a11yProps}>
      {body}
    </section>
  );
});

export default VariantComparisonTable;
