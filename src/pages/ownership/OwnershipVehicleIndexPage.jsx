import { Link } from "react-router-dom";

import OwnershipVehicleIndexCard from "../../components/ownership/OwnershipVehicleIndexCard.jsx";
import SEO from "../../components/SEO/SEO.jsx";
import JsonLd from "../../components/SEO/JsonLd.jsx";
import { buildOwnershipVehicleIndexMeta } from "../../seo/ownershipHubMetadata.js";
import { buildOwnershipVehicleIndexSchemas } from "../../seo/ownershipHubSchema.js";

import {
  OWNERSHIP_HUB_PATH,
} from "./ownershipHubConstants.js";
import { useOwnershipVehicleIndex } from "./useOwnershipVehicleIndex.js";

import "../../components/reviews/review-page.css";
import "./ownership-hub.css";

export default function OwnershipVehicleIndexPage() {
  const meta = buildOwnershipVehicleIndexMeta();
  const { families, loading, error } = useOwnershipVehicleIndex();
  const schemas = buildOwnershipVehicleIndexSchemas(
    families.map((family) => ({
      familySlug: family.familySlug,
      familyName: family.familyName,
      brand: family.brand,
      startingPrice: family.startingPrice,
      image: family.heroImage || family.image,
    }))
  );

  return (
    <div className="ownership-hub ownership-hub--index">
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        keywords={meta.keywords}
        type={meta.ogType}
        robots={meta.robots}
        image={meta.image}
      />

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <div className="ownership-hub__inner">
        <nav className="ownership-hub__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to={OWNERSHIP_HUB_PATH}>Ownership</Link>
          <span aria-hidden="true"> / </span>
          <span>Vehicle Ownership</span>
        </nav>

        <header className="ownership-hub__hero review-page__hero review-page__hero--premium">
          <h1 className="review-page__title">{meta.h1}</h1>
          <p className="ownership-hub__subtitle">
            Running cost, ownership cost, petrol savings, and EMI estimates for
            every tier-1 EV model family.
          </p>

          <div className="ownership-hub__hero-links">
            <Link to={OWNERSHIP_HUB_PATH} className="ownership-hub__hero-link">
              Ownership guides →
            </Link>
            <Link to="/tools" className="ownership-hub__hero-link">
              Tools hub →
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="ownership-hub__state" aria-busy="true">
            Loading vehicle ownership guides…
          </p>
        ) : null}

        {error === "load_failed" ? (
          <p className="ownership-hub__state">
            Could not load vehicle ownership guides.{" "}
            <Link to={OWNERSHIP_HUB_PATH}>Return to ownership hub</Link>.
          </p>
        ) : null}

        {!loading && !error ? (
          <section
            className="ownership-hub__grid"
            aria-label="Vehicle ownership guides"
          >
            {families.map((family) => (
              <OwnershipVehicleIndexCard
                key={family.familySlug}
                familySlug={family.familySlug}
                familyName={family.familyName}
                startingPrice={family.startingPrice}
                vehicle={family}
                image={family.heroImage || family.image}
              />
            ))}
          </section>
        ) : null}

        <nav
          className="ownership-hub__footer-nav"
          aria-labelledby="ownership-index-footer-title"
        >
          <h2
            id="ownership-index-footer-title"
            className="ownership-hub__footer-title"
          >
            More ownership resources
          </h2>
          <div className="ownership-hub__footer-links">
            <Link to={OWNERSHIP_HUB_PATH}>Ownership hub →</Link>
            <Link to="/tools">Tools hub →</Link>
            <Link to="/cars">Browse all EVs →</Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
