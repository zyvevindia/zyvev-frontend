import { forwardRef } from "react";

import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { buildVariantComparisonRows } from "../../utils/variantInsights";

function ChargingLines({ lines }) {
  if (!lines?.length) return "—";
  return (
    <span className="variant-comparison__charging-lines">
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="variant-comparison__charging-line">
          {line}
        </span>
      ))}
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
    embedded = false,
    hideHeader = false,
    title = "Variants",
    intro = "Side-by-side specs for every trim in this model family.",
    showCompareAll = true,
    readOnly = false,
  },
  ref
) {
  const rows = buildVariantComparisonRows(variants);
  if (rows.length < 1) return null;

  const selectable = !readOnly && typeof onSelect === "function";

  const titleId = `${id}-title`;
  const body = (
    <>
      {!hideHeader ? (
        <>
          <h2 id={titleId} className="cd-section__title">
            {title}
          </h2>
          <p className="cd-section__intro">{intro}</p>
        </>
      ) : null}

      <div className="variant-comparison__cards">
        {rows.map((row) => {
          const isActive = row.slug === selectedSlug;
          const highlight = rowHighlightClass(row, isActive);

          return (
            <article
              key={row.slug}
              className={`variant-comparison-card${highlight ? ` ${highlight}` : ""}`}
            >
              {selectable ? (
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
              ) : (
                <span className="variant-comparison-card__name">
                  {row.name}
                </span>
              )}
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
                  <dt>Range (ARAI)</dt>
                  <dd>{row.rangeLabel || "—"}</dd>
                </div>
                <div>
                  <dt>Real World Range</dt>
                  <dd>{row.realWorldRangeLabel || "—"}</dd>
                </div>
                <div>
                  <dt>Charging</dt>
                  <dd>
                    <ChargingLines lines={row.chargingLines} />
                  </dd>
                </div>
                <div>
                  <dt>Power</dt>
                  <dd>{row.power || "—"}</dd>
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
              <th scope="col">Range (ARAI)</th>
              <th scope="col">Real World Range</th>
              <th scope="col">Charging</th>
              <th scope="col">Power</th>
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
                    {selectable ? (
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
                    ) : (
                      row.name
                    )}
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
                  <td>{row.realWorldRangeLabel || "—"}</td>
                  <td>
                    <ChargingLines lines={row.chargingLines} />
                  </td>
                  <td>{row.power || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCompareAll && onCompareAll ? (
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
    </>
  );

  const a11yProps = hideHeader
    ? { "aria-label": "Variant comparison" }
    : { "aria-labelledby": titleId };

  if (embedded) {
    return (
      <div
        ref={ref}
        className="variant-comparison variant-comparison--embedded"
        {...a11yProps}
      >
        {body}
      </div>
    );
  }

  return (
    <section
      ref={ref}
      id={id}
      className="cd-section cd-card cd-content-card variant-comparison"
      {...a11yProps}
    >
      {body}
    </section>
  );
});

export default VariantComparisonTable;
