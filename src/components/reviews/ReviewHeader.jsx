import { Link } from "react-router-dom";

import { vehicleFamilyPath } from "../../utils/vehicleRoutes.js";

const CONFIDENCE_LABELS = {
  verified: "Verified editorial",
  editorial: "Editorial analysis",
  estimated: "Estimated editorial",
};

/**
 * @param {{ review: import("../../reviews/types.js").VehicleReview, vehicle?: object|null }} props
 */
export default function ReviewHeader({ review, vehicle = null }) {
  const vehicleSlug = review?.vehicleSlug;
  const confidenceKey = review?.confidence;
  const confidenceLabel =
    CONFIDENCE_LABELS[confidenceKey] || CONFIDENCE_LABELS.editorial;

  const brand =
    vehicle?.brand ||
    vehicle?.catalogMeta?.brand ||
    vehicle?.manufacturer ||
    "";

  return (
    <header className="review-page__hero">
      <div className="review-page__hero-copy">
        {brand ? (
          <p className="review-page__eyebrow">{brand} electric vehicle</p>
        ) : (
          <p className="review-page__eyebrow">EVSavari editorial review</p>
        )}
        <h1 className="review-page__title">{review?.title}</h1>
        <p className="review-page__intro">
          Ownership intelligence built from EVSavari scoring, charging data and
          real-world suitability signals — plain English, no sponsored claims.
        </p>
        <div className="review-page__hero-meta">
          <span className="review-page__confidence">{confidenceLabel}</span>
          {vehicleSlug ? (
            <Link
              to={vehicleFamilyPath(vehicleSlug)}
              className="review-page__vehicle-link"
            >
              View specs and variants
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
