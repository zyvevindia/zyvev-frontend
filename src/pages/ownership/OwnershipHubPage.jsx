import { Link } from "react-router-dom";

import SEO from "../../components/SEO/SEO.jsx";
import JsonLd from "../../components/SEO/JsonLd.jsx";
import { buildOwnershipHubMeta } from "../../seo/ownershipHubMetadata.js";
import { buildOwnershipHubSchemas } from "../../seo/ownershipHubSchema.js";

import {
  OWNERSHIP_HUB_SECTIONS,
  OWNERSHIP_VEHICLE_INDEX_PATH,
} from "./ownershipHubConstants.js";

import "../../components/reviews/review-page.css";
import "./ownership-hub.css";

export default function OwnershipHubPage() {
  const meta = buildOwnershipHubMeta();
  const schemas = buildOwnershipHubSchemas();

  return (
    <div className="ownership-hub">
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
          <span>Ownership</span>
        </nav>

        <header className="ownership-hub__hero review-page__hero review-page__hero--premium">
          <h1 className="review-page__title">{meta.h1}</h1>
          <p className="ownership-hub__subtitle">
            Understand running costs, ownership costs, savings and financing
            before buying an electric car.
          </p>

          <div className="ownership-hub__hero-links">
            <Link to={OWNERSHIP_VEHICLE_INDEX_PATH} className="ownership-hub__hero-link">
              Browse by vehicle →
            </Link>
            <Link to="/tools" className="ownership-hub__hero-link">
              Tools hub →
            </Link>
          </div>
        </header>

        <div className="ownership-hub__sections">
          {OWNERSHIP_HUB_SECTIONS.map((section) => (
            <section
              key={section.id}
              className="ownership-hub__section"
              aria-labelledby={`ownership-hub-${section.id}-title`}
            >
              <h2
                id={`ownership-hub-${section.id}-title`}
                className="ownership-hub__section-title"
              >
                {section.title}
              </h2>
              <p className="ownership-hub__section-copy">{section.description}</p>

              <ul className="ownership-hub__examples">
                {section.exampleLinks.map((example) => (
                  <li key={example.href}>
                    <Link to={example.href}>{example.label}</Link>
                  </li>
                ))}
              </ul>

              <Link to={section.toolPath} className="ownership-hub__tool-link">
                {section.toolLabel} →
              </Link>
            </section>
          ))}
        </div>

        <nav
          className="ownership-hub__footer-nav"
          aria-labelledby="ownership-hub-footer-title"
        >
          <h2 id="ownership-hub-footer-title" className="ownership-hub__footer-title">
            Explore ownership estimates
          </h2>
          <div className="ownership-hub__footer-links">
            <Link to={OWNERSHIP_VEHICLE_INDEX_PATH}>Vehicle ownership index →</Link>
            <Link to="/tools">Ownership tools hub →</Link>
            <Link to="/cars">Browse all EVs →</Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
