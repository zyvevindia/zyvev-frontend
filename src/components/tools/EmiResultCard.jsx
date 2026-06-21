import {
  formatEmiLakh,
  formatEmiMonthly,
} from "../../tools/emiCalculator.js";

/**
 * @param {{
 *   monthlyEmi: number,
 *   loanAmountInr: number,
 *   totalInterestInr: number,
 *   totalOutflowInr: number,
 *   affordability: { label: string, tone: string },
 *   loanTenureYears: number,
 * }} props
 */
export default function EmiResultCard({
  monthlyEmi,
  loanAmountInr,
  totalInterestInr,
  totalOutflowInr,
  affordability,
  loanTenureYears,
}) {
  return (
    <article
      className={[
        "emi-result",
        `emi-result--${affordability.tone}`,
      ].join(" ")}
    >
      <p className="emi-result__eyebrow">{loanTenureYears}-year loan estimate</p>

      <div className="emi-result__metric emi-result__metric--primary">
        <span className="emi-result__metric-label">Monthly EMI</span>
        <strong className="emi-result__metric-value">
          {formatEmiMonthly(monthlyEmi)}
        </strong>
      </div>

      <div className="emi-result__affordability">
        <span className="emi-result__metric-label">Affordability</span>
        <span
          className={[
            "emi-result__chip",
            `emi-result__chip--${affordability.tone}`,
          ].join(" ")}
        >
          {affordability.label}
        </span>
      </div>

      <div className="emi-result__grid">
        <div className="emi-result__line">
          <span className="emi-result__line-label">Loan amount</span>
          <strong className="emi-result__line-value">
            {formatEmiLakh(loanAmountInr)}
          </strong>
        </div>
        <div className="emi-result__line">
          <span className="emi-result__line-label">Total interest</span>
          <strong className="emi-result__line-value">
            {formatEmiLakh(totalInterestInr)}
          </strong>
        </div>
        <div className="emi-result__line">
          <span className="emi-result__line-label">Total outflow</span>
          <strong className="emi-result__line-value">
            {formatEmiLakh(totalOutflowInr)}
          </strong>
        </div>
      </div>
    </article>
  );
}
