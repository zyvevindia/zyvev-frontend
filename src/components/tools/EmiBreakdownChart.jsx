import { EMI_BREAKDOWN_COLORS } from "../../tools/emiDefaults.js";
import { formatEmiInr, formatEmiLakh } from "../../tools/emiCalculator.js";

/**
 * @param {{
 *   breakdown?: Array<{ key: string, label: string, amountInr: number }>,
 *   totalOutflowInr?: number,
 * }} props
 */
export default function EmiBreakdownChart({
  breakdown = [],
  totalOutflowInr = 0,
}) {
  const visible = breakdown.filter((item) => item.amountInr > 0);
  const total = totalOutflowInr > 0 ? totalOutflowInr : 1;

  if (!visible.length) {
    return null;
  }

  return (
    <section className="emi-breakdown" aria-labelledby="emi-breakdown-title">
      <h2 id="emi-breakdown-title" className="emi-breakdown__title">
        Loan outflow breakdown
      </h2>

      <div
        className="emi-breakdown__bar"
        role="img"
        aria-label="Stacked loan outflow breakdown"
      >
        {visible.map((item) => (
          <div
            key={item.key}
            className="emi-breakdown__segment"
            style={{
              width: `${Math.max(2, (item.amountInr / total) * 100)}%`,
              backgroundColor:
                EMI_BREAKDOWN_COLORS[item.key] || "#94a3b8",
            }}
            title={`${item.label}: ${formatEmiInr(item.amountInr)}`}
          />
        ))}
      </div>

      <ul className="emi-breakdown__legend">
        {visible.map((item) => (
          <li key={item.key} className="emi-breakdown__legend-item">
            <span
              className="emi-breakdown__swatch"
              style={{
                backgroundColor:
                  EMI_BREAKDOWN_COLORS[item.key] || "#94a3b8",
              }}
              aria-hidden="true"
            />
            <span className="emi-breakdown__legend-label">{item.label}</span>
            <span className="emi-breakdown__legend-value">
              {item.key === "principal" ||
              item.key === "interest" ||
              item.amountInr >= 100000
                ? formatEmiLakh(item.amountInr)
                : formatEmiInr(item.amountInr)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
