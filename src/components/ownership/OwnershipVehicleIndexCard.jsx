import { Link } from "react-router-dom";

import VehicleImage from "../../components/media/VehicleImage.jsx";
import { formatIndianPrice } from "../../utils/formatIndianPrice.js";
import { vehicleFamilyPath } from "../../utils/vehicleRoutes.js";
import {
  OWNERSHIP_PAGE_TYPES,
  ownershipPagePath,
} from "../../pages/ownership/ownershipRoutes.js";

/** @type {Array<{ type: import("./ownershipRoutes.js").OwnershipPageType, label: string }>} */
const OWNERSHIP_INDEX_ACTIONS = [
  { type: OWNERSHIP_PAGE_TYPES.RUNNING_COST, label: "Running Cost →" },
  { type: OWNERSHIP_PAGE_TYPES.TCO, label: "Ownership Cost →" },
  { type: OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS, label: "Petrol Savings →" },
  { type: OWNERSHIP_PAGE_TYPES.EMI, label: "EMI →" },
];

/**
 * @param {{
 *   familySlug: string,
 *   familyName: string,
 *   startingPrice?: number,
 *   vehicle?: object|null,
 *   image?: string,
 * }} props
 */
export default function OwnershipVehicleIndexCard({
  familySlug,
  familyName,
  startingPrice = 0,
  vehicle = null,
  image = "",
}) {
  const priceLabel = formatIndianPrice(startingPrice, { prefix: "From " });

  return (
    <article className="ownership-index-card">
      <Link
        to={vehicleFamilyPath(familySlug)}
        className="ownership-index-card__media-link"
      >
        <div className="ownership-index-card__media">
          <VehicleImage
            car={vehicle}
            src={image}
            role="card"
            alt={familyName}
            className="ownership-index-card__image"
          />
        </div>
      </Link>

      <div className="ownership-index-card__body">
        <h2 className="ownership-index-card__title">
          <Link to={vehicleFamilyPath(familySlug)}>{familyName}</Link>
        </h2>
        <p className="ownership-index-card__price">{priceLabel}</p>

        <div className="ownership-index-card__actions">
          {OWNERSHIP_INDEX_ACTIONS.map((action) => (
            <Link
              key={action.type}
              to={ownershipPagePath(familySlug, action.type)}
              className="ownership-index-card__action"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
