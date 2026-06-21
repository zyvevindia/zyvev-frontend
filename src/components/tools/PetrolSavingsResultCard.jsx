import {
  formatBreakEvenDistance,
} from "../../tools/petrolSavingsCalculator.js";
import { formatTcoLakh } from "../../tools/tcoCalculator.js";

/**
 * @param {{
 *   evTotalInr: number,
 *   petrolTotalInr: number,
 *   savingsInr: number,
 *   savingsPct: number,
 *   tone: "green" | "amber" | "red",
 *   breakEvenKm: number|null,
 *   ownershipYears: number,
 * }} props
 */
export default function PetrolSavingsResultCard({
  evTotalInr,
  petrolTotalInr,
  savingsInr,
  savingsPct,
  tone,
  breakEvenKm,
  ownershipYears,
}) {
  return (
    <article
      className={[
        "petrol-savings-result",
        `petrol-savings-result--${tone}`,
      ].join(" ")}
    >
      <p className="petrol-savings-result__eyebrow">
        {ownershipYears}-year comparison
      </p>

      <div className="petrol-savings-result__compare-grid">
        <div className="petrol-savings-result__compare-item petrol-savings-result__compare-item--ev">
          <span className="petrol-savings-result__compare-label">EV ownership</span>
          <strong className="petrol-savings-result__compare-value">
            {formatTcoLakh(evTotalInr)}
          </strong>
        </div>
        <div className="petrol-savings-result__compare-item petrol-savings-result__compare-item--petrol">
          <span className="petrol-savings-result__compare-label">
            Petrol ownership
          </span>
          <strong className="petrol-savings-result__compare-value">
            {formatTcoLakh(petrolTotalInr)}
          </strong>
        </div>
      </div>

      <div className="petrol-savings-result__savings">
        <span className="petrol-savings-result__savings-label">Total savings</span>
        <strong className="petrol-savings-result__savings-value">
          {savingsInr >= 0 ? "" : "−"}
          {formatTcoLakh(Math.abs(savingsInr))}
        </strong>
        <span className="petrol-savings-result__savings-pct">
          {savingsPct >= 0 ? "+" : ""}
          {savingsPct.toFixed(1)}% vs petrol
        </span>
      </div>

      <div className="petrol-savings-result__break-even">
        <span className="petrol-savings-result__meta-label">Break-even distance</span>
        <strong className="petrol-savings-result__meta-value">
          {breakEvenKm == null ? "Not reached" : formatBreakEvenDistance(breakEvenKm)}
        </strong>
      </div>
    </article>
  );
}
