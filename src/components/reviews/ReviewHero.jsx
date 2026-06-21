import { Link } from "react-router-dom";

import VehicleImage from "../media/VehicleImage.jsx";
import { buildHeroSummary } from "../../intelligence/buildHeroSummary.js";
import { vehicleFamilyPath } from "../../utils/vehicleRoutes.js";
import { getHeroImage } from "../../utils/vehicleMedia.js";

const CONFIDENCE_LABELS = {
  verified: "Verified editorial",
  editorial: "Editorial analysis",
  estimated: "Estimated editorial",
};

/**
 * @param {{
 *   review: import("../../reviews/types.js").VehicleReview,
 *   vehicle?: object|null,
 *   intelligenceVehicle?: object|null,
 *   variants?: object[],
 * }} props
 */
export default function ReviewHero({
  review,
  vehicle = null,
  intelligenceVehicle = null,
  variants = [],
}) {
  const vehicleSlug = review?.vehicleSlug;
  const confidenceLabel =
    CONFIDENCE_LABELS[review?.confidence] || CONFIDENCE_LABELS.editorial;

  const heroVehicle = intelligenceVehicle || vehicle;
  const heroSummary = buildHeroSummary({
    ...heroVehicle,
    variants: variants.length ? variants : heroVehicle?.variants,
  });

  const imageSrc = getHeroImage(vehicle || heroVehicle);
  const brand =
    vehicle?.brand ||
    vehicle?.catalogMeta?.brand ||
    vehicle?.manufacturer ||
    "";

  const metrics = [
    { label: "Price range", value: heroSummary?.priceRange },
    { label: "Real-world range", value: heroSummary?.realWorldRange },
    { label: "Battery capacity", value: heroSummary?.batteryRange },
    {
      label: "Variants",
      value:
        heroSummary?.variantCount > 0
          ? `${heroSummary.variantCount} available`
          : null,
    },
  ].filter((row) => row.value);

  return (
    <header className="review-page__hero review-page__hero--premium">
      <div className="review-page__hero-grid">
        <div className="review-page__hero-media">
          <VehicleImage
            src={imageSrc}
            alt={review?.familyName || review?.title}
            className="review-page__hero-image"
          />
        </div>

        <div className="review-page__hero-copy">
          {brand ? (
            <p className="review-page__eyebrow">{brand} electric vehicle</p>
          ) : (
            <p className="review-page__eyebrow">EVSavari editorial review</p>
          )}

          <h1 className="review-page__title">{review?.title}</h1>

          <div className="review-page__hero-meta">
            <span className="review-page__confidence">{confidenceLabel}</span>
          </div>

          <p className="review-page__intro review-page__intro--overview">
            {review?.overview?.body}
          </p>

          <div className="review-page__hero-actions">
            {vehicleSlug ? (
              <Link
                to={vehicleFamilyPath(vehicleSlug)}
                className="review-page__btn review-page__btn--primary"
              >
                View specs and variants
              </Link>
            ) : null}
            {vehicleSlug ? (
              <Link
                to={vehicleFamilyPath(vehicleSlug)}
                className="review-page__btn review-page__btn--secondary"
              >
                Back to vehicle page
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {metrics.length ? (
        <dl className="review-page__hero-metrics">
          {metrics.map((row) => (
            <div key={row.label} className="review-page__hero-metrics-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
