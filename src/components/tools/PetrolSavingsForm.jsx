import {
  COST_PER_KM_BOUNDS,
  COST_PER_KM_DEFAULTS,
} from "../../tools/costPerKmDefaults.js";
import {
  PETROL_SAVINGS_BOUNDS,
  PETROL_SAVINGS_DEFAULTS,
} from "../../tools/petrolSavingsDefaults.js";

/**
 * @param {object} props
 */
export default function PetrolSavingsForm({
  vehicleSlug = "",
  vehicles = [],
  evPriceInr,
  evPriceFromVehicle = false,
  annualKm,
  ownershipYears,
  homeTariffInr,
  homeChargingPct,
  publicChargingPct,
  efficiencyKmPerKwh,
  efficiencyFromVehicle = false,
  petrolPricePerLitre,
  petrolEfficiencyKmPerL,
  onVehicleChange,
  onEvPriceChange,
  onAnnualKmChange,
  onOwnershipYearsChange,
  onHomeTariffChange,
  onHomeChargingChange,
  onEfficiencyChange,
  onPetrolPriceChange,
  onPetrolEfficiencyChange,
}) {
  return (
    <form
      className="petrol-savings-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="petrol-savings-form__field">
        <label className="petrol-savings-form__label" htmlFor="savings-vehicle">
          EV (optional)
        </label>
        <select
          id="savings-vehicle"
          className="petrol-savings-form__select"
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

      <div className="petrol-savings-form__field">
        <label className="petrol-savings-form__label" htmlFor="savings-ev-price">
          EV price (ex-showroom)
        </label>
        <input
          id="savings-ev-price"
          className="petrol-savings-form__input"
          type="number"
          min={PETROL_SAVINGS_BOUNDS.vehiclePriceMin}
          max={PETROL_SAVINGS_BOUNDS.vehiclePriceMax}
          step="10000"
          value={evPriceInr}
          onChange={(event) => onEvPriceChange(Number(event.target.value))}
        />
        <p className="petrol-savings-form__hint">
          {evPriceFromVehicle
            ? "Prefilled from ex-showroom price. Petrol equivalent uses the same purchase price."
            : "Enter EV ex-showroom price or select a vehicle to prefill."}
        </p>
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-annual-km">
            Annual driving
          </label>
          <span className="petrol-savings-form__value">
            {annualKm.toLocaleString("en-IN")} km/year
          </span>
        </div>
        <input
          id="savings-annual-km"
          className="petrol-savings-form__range"
          type="range"
          min={PETROL_SAVINGS_BOUNDS.annualKmMin}
          max={PETROL_SAVINGS_BOUNDS.annualKmMax}
          step="1000"
          value={annualKm}
          onChange={(event) => onAnnualKmChange(Number(event.target.value))}
        />
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-years">
            Ownership years
          </label>
          <span className="petrol-savings-form__value">{ownershipYears} years</span>
        </div>
        <input
          id="savings-years"
          className="petrol-savings-form__range"
          type="range"
          min={PETROL_SAVINGS_BOUNDS.ownershipYearsMin}
          max={PETROL_SAVINGS_BOUNDS.ownershipYearsMax}
          step="1"
          value={ownershipYears}
          onChange={(event) => onOwnershipYearsChange(Number(event.target.value))}
        />
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-tariff">
            Electricity tariff (₹/kWh)
          </label>
          <span className="petrol-savings-form__value">₹{homeTariffInr}</span>
        </div>
        <input
          id="savings-tariff"
          className="petrol-savings-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeTariffMin}
          max={COST_PER_KM_BOUNDS.homeTariffMax}
          step="0.5"
          value={homeTariffInr}
          onChange={(event) => onHomeTariffChange(Number(event.target.value))}
        />
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-home-pct">
            Home charging
          </label>
          <span className="petrol-savings-form__value">{homeChargingPct}%</span>
        </div>
        <input
          id="savings-home-pct"
          className="petrol-savings-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.homeChargingPctMin}
          max={COST_PER_KM_BOUNDS.homeChargingPctMax}
          step="5"
          value={homeChargingPct}
          onChange={(event) => onHomeChargingChange(Number(event.target.value))}
        />
      </div>

      <div className="petrol-savings-form__field">
        <label className="petrol-savings-form__label" htmlFor="savings-public-pct">
          Public charging
        </label>
        <input
          id="savings-public-pct"
          className="petrol-savings-form__input petrol-savings-form__input--readonly"
          type="text"
          readOnly
          value={`${publicChargingPct}%`}
        />
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-efficiency">
            EV efficiency (km/kWh)
          </label>
          <span className="petrol-savings-form__value">{efficiencyKmPerKwh} km/kWh</span>
        </div>
        <input
          id="savings-efficiency"
          className="petrol-savings-form__range"
          type="range"
          min={COST_PER_KM_BOUNDS.efficiencyMin}
          max={COST_PER_KM_BOUNDS.efficiencyMax}
          step="0.1"
          value={efficiencyKmPerKwh}
          onChange={(event) => onEfficiencyChange(Number(event.target.value))}
        />
        <p className="petrol-savings-form__hint">
          {efficiencyFromVehicle
            ? "Prefilled from real-world or claimed efficiency."
            : `Default ${COST_PER_KM_DEFAULTS.efficiencyKmPerKwh} km/kWh when no vehicle is selected.`}
        </p>
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label className="petrol-savings-form__label" htmlFor="savings-petrol-price">
            Petrol price (₹/litre)
          </label>
          <span className="petrol-savings-form__value">₹{petrolPricePerLitre}</span>
        </div>
        <input
          id="savings-petrol-price"
          className="petrol-savings-form__range"
          type="range"
          min={PETROL_SAVINGS_BOUNDS.petrolPriceMin}
          max={PETROL_SAVINGS_BOUNDS.petrolPriceMax}
          step="1"
          value={petrolPricePerLitre}
          onChange={(event) => onPetrolPriceChange(Number(event.target.value))}
        />
      </div>

      <div className="petrol-savings-form__field">
        <div className="petrol-savings-form__label-row">
          <label
            className="petrol-savings-form__label"
            htmlFor="savings-petrol-efficiency"
          >
            Petrol efficiency (km/l)
          </label>
          <span className="petrol-savings-form__value">
            {petrolEfficiencyKmPerL} km/l
          </span>
        </div>
        <input
          id="savings-petrol-efficiency"
          className="petrol-savings-form__range"
          type="range"
          min={PETROL_SAVINGS_BOUNDS.petrolEfficiencyMin}
          max={PETROL_SAVINGS_BOUNDS.petrolEfficiencyMax}
          step="1"
          value={petrolEfficiencyKmPerL}
          onChange={(event) =>
            onPetrolEfficiencyChange(Number(event.target.value))
          }
        />
      </div>

      <p className="petrol-savings-form__note">
        Maintenance defaults: EV ₹{PETROL_SAVINGS_DEFAULTS.evMaintenancePerKm}/km,
        petrol ₹{PETROL_SAVINGS_DEFAULTS.petrolMaintenancePerKm}/km. Residual
        defaults: EV {PETROL_SAVINGS_DEFAULTS.evResidualPct}%, petrol{" "}
        {PETROL_SAVINGS_DEFAULTS.petrolResidualPct}%.
      </p>
    </form>
  );
}
