import { Link } from "react-router-dom";

import VehicleImage from "../../components/media/VehicleImage.jsx";
import SEO from "../../components/SEO/SEO.jsx";
import JsonLd from "../../components/SEO/JsonLd.jsx";
import { buildReviewSlug, isEditorialReviewAvailable, reviewPagePath } from "../../reviews/reviewRoutes.js";
import { buildOwnershipPageMeta } from "../../seo/ownershipPageMetadata.js";
import { buildOwnershipPageSchemas, canonicalOwnershipUrl } from "../../seo/ownershipSchema.js";
import { getHeroImage, getOgImage } from "../../utils/vehicleMedia.js";
import { vehicleFamilyPath } from "../../utils/vehicleRoutes.js";

import {
  OWNERSHIP_PAGE_CONFIG,
  buildOwnershipPageNavLinks,
} from "./ownershipRoutes.js";

import "../../components/reviews/review-page.css";
import "./ownership-page.css";

/**
 * @param {{
 *   pageType: import("./ownershipRoutes.js").OwnershipPageType,
 *   vehicleSlug: string,
 *   familyName: string,
 *   vehicle?: object|null,
 *   summaryText?: string,
 *   loading?: boolean,
 *   error?: "not_found"|"load_failed"|null,
 *   children?: import("react").ReactNode,
 * }} props
 */
export default function OwnershipPageLayout({
  pageType,
  vehicleSlug,
  familyName,
  vehicle = null,
  summaryText = "",
  loading = false,
  error = null,
  children,
}) {
  const config = OWNERSHIP_PAGE_CONFIG[pageType];
  const title = `${familyName} ${config.titleSuffix}`;
  const imageSrc = getHeroImage(vehicle) || getOgImage(vehicle);
  const meta = buildOwnershipPageMeta({
    vehicleName: familyName,
    vehicleSlug,
    pageType,
    image: imageSrc,
  });
  const canonical = canonicalOwnershipUrl(vehicleSlug, pageType);
  const schemas = buildOwnershipPageSchemas({
    pageType,
    vehicleSlug,
    vehicleName: familyName,
    vehicle,
    canonicalUrl: canonical,
    image: imageSrc,
    summaryText,
  });
  const ownershipLinks = buildOwnershipPageNavLinks(vehicleSlug, pageType);
  const showReviewLink = isEditorialReviewAvailable(vehicleSlug);

  if (error === "not_found") {
    return (
      <div className="ownership-page">
        <div className="ownership-page__inner">
          <div className="ownership-page__state">
            <h1>Ownership page not found</h1>
            <p>
              This ownership estimate is unavailable.{" "}
              <Link to="/cars">Browse all EVs</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error === "load_failed") {
    return (
      <div className="ownership-page">
        <div className="ownership-page__inner">
          <div className="ownership-page__state">
            <h1>Could not load this ownership page</h1>
            <p>
              Please check your connection and try again.{" "}
              <Link to="/cars">Browse all EVs</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ownership-page">
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        keywords={meta.keywords}
        image={meta.image}
        type={meta.ogType}
        robots={meta.robots}
      />

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <div className="ownership-page__inner">
        <nav className="ownership-page__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/tools">Ownership</Link>
          <span aria-hidden="true"> / </span>
          <Link to={vehicleFamilyPath(vehicleSlug)}>{familyName}</Link>
          <span aria-hidden="true"> / </span>
          <span>{config.breadcrumbLabel}</span>
        </nav>

        <header className="ownership-page__hero review-page__hero review-page__hero--premium">
          <div className="ownership-page__hero-grid review-page__hero-grid">
            <div className="review-page__hero-media">
              <VehicleImage
                car={vehicle}
                src={imageSrc}
                role="hero"
                alt={familyName}
                className="review-page__hero-image"
              />
            </div>

            <div className="ownership-page__hero-copy">
              {vehicle?.brand ? (
                <p className="review-page__eyebrow">
                  {vehicle.brand} electric vehicle
                </p>
              ) : null}
              <h1 className="review-page__title">{title}</h1>
              <p className="ownership-page__subtitle">{config.subtitle}</p>

              <div className="ownership-page__hero-links">
                <Link
                  to={vehicleFamilyPath(vehicleSlug)}
                  className="ownership-page__hero-link"
                >
                  Vehicle page →
                </Link>
                {showReviewLink ? (
                  <Link
                    to={reviewPagePath(buildReviewSlug(vehicleSlug))}
                    className="ownership-page__hero-link"
                  >
                    Review →
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <p className="ownership-page__loading" aria-busy="true">
            Loading ownership estimates…
          </p>
        ) : (
          <>
            <div className="ownership-page__calculator">{children}</div>

            {summaryText ? (
              <section
                className="ownership-page__summary"
                aria-labelledby="ownership-page-summary-title"
              >
                <h2
                  id="ownership-page-summary-title"
                  className="ownership-page__summary-title"
                >
                  What this means
                </h2>
                <p className="ownership-page__summary-copy">{summaryText}</p>
              </section>
            ) : null}
          </>
        )}

        <nav
          className="ownership-page__related"
          aria-labelledby="ownership-page-related-title"
        >
          <h2
            id="ownership-page-related-title"
            className="ownership-page__related-title"
          >
            More ownership estimates
          </h2>
          <div className="ownership-page__related-links">
            {ownershipLinks.map((link) => (
              <Link
                key={link.type}
                to={link.href}
                className="ownership-page__related-link"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
