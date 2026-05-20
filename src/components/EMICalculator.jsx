import { useCallback, useEffect, useRef, useState } from "react";

import { trackLaunchEmiInteraction } from "../launch/launchTelemetry";
import "../styles/emi-calculator.css";

function formatInr(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function downPaymentPercent(price, downPayment) {
  if (!price || price <= 0) return 0;
  return Math.round((Number(downPayment) / price) * 100);
}

export default function EMICalculator({
  price,
  className = "",
  onGetFinanceHelp,
}) {
  const [downPayment, setDownPayment] = useState(
    Math.round(price * 0.2)
  );
  const [interestRate, setInterestRate] = useState(9);
  const [tenure, setTenure] = useState(5);
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    setDownPayment(Math.round(price * 0.2));
  }, [price]);

  useEffect(() => {
    const principal = price - Number(downPayment || 0);
    const monthlyRate = interestRate / 12 / 100;
    const months = tenure * 12;

    if (principal <= 0 || months <= 0) {
      setEmi(0);
      setTotalAmount(0);
      setTotalInterest(0);
      return;
    }

    if (monthlyRate === 0) {
      const emiValue = principal / months;
      setEmi(Math.round(emiValue));
      setTotalAmount(Math.round(principal));
      setTotalInterest(0);
      return;
    }

    const emiValue =
      (principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayable = emiValue * months;
    const totalInterestPayable = totalPayable - principal;

    setEmi(Math.round(emiValue));
    setTotalAmount(Math.round(totalPayable));
    setTotalInterest(Math.round(totalInterestPayable));
  }, [downPayment, interestRate, tenure, price]);

  const loanAmount = Math.max(0, price - downPayment);
  const downPct = downPaymentPercent(price, downPayment);

  const summaryLine = `${downPct}% down • ${interestRate}% interest • ${tenure} ${
    tenure === 1 ? "year" : "years"
  }`;

  const emiTelemetryTimer = useRef(null);

  const notifyEmiSliderChange = useCallback((field) => {
    if (emiTelemetryTimer.current) {
      clearTimeout(emiTelemetryTimer.current);
    }
    emiTelemetryTimer.current = setTimeout(() => {
      trackLaunchEmiInteraction({
        sourcePage: "car_details",
        action: "emi_slider",
        field,
      });
    }, 800);
  }, []);

  useEffect(
    () => () => {
      if (emiTelemetryTimer.current) {
        clearTimeout(emiTelemetryTimer.current);
      }
    },
    []
  );

  const handleFinanceHelp = useCallback(() => {
    onGetFinanceHelp?.();
  }, [onGetFinanceHelp]);

  const rootClass = ["emi-widget", className].filter(Boolean).join(" ");

  return (
    <article className={rootClass} aria-labelledby="emi-widget-title">
      <h2 id="emi-widget-title" className="emi-widget__sr-only">
        EMI calculator
      </h2>

      <header className="emi-widget__summary">
        <div className="emi-widget__summary-main">
          <span className="emi-widget__eyebrow">Estimated EMI</span>
          <p className="emi-widget__amount" aria-live="polite">
            {formatInr(emi)}
            <span className="emi-widget__amount-suffix">/mo</span>
          </p>
          <p className="emi-widget__meta">{summaryLine}</p>
        </div>

        <button
          type="button"
          className="emi-widget__btn emi-widget__btn--primary"
          onClick={handleFinanceHelp}
        >
          Get Finance Help
        </button>
      </header>

      <section
        className="emi-widget__section emi-widget__section--controls"
        aria-labelledby="emi-controls-heading"
      >
        <h3 id="emi-controls-heading" className="emi-widget__sr-only">
          Finance controls
        </h3>

        <div className="emi-widget__controls">
          <div className="emi-widget__control">
            <div className="emi-widget__control-head">
              <label className="emi-widget__label" htmlFor="emi-down">
                Down Payment
              </label>
              <span className="emi-widget__badge">
                {formatInr(downPayment)}
              </span>
            </div>
            <input
              id="emi-down"
              type="range"
              className="emi-widget__slider"
              min={0}
              max={price || 0}
              step={price > 500000 ? 50000 : 10000}
              value={downPayment}
              onChange={(e) => {
                setDownPayment(Number(e.target.value));
                notifyEmiSliderChange("down_payment");
              }}
              aria-valuetext={formatInr(downPayment)}
            />
          </div>

          <div className="emi-widget__control">
            <div className="emi-widget__control-head">
              <label className="emi-widget__label" htmlFor="emi-rate">
                Interest Rate
              </label>
              <span className="emi-widget__badge">{interestRate}%</span>
            </div>
            <input
              id="emi-rate"
              type="range"
              className="emi-widget__slider"
              min={1}
              max={20}
              step={0.1}
              value={interestRate}
              onChange={(e) => {
                setInterestRate(Number(e.target.value));
                notifyEmiSliderChange("interest_rate");
              }}
              aria-valuetext={`${interestRate} percent`}
            />
          </div>

          <div className="emi-widget__control">
            <div className="emi-widget__control-head">
              <label className="emi-widget__label" htmlFor="emi-tenure">
                Loan Tenure
              </label>
              <span className="emi-widget__badge">
                {tenure} yr{tenure !== 1 ? "s" : ""}
              </span>
            </div>
            <input
              id="emi-tenure"
              type="range"
              className="emi-widget__slider"
              min={1}
              max={10}
              step={1}
              value={tenure}
              onChange={(e) => {
                setTenure(Number(e.target.value));
                notifyEmiSliderChange("tenure");
              }}
              aria-valuetext={`${tenure} years`}
            />
          </div>
        </div>
      </section>

      <section
        className="emi-widget__section emi-widget__section--metrics"
        aria-labelledby="emi-metrics-heading"
      >
        <h3 id="emi-metrics-heading" className="emi-widget__sr-only">
          Finance summary
        </h3>

        <div className="emi-widget__metrics" role="list">
          <div className="emi-widget__metric" role="listitem">
            <span className="emi-widget__metric-label">Loan Amount</span>
            <span className="emi-widget__metric-value">
              {formatInr(loanAmount)}
            </span>
          </div>
          <div className="emi-widget__metric" role="listitem">
            <span className="emi-widget__metric-label">Total Interest</span>
            <span className="emi-widget__metric-value">
              {formatInr(totalInterest)}
            </span>
          </div>
          <div className="emi-widget__metric" role="listitem">
            <span className="emi-widget__metric-label">Total Payable</span>
            <span className="emi-widget__metric-value">
              {formatInr(totalAmount)}
            </span>
          </div>
        </div>
      </section>

      <p className="emi-widget__disclaimer">
        Indicative estimate only. Actual EMI depends on lender, credit profile,
        and on-road price.
      </p>
    </article>
  );
}
