import { PETROL_SAVINGS_COLORS } from "../../tools/petrolSavingsDefaults.js";
import { formatTcoInr, formatTcoLakh } from "../../tools/tcoCalculator.js";

/**
 * @param {{
 *   evBreakdown?: Array<{ key: string, label: string, amountInr: number }>,
 *   petrolBreakdown?: Array<{ key: string, label: string, amountInr: number }>,
 *   evTotalInr?: number,
 *   petrolTotalInr?: number,
 * }} props
 */
export default function PetrolSavingsChart({
  evBreakdown = [],
  petrolBreakdown = [],
  evTotalInr = 0,
  petrolTotalInr = 0,
}) {
  const maxTotal = Math.max(evTotalInr, petrolTotalInr, 1);

  return (
    <section className="petrol-savings-chart" aria-labelledby="petrol-savings-chart-title">
      <h2 id="petrol-savings-chart-title" className="petrol-savings-chart__title">
        Ownership cost comparison
      </h2>

      <div className="petrol-savings-chart__totals">
        <ComparisonBar
          label="EV"
          totalInr={evTotalInr}
          maxTotal={maxTotal}
          tone="ev"
        />
        <ComparisonBar
          label="Petrol"
          totalInr={petrolTotalInr}
          maxTotal={maxTotal}
          tone="petrol"
        />
      </div>

      <div className="petrol-savings-chart__stacked-grid">
        <StackedBreakdown
          title="EV cost mix"
          breakdown={evBreakdown}
          totalInr={evTotalInr}
        />
        <StackedBreakdown
          title="Petrol cost mix"
          breakdown={petrolBreakdown}
          totalInr={petrolTotalInr}
        />
      </div>
    </section>
  );
}

/**
 * @param {{ label: string, totalInr: number, maxTotal: number, tone: "ev"|"petrol" }} props
 */
function ComparisonBar({ label, totalInr, maxTotal, tone }) {
  const widthPct = Math.max(4, (totalInr / maxTotal) * 100);

  return (
    <div className="petrol-savings-chart__total-row">
      <div className="petrol-savings-chart__total-head">
        <span className="petrol-savings-chart__total-label">{label}</span>
        <span className="petrol-savings-chart__total-value">
          {formatTcoLakh(totalInr)}
        </span>
      </div>
      <div className="petrol-savings-chart__total-track">
        <div
          className={[
            "petrol-savings-chart__total-fill",
            `petrol-savings-chart__total-fill--${tone}`,
          ].join(" ")}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * @param {{ title: string, breakdown: Array<{ key: string, label: string, amountInr: number }>, totalInr: number }} props
 */
function StackedBreakdown({ title, breakdown, totalInr }) {
  const visible = breakdown.filter((item) => item.amountInr > 0);
  const total = totalInr > 0 ? totalInr : 1;

  return (
    <div className="petrol-savings-chart__stacked">
      <h3 className="petrol-savings-chart__stacked-title">{title}</h3>
      <div className="petrol-savings-chart__stacked-bar">
        {visible.map((item) => (
          <div
            key={item.key}
            className="petrol-savings-chart__stacked-segment"
            style={{
              width: `${Math.max(2, (item.amountInr / total) * 100)}%`,
              backgroundColor:
                PETROL_SAVINGS_COLORS[item.key] || "#94a3b8",
            }}
            title={`${item.label}: ${formatTcoInr(item.amountInr)}`}
          />
        ))}
      </div>
      <ul className="petrol-savings-chart__legend">
        {visible.map((item) => (
          <li key={item.key} className="petrol-savings-chart__legend-item">
            <span
              className="petrol-savings-chart__swatch"
              style={{
                backgroundColor:
                  PETROL_SAVINGS_COLORS[item.key] || "#94a3b8",
              }}
            />
            <span>{item.label}</span>
            <span>{formatTcoInr(item.amountInr)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
