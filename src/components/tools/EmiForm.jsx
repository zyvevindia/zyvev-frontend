import { EMI_BOUNDS, EMI_DEFAULTS } from "../../tools/emiDefaults.js";

/**
 * @param {object} props
 */
export default function EmiForm({
  vehicleSlug = "",
  vehicles = [],
  vehiclePriceInr,
  vehiclePriceFromVehicle = false,
  downPaymentPct,
  loanTenureYears,
  interestRatePct,
  processingFeePct,
  balloonPaymentInr,
  downPaymentInr,
  onVehicleChange,
  onVehiclePriceChange,
  onDownPaymentPctChange,
  onLoanTenureChange,
  onInterestRateChange,
  onProcessingFeeChange,
  onBalloonPaymentChange,
}) {
  return (
    <form className="emi-form" onSubmit={(event) => event.preventDefault()}>
      <div className="emi-form__field">
        <label className="emi-form__label" htmlFor="emi-vehicle">
          Vehicle (optional)
        </label>
        <select
          id="emi-vehicle"
          className="emi-form__select"
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

      <div className="emi-form__field">
        <label className="emi-form__label" htmlFor="emi-price">
          Vehicle price (ex-showroom)
        </label>
        <input
          id="emi-price"
          className="emi-form__input"
          type="number"
          min={EMI_BOUNDS.vehiclePriceMin}
          max={EMI_BOUNDS.vehiclePriceMax}
          step="10000"
          value={vehiclePriceInr}
          onChange={(event) => onVehiclePriceChange(Number(event.target.value))}
        />
        <p className="emi-form__hint">
          {vehiclePriceFromVehicle
            ? "Prefilled from ex-showroom price. Edit if your on-road quote differs."
            : "Enter vehicle price or select an EV to prefill."}
        </p>
      </div>

      <div className="emi-form__field">
        <div className="emi-form__label-row">
          <label className="emi-form__label" htmlFor="emi-down-pct">
            Down payment
          </label>
          <span className="emi-form__value">
            {downPaymentPct}% (₹{Math.round(downPaymentInr).toLocaleString("en-IN")})
          </span>
        </div>
        <input
          id="emi-down-pct"
          className="emi-form__range"
          type="range"
          min={EMI_BOUNDS.downPaymentPctMin}
          max={EMI_BOUNDS.downPaymentPctMax}
          step="5"
          value={downPaymentPct}
          onChange={(event) => onDownPaymentPctChange(Number(event.target.value))}
        />
      </div>

      <div className="emi-form__field">
        <div className="emi-form__label-row">
          <label className="emi-form__label" htmlFor="emi-tenure">
            Loan tenure
          </label>
          <span className="emi-form__value">{loanTenureYears} years</span>
        </div>
        <input
          id="emi-tenure"
          className="emi-form__range"
          type="range"
          min={EMI_BOUNDS.loanTenureYearsMin}
          max={EMI_BOUNDS.loanTenureYearsMax}
          step="1"
          value={loanTenureYears}
          onChange={(event) => onLoanTenureChange(Number(event.target.value))}
        />
      </div>

      <div className="emi-form__field">
        <div className="emi-form__label-row">
          <label className="emi-form__label" htmlFor="emi-rate">
            Interest rate
          </label>
          <span className="emi-form__value">{interestRatePct}% p.a.</span>
        </div>
        <input
          id="emi-rate"
          className="emi-form__range"
          type="range"
          min={EMI_BOUNDS.interestRatePctMin}
          max={EMI_BOUNDS.interestRatePctMax}
          step="0.25"
          value={interestRatePct}
          onChange={(event) => onInterestRateChange(Number(event.target.value))}
        />
      </div>

      <div className="emi-form__field">
        <label className="emi-form__label" htmlFor="emi-processing">
          Processing fee (% of loan)
        </label>
        <input
          id="emi-processing"
          className="emi-form__input"
          type="number"
          min={EMI_BOUNDS.processingFeePctMin}
          max={EMI_BOUNDS.processingFeePctMax}
          step="0.1"
          value={processingFeePct}
          onChange={(event) => onProcessingFeeChange(Number(event.target.value))}
        />
        <p className="emi-form__hint">
          Default is {EMI_DEFAULTS.processingFeePct}% of the loan amount.
        </p>
      </div>

      <div className="emi-form__field">
        <label className="emi-form__label" htmlFor="emi-balloon">
          Balloon payment (optional)
        </label>
        <input
          id="emi-balloon"
          className="emi-form__input"
          type="number"
          min={EMI_BOUNDS.balloonPaymentMin}
          max={EMI_BOUNDS.balloonPaymentMax}
          step="10000"
          value={balloonPaymentInr}
          onChange={(event) => onBalloonPaymentChange(Number(event.target.value))}
        />
      </div>
    </form>
  );
}
