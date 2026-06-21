import { TCO_BREAKDOWN_COLORS } from "../../tools/tcoDefaults.js";
import { formatTcoInr } from "../../tools/tcoCalculator.js";

/**
 * @param {{
 *   breakdown?: Array<{ key: string, label: string, amountInr: number }>,
 *   totalOwnershipCostInr?: number,
 * }} props
 */
export default function TcoBreakdownChart({
  breakdown = [],
  totalOwnershipCostInr = 0,
}) {
  const total = totalOwnershipCostInr > 0 ? totalOwnershipCostInr : 1;
  const visible = breakdown.filter((item) => item.amountInr > 0);

  if (!visible.length) {
    return null;
  }

  return (
    <section className="tco-breakdown" aria-labelledby="tco-breakdown-title">
      <h2 id="tco-breakdown-title" className="tco-breakdown__title">
        Cost breakdown
      </h2>

      <div
        className="tco-breakdown__bar"
        role="img"
        aria-label="Stacked horizontal ownership cost breakdown"
      >
        {visible.map((item) => {
          const widthPct = Math.max(2, (item.amountInr / total) * 100);
          return (
            <div
              key={item.key}
              className="tco-breakdown__segment"
              style={{
                width: `${widthPct}%`,
                backgroundColor:
                  TCO_BREAKDOWN_COLORS[item.key] || "#94a3b8",
              }}
              title={`${item.label}: ${formatTcoInr(item.amountInr)}`}
            />
          );
        })}
      </div>

      <ul className="tco-breakdown__legend">
        {visible.map((item) => (
          <li key={item.key} className="tco-breakdown__legend-item">
            <span
              className="tco-breakdown__swatch"
              style={{
                backgroundColor:
                  TCO_BREAKDOWN_COLORS[item.key] || "#94a3b8",
              }}
              aria-hidden="true"
            />
            <span className="tco-breakdown__legend-label">{item.label}</span>
            <span className="tco-breakdown__legend-value">
              {formatTcoInr(item.amountInr)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
