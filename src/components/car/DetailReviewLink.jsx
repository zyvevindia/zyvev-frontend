import { Link } from "react-router-dom";

import {
  buildReviewSlug,
  isEditorialReviewAvailable,
  reviewPagePath,
} from "../../reviews/reviewRoutes.js";

import "./detail-review-link.css";

/**
 * @param {{ familySlug?: string, className?: string }} props
 */
export default function DetailReviewLink({ familySlug = "", className = "" }) {
  if (!isEditorialReviewAvailable(familySlug)) {
    return null;
  }

  return (
    <div
      className={["detail-review-link", className].filter(Boolean).join(" ")}
    >
      <Link
        to={reviewPagePath(buildReviewSlug(familySlug))}
        className="detail-review-link__cta"
      >
        Read full review →
      </Link>
    </div>
  );
}
