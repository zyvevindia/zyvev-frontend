import {
  COST_PER_KM_BOUNDS,
  COST_PER_KM_DEFAULTS,
} from "../../tools/costPerKmDefaults.js";
import {
  formatEfficiency,
  formatElectricityTariff,
  formatPercentage,
} from "../../utils/numberFormatters.js";

/**
 * @param {{
 *   homeTariffInr: number,
 *   homeChargingPct: number,
 *   efficiencyKmPerKwh: number,
 *   publicChargingPct: number,
 *   vehicleSlug?: string,
 *   vehicles?: Array<{ slug: string, name: string }>,
 *   efficiencyFromVehicle?: boolean,
 *   onHomeTariffChange: (value: number) => void,
 *   onHomeChargingChange: (value: number) => void,
 *   onEfficiencyChange: (value: number) => void,
 *   onVehicleChange: (slug: string) => void,
 * }} props
 */
export default function CostPerKmForm({
  homeTariffInr,
  homeChargingPct,
  efficiencyKmPerKwh,
  publicChargingPct,
  vehicleSlug = "",
  vehicles = [],
  efficiencyFromVehicle = false,
  onHomeTariffChange,
  onHomeChargingChange,
  onEfficiencyChange,
  onVehicleChange,
}) {
  return (
    <form
      className="cost-per-km-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="cost-per-km-form__field">
        <label className="cost-per-km-form__label" htmlFor="cost-per-km-vehicle">
          Vehicle (optional)
        </label>
        <select
          id="cost-per-km-vehicle"
          className="cost-per-km-form__select"
          value={vehicleSlug}
          onChange={(event) => onVehicleChange(event.target.value)}
        >
          <option value="">Select a tier-1 EV</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.slug} value={vehicle.slug}>
              {vehicle.name}
            </option>
          ))}
        </select>
      </div>

      <div className="cost-per-km-form__field">
        <div className="cost-per-km-form__label-row">
          <label className="cost-per-km-form__label" htmlFor="cost-per-km-tariff">
            Electricity tariff (₹/kWh)
          </label>
          <span className="cost-per-km-form__value">{formatElectricityTariff(homeTariffInr)}</span>
        </div>
        <input
          id="cost-per-km-tariff"
          className="cost-per-km-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeTariffMin}
          max={COST_PER_KM_BOUNDS.homeTariffMax}
          step="0.5"
          value={homeTariffInr}
          onChange={(event) => onHomeTariffChange(Number(event.target.value))}
        />
      </div>

      <div className="cost-per-km-form__field">
        <div className="cost-per-km-form__label-row">
          <label className="cost-per-km-form__label" htmlFor="cost-per-km-home-pct">
            Home charging
          </label>
          <span className="cost-per-km-form__value">{formatPercentage(homeChargingPct)}</span>
        </div>
        <input
          id="cost-per-km-home-pct"
          className="cost-per-km-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeChargingPctMin}
          max={COST_PER_KM_BOUNDS.homeChargingPctMax}
          step="5"
          value={homeChargingPct}
          onChange={(event) => onHomeChargingChange(Number(event.target.value))}
        />
      </div>

      <div className="cost-per-km-form__field">
        <label className="cost-per-km-form__label" htmlFor="cost-per-km-public-pct">
          Public charging
        </label>
        <input
          id="cost-per-km-public-pct"
          className="cost-per-km-form__input cost-per-km-form__input--readonly"
          type="text"
          readOnly
          value={formatPercentage(publicChargingPct)}
          aria-live="polite"
        />
        <p className="cost-per-km-form__hint">
          Public charging is priced at 2× your home tariff.
        </p>
      </div>

      <div className="cost-per-km-form__field">
        <div className="cost-per-km-form__label-row">
          <label className="cost-per-km-form__label" htmlFor="cost-per-km-efficiency">
            Vehicle efficiency (km/kWh)
          </label>
          <span className="cost-per-km-form__value">{formatEfficiency(efficiencyKmPerKwh)}</span>
        </div>
        <input
          id="cost-per-km-efficiency"
          className="cost-per-km-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.efficiencyMin}
          max={COST_PER_KM_BOUNDS.efficiencyMax}
          step="0.1"
          value={efficiencyKmPerKwh}
          onChange={(event) => onEfficiencyChange(Number(event.target.value))}
        />
        <p className="cost-per-km-form__hint">
          {efficiencyFromVehicle
            ? "Prefilled from this vehicle's real-world efficiency. Adjust if needed."
            : `Default is ${formatEfficiency(COST_PER_KM_DEFAULTS.efficiencyKmPerKwh)} when no vehicle is selected.`}
        </p>
      </div>
    </form>
  );
}
