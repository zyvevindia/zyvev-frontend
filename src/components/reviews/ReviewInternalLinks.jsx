import { Link } from "react-router-dom";

import { vehicleFamilyPath } from "../../utils/vehicleRoutes.js";

/**
 * @param {{ vehicleSlug?: string, familyName?: string }} props
 */
export default function ReviewInternalLinks({
  vehicleSlug = "",
  familyName = "",
}) {
  if (!vehicleSlug) {
    return null;
  }

  const vehiclePath = vehicleFamilyPath(vehicleSlug);
  const vehicleLabel = familyName || "this EV";

  return (
    <nav className="review-page__internal-links" aria-label="Review navigation">
      <Link to={vehiclePath} className="review-page__internal-link">
        View specifications and variants →
      </Link>
      <Link
        to={vehiclePath}
        className="review-page__internal-link review-page__internal-link--secondary"
      >
        Return to {vehicleLabel} page →
      </Link>
    </nav>
  );
}
