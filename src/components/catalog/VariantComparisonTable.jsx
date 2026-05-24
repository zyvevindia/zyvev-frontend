import { forwardRef } from "react";

import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { buildVariantComparisonRows } from "../../utils/variantInsights";

function ConfidenceMeter({ value }) {
  if (value == null) {
    return <span className="variant-comparison__confidence-na">—</span>;
  }

  const pct = Math.max(0, Math.min(100, Math.round(value)));
  let level = "low";
  if (pct >= 75) level = "high";
  else if (pct >= 50) level = "medium";

  return (
    <span className="variant-comparison__confidence">
      <span
        className={`variant-comparison__confidence-bar variant-comparison__confidence-bar--${level}`}
        style={{ width: `${pct}%` }}
      />
      <span className="variant-comparison__confidence-label">
        {pct}%
      </span>
    </span>
  );
}

function rowHighlightClass(row, isActive) {
  const classes = [];
  if (isActive) classes.push("variant-comparison__row--active");
  if (row.badges?.some((b) => b.key === "recommended")) {
    classes.push("variant-comparison__row--recommended");
  }
  if (row.badges?.some((b) => b.key === "best_value")) {
    classes.push("variant-comparison__row--best-value");
  }
  return classes.join(" ") || undefined;
}

const VariantComparisonTable = forwardRef(function VariantComparisonTable(
  {
    variants = [],
    selectedSlug,
    onSelect,
    onCompareAll,
    id = "variants",
  },
  ref
) {
  const rows = buildVariantComparisonRows(variants);
  if (rows.length < 1) return null;

  return (
    <section
      ref={ref}
      id={id}
      className="cd-section cd-card cd-content-card variant-comparison"
      aria-labelledby={`${id}-title`}
    >
      <h2
        id={`${id}-title`}
        className="cd-section__title"
      >
        Variants
      </h2>
      <p className="cd-section__intro">
        Side-by-side specs for every trim in this model
        family.
      </p>

      <div className="variant-comparison__cards">
        {rows.map((row) => {
          const isActive = row.slug === selectedSlug;
          const highlight = rowHighlightClass(row, isActive);

          return (
            <article
              key={row.slug}
              className={`variant-comparison-card${highlight ? ` ${highlight}` : ""}`}
            >
              <button
                type="button"
                className="variant-comparison-card__select"
                onClick={() =>
                  onSelect?.(
                    variants.find(
                      (v) => v.slug === row.slug
                    )
                  )
                }
              >
                <span className="variant-comparison-card__name">
                  {row.name}
                </span>
              </button>
              {row.badges?.length > 0 && (
                <div className="variant-comparison__badges">
                  {row.badges.slice(0, 3).map((b) => (
                    <span
                      key={b.key}
                      className={`variant-comparison__badge${
                        b.key === "best_value"
                          ? " variant-comparison__badge--value"
                          : b.key === "long_range"
                            ? " variant-comparison__badge--range"
                            : b.key === "recommended"
                              ? " variant-comparison__badge--recommended"
                              : ""
                      }`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
              <dl className="variant-comparison-card__specs">
                <div>
                  <dt>Price</dt>
                  <dd>
                    {row.priceLabel
                      ? formatIndianPriceCompact(
                          row.priceLabel
                        )
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Battery</dt>
                  <dd>{row.battery || "—"}</dd>
                </div>
                <div>
                  <dt>Range</dt>
                  <dd>{row.rangeLabel || "—"}</dd>
                </div>
                <div>
                  <dt>Charging</dt>
                  <dd>{row.charging || "—"}</dd>
                </div>
                <div>
                  <dt>Performance</dt>
                  <dd>{row.performance || "—"}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>
                    <ConfidenceMeter value={row.confidence} />
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="variant-comparison__scroll variant-comparison__scroll--desktop">
        <table className="variant-comparison__table">
          <thead>
            <tr>
              <th scope="col">Variant</th>
              <th scope="col">Price</th>
              <th scope="col">Battery</th>
              <th scope="col">Range</th>
              <th scope="col">Charging</th>
              <th scope="col">Performance</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isActive = row.slug === selectedSlug;
              const rowClass = rowHighlightClass(row, isActive);

              return (
                <tr
                  key={row.slug}
                  className={rowClass}
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="variant-comparison__variant-btn"
                      onClick={() =>
                        onSelect?.(
                          variants.find(
                            (v) => v.slug === row.slug
                          )
                        )
                      }
                    >
                      {row.name}
                    </button>
                    {row.badges?.length > 0 && (
                      <span className="variant-comparison__badges">
                        {row.badges.slice(0, 3).map((b) => (
                          <span
                            key={b.key}
                            className={`variant-comparison__badge${
                              b.key === "best_value"
                                ? " variant-comparison__badge--value"
                                : b.key === "long_range"
                                  ? " variant-comparison__badge--range"
                                  : b.key === "recommended"
                                    ? " variant-comparison__badge--recommended"
                                    : ""
                            }`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </span>
                    )}
                  </th>
                  <td>
                    {row.priceLabel
                      ? formatIndianPriceCompact(
                          row.priceLabel
                        )
                      : "—"}
                  </td>
                  <td>{row.battery || "—"}</td>
                  <td>{row.rangeLabel || "—"}</td>
                  <td>{row.charging || "—"}</td>
                  <td>{row.performance || "—"}</td>
                  <td>
                    <ConfidenceMeter value={row.confidence} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onCompareAll ? (
        <footer className="variant-comparison__footer">
          <button
            type="button"
            className="variant-selector__compare-btn"
            onClick={onCompareAll}
          >
            Compare all variants
          </button>
        </footer>
      ) : null}
    </section>
  );
});

export default VariantComparisonTable;
