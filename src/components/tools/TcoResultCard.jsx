import {
  formatTcoInr,
  formatTcoLakh,
  formatTcoPerKm,
} from "../../tools/tcoCalculator.js";

/**
 * @param {{
 *   totalOwnershipCostInr: number,
 *   ownershipCostPerKm: number,
 *   depreciationInr: number,
 *   energyInr: number,
 *   maintenanceInr: number,
 *   insuranceInr: number,
 *   ownershipYears: number,
 * }} props
 */
export default function TcoResultCard({
  totalOwnershipCostInr,
  ownershipCostPerKm,
  depreciationInr,
  energyInr,
  maintenanceInr,
  insuranceInr,
  ownershipYears,
}) {
  return (
    <article className="tco-result">
      <p className="tco-result__eyebrow">{ownershipYears}-year ownership estimate</p>

      <div className="tco-result__metric tco-result__metric--primary">
        <span className="tco-result__metric-label">Ownership cost</span>
        <strong className="tco-result__metric-value">
          {formatTcoLakh(totalOwnershipCostInr)}
        </strong>
      </div>

      <div className="tco-result__metric tco-result__metric--secondary">
        <span className="tco-result__metric-label">Cost per km</span>
        <strong className="tco-result__metric-value tco-result__metric-value--compact">
          {formatTcoPerKm(ownershipCostPerKm)}
        </strong>
        <span className="tco-result__metric-note">
          Includes depreciation, energy, maintenance, and insurance
        </span>
      </div>

      <div className="tco-result__grid">
        <div className="tco-result__line">
          <span className="tco-result__line-label">Depreciation</span>
          <strong className="tco-result__line-value">
            {formatTcoLakh(depreciationInr)}
          </strong>
        </div>
        <div className="tco-result__line">
          <span className="tco-result__line-label">Energy cost</span>
          <strong className="tco-result__line-value">
            {formatTcoInr(energyInr)}
          </strong>
        </div>
        <div className="tco-result__line">
          <span className="tco-result__line-label">Maintenance</span>
          <strong className="tco-result__line-value">
            {formatTcoInr(maintenanceInr)}
          </strong>
        </div>
        <div className="tco-result__line">
          <span className="tco-result__line-label">Insurance</span>
          <strong className="tco-result__line-value">
            {formatTcoInr(insuranceInr)}
          </strong>
        </div>
      </div>
    </article>
  );
}
