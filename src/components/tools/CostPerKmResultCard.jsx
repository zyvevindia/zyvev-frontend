import {
  formatCostPerKmRate,
  formatOwnershipToolInr,
} from "../../tools/costPerKmCalculator.js";
import { COST_PER_KM_DEFAULTS } from "../../tools/costPerKmDefaults.js";

/**
 * @param {{
 *   costPerKm: number,
 *   monthlyCost: number,
 *   yearlyCost: number,
 *   savingsTier: { label: string, tone: string },
 * }} props
 */
export default function CostPerKmResultCard({
  costPerKm,
  monthlyCost,
  yearlyCost,
  savingsTier,
}) {
  return (
    <article className="cost-per-km-result">
      <p className="cost-per-km-result__eyebrow">Your estimate</p>

      <div className="cost-per-km-result__metric cost-per-km-result__metric--primary">
        <span className="cost-per-km-result__metric-label">Running cost</span>
        <strong className="cost-per-km-result__metric-value">
          {formatCostPerKmRate(costPerKm)}
        </strong>
      </div>

      <div className="cost-per-km-result__grid">
        <div className="cost-per-km-result__metric">
          <span className="cost-per-km-result__metric-label">Monthly cost</span>
          <strong className="cost-per-km-result__metric-value">
            {formatOwnershipToolInr(monthlyCost)}
          </strong>
          <span className="cost-per-km-result__metric-note">
            Based on {COST_PER_KM_DEFAULTS.monthlyKm.toLocaleString("en-IN")} km/month
          </span>
        </div>

        <div className="cost-per-km-result__metric">
          <span className="cost-per-km-result__metric-label">Yearly cost</span>
          <strong className="cost-per-km-result__metric-value">
            {formatOwnershipToolInr(yearlyCost)}
          </strong>
          <span className="cost-per-km-result__metric-note">
            Based on {COST_PER_KM_DEFAULTS.yearlyKm.toLocaleString("en-IN")} km/year
          </span>
        </div>
      </div>

      <div className="cost-per-km-result__savings">
        <span className="cost-per-km-result__metric-label">Savings indicator</span>
        <span
          className={[
            "cost-per-km-result__chip",
            `cost-per-km-result__chip--${savingsTier.tone}`,
          ].join(" ")}
        >
          {savingsTier.label}
        </span>
      </div>
    </article>
  );
}
