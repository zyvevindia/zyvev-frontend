import {
  COST_PER_KM_BOUNDS,
  COST_PER_KM_DEFAULTS,
} from "../../tools/costPerKmDefaults.js";
import { TCO_BOUNDS, TCO_DEFAULTS } from "../../tools/tcoDefaults.js";

/**
 * @param {{
 *   vehicleSlug?: string,
 *   vehicles?: Array<{ slug: string, name: string }>,
 *   vehiclePriceInr: number,
 *   vehiclePriceFromVehicle?: boolean,
 *   annualKm: number,
 *   ownershipYears: number,
 *   homeTariffInr: number,
 *   homeChargingPct: number,
 *   publicChargingPct: number,
 *   efficiencyKmPerKwh: number,
 *   efficiencyFromVehicle?: boolean,
 *   insurancePerYear: number,
 *   maintenanceCostPerKm: number,
 *   residualValuePct: number,
 *   onVehicleChange: (slug: string) => void,
 *   onVehiclePriceChange: (value: number) => void,
 *   onAnnualKmChange: (value: number) => void,
 *   onOwnershipYearsChange: (value: number) => void,
 *   onHomeTariffChange: (value: number) => void,
 *   onHomeChargingChange: (value: number) => void,
 *   onEfficiencyChange: (value: number) => void,
 *   onInsuranceChange: (value: number) => void,
 *   onMaintenanceChange: (value: number) => void,
 *   onResidualChange: (value: number) => void,
 * }} props
 */
export default function TcoForm({
  vehicleSlug = "",
  vehicles = [],
  vehiclePriceInr,
  vehiclePriceFromVehicle = false,
  annualKm,
  ownershipYears,
  homeTariffInr,
  homeChargingPct,
  publicChargingPct,
  efficiencyKmPerKwh,
  efficiencyFromVehicle = false,
  insurancePerYear,
  maintenanceCostPerKm,
  residualValuePct,
  onVehicleChange,
  onVehiclePriceChange,
  onAnnualKmChange,
  onOwnershipYearsChange,
  onHomeTariffChange,
  onHomeChargingChange,
  onEfficiencyChange,
  onInsuranceChange,
  onMaintenanceChange,
  onResidualChange,
}) {
  return (
    <form className="tco-form" onSubmit={(event) => event.preventDefault()}>
      <div className="tco-form__field">
        <label className="tco-form__label" htmlFor="tco-vehicle">
          Vehicle (optional)
        </label>
        <select
          id="tco-vehicle"
          className="tco-form__select"
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

      <div className="tco-form__field">
        <label className="tco-form__label" htmlFor="tco-price">
          Vehicle price (ex-showroom)
        </label>
        <input
          id="tco-price"
          className="tco-form__input"
          type="number"
          min={TCO_BOUNDS.vehiclePriceMin}
          max={TCO_BOUNDS.vehiclePriceMax}
          step="10000"
          value={vehiclePriceInr}
          onChange={(event) => onVehiclePriceChange(Number(event.target.value))}
        />
        <p className="tco-form__hint">
          {vehiclePriceFromVehicle
            ? "Prefilled from ex-showroom price. Edit if your on-road quote differs."
            : "Enter ex-showroom price or select a vehicle to prefill."}
        </p>
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-annual-km">
            Annual running
          </label>
          <span className="tco-form__value">
            {annualKm.toLocaleString("en-IN")} km/year
          </span>
        </div>
        <input
          id="tco-annual-km"
          className="tco-form__range"
          type="range"
          min={TCO_BOUNDS.annualKmMin}
          max={TCO_BOUNDS.annualKmMax}
          step="1000"
          value={annualKm}
          onChange={(event) => onAnnualKmChange(Number(event.target.value))}
        />
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-years">
            Ownership period
          </label>
          <span className="tco-form__value">{ownershipYears} years</span>
        </div>
        <input
          id="tco-years"
          className="tco-form__range"
          type="range"
          min={TCO_BOUNDS.ownershipYearsMin}
          max={TCO_BOUNDS.ownershipYearsMax}
          step="1"
          value={ownershipYears}
          onChange={(event) => onOwnershipYearsChange(Number(event.target.value))}
        />
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-tariff">
            Electricity tariff (₹/kWh)
          </label>
          <span className="tco-form__value">₹{homeTariffInr}</span>
        </div>
        <input
          id="tco-tariff"
          className="tco-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeTariffMin}
          max={COST_PER_KM_BOUNDS.homeTariffMax}
          step="0.5"
          value={homeTariffInr}
          onChange={(event) => onHomeTariffChange(Number(event.target.value))}
        />
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-home-pct">
            Home charging
          </label>
          <span className="tco-form__value">{homeChargingPct}%</span>
        </div>
        <input
          id="tco-home-pct"
          className="tco-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeChargingPctMin}
          max={COST_PER_KM_BOUNDS.homeChargingPctMax}
          step="5"
          value={homeChargingPct}
          onChange={(event) => onHomeChargingChange(Number(event.target.value))}
        />
      </div>

      <div className="tco-form__field">
        <label className="tco-form__label" htmlFor="tco-public-pct">
          Public charging
        </label>
        <input
          id="tco-public-pct"
          className="tco-form__input tco-form__input--readonly"
          type="text"
          readOnly
          value={`${publicChargingPct}%`}
        />
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-efficiency">
            Vehicle efficiency (km/kWh)
          </label>
          <span className="tco-form__value">{efficiencyKmPerKwh} km/kWh</span>
        </div>
        <input
          id="tco-efficiency"
          className="tco-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.efficiencyMin}
          max={COST_PER_KM_BOUNDS.efficiencyMax}
          step="0.1"
          value={efficiencyKmPerKwh}
          onChange={(event) => onEfficiencyChange(Number(event.target.value))}
        />
        <p className="tco-form__hint">
          {efficiencyFromVehicle
            ? "Prefilled from real-world or claimed efficiency."
            : `Default ${COST_PER_KM_DEFAULTS.efficiencyKmPerKwh} km/kWh when no vehicle is selected.`}
        </p>
      </div>

      <div className="tco-form__field">
        <label className="tco-form__label" htmlFor="tco-insurance">
          Insurance (per year)
        </label>
        <input
          id="tco-insurance"
          className="tco-form__input"
          type="number"
          min={TCO_BOUNDS.insurancePerYearMin}
          max={TCO_BOUNDS.insurancePerYearMax}
          step="1000"
          value={Math.round(insurancePerYear)}
          onChange={(event) => onInsuranceChange(Number(event.target.value))}
        />
        <p className="tco-form__hint">
          Default is {TCO_DEFAULTS.insuranceRatePerYear * 100}% of vehicle price
          per year.
        </p>
      </div>

      <div className="tco-form__field">
        <label className="tco-form__label" htmlFor="tco-maintenance">
          Maintenance (₹/km)
        </label>
        <input
          id="tco-maintenance"
          className="tco-form__input"
          type="number"
          min={TCO_BOUNDS.maintenanceCostPerKmMin}
          max={TCO_BOUNDS.maintenanceCostPerKmMax}
          step="0.05"
          value={maintenanceCostPerKm}
          onChange={(event) => onMaintenanceChange(Number(event.target.value))}
        />
      </div>

      <div className="tco-form__field">
        <div className="tco-form__label-row">
          <label className="tco-form__label" htmlFor="tco-residual">
            Residual value
          </label>
          <span className="tco-form__value">{residualValuePct}% retained</span>
        </div>
        <input
          id="tco-residual"
          className="tco-form__range"
          type="range"
          min={TCO_BOUNDS.residualValuePctMin}
          max={TCO_BOUNDS.residualValuePctMax}
          step="5"
          value={residualValuePct}
          onChange={(event) => onResidualChange(Number(event.target.value))}
        />
        <p className="tco-form__hint">
          Estimated resale value as a percentage of purchase price after{" "}
          {ownershipYears} years.
        </p>
      </div>
    </form>
  );
}
