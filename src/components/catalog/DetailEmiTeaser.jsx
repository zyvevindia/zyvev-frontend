import { useMemo } from "react";
import { Link } from "react-router-dom";

import { buildOwnershipToolHref } from "../../tools/ownershipToolLinks.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

function estimateMonthlyEmi(
  price,
  downPayment,
  interestRate = 9,
  tenureYears = 5
) {
  const principal =
    Math.max(0, Number(price) - Number(downPayment || 0));

  if (principal <= 0) return 0;

  const monthlyRate = interestRate / 12 / 100;
  const months = tenureYears * 12;

  if (monthlyRate === 0) {
    return Math.round(principal / months);
  }

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(emi);
}

export default function DetailEmiTeaser({
  price,
  onOpenCalculator,
  variant = "default",
  familySlug = "",
}) {
  const slug = normalizeVehicleSlug(familySlug);
  const emiToolHref = slug ? buildOwnershipToolHref("emi", slug) : null;

  const emi = useMemo(() => {
    const down = Math.round(Number(price) * 0.2);
    return estimateMonthlyEmi(price, down);
  }, [price]);

  if (!price || price <= 0) return null;

  if (variant === "card") {
    return (
      <div className="cd-teaser-card">
        <span className="cd-teaser-card__label">Est. EMI</span>
        <strong className="cd-teaser-card__value">
          ₹{emi.toLocaleString("en-IN")}/mo
        </strong>
        <span className="cd-teaser-card__hint">
          20% down · 9% · 5 years
        </span>
        {emiToolHref ? (
          <Link to={emiToolHref} className="cd-teaser-card__link">
            Calculate EMI →
          </Link>
        ) : (
          <button
            type="button"
            className="cd-teaser-card__link"
            onClick={onOpenCalculator}
          >
            Calculate EMI →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="detail-emi-teaser">
      <div className="detail-emi-teaser__copy">
        <span className="detail-emi-teaser__label">
          Estimated EMI
        </span>
        <strong className="detail-emi-teaser__value">
          from ₹{emi.toLocaleString("en-IN")}/mo
        </strong>
        <span className="detail-emi-teaser__hint">
          20% down · 9% · 5 years
        </span>
      </div>
      <button
        type="button"
        className="detail-emi-teaser__btn"
        onClick={onOpenCalculator}
      >
        Calculate EMI
      </button>
    </div>
  );
}
