import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { buildVariantComparisonRows } from "../../utils/variantInsights";

export default function VariantComparisonTable({
  variants = [],
  selectedSlug,
  onSelect,
  id = "variant-comparison",
}) {
  const rows = buildVariantComparisonRows(variants);
  if (rows.length < 2) return null;

  return (
    <section
      id={id}
      className="variant-comparison"
      aria-labelledby={`${id}-title`}
    >
      <h2
        id={`${id}-title`}
        className="variant-comparison__title"
      >
        Variant comparison
      </h2>
      <p className="variant-comparison__subtitle">
        Side-by-side specs for every trim in this model
        family.
      </p>

      <div className="variant-comparison__scroll">
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
              return (
                <tr
                  key={row.slug}
                  className={
                    isActive
                      ? "variant-comparison__row--active"
                      : undefined
                  }
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
                        {row.badges
                          .slice(0, 2)
                          .map((b) => (
                            <span
                              key={b.key}
                              className="variant-comparison__badge"
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
                    {row.confidence != null
                      ? `${Math.round(row.confidence)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
