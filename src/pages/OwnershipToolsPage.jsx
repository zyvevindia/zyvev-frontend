import { Link } from "react-router-dom";

import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schema.js";
import {
  OWNERSHIP_TOOL_BENEFITS,
  OWNERSHIP_TOOL_CARDS,
} from "../tools/ownershipToolRoutes.js";

import "../styles/ownership-tools-page.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const PAGE_TITLE = "Ownership Tools";
const PAGE_DESCRIPTION =
  "Smart calculators to help you make confident EV buying decisions.";

export default function OwnershipToolsPage() {
  const canonical = `${SITE_ORIGIN.replace(/\/$/, "")}/tools`;

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Tools", url: "/tools" },
    ]),
    buildWebPageSchema({
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonical,
    }),
  ].filter(Boolean);

  return (
    <div className="ownership-tools-page">
      <SEO
        title={`${PAGE_TITLE} | EVSavari`}
        description={PAGE_DESCRIPTION}
        canonical={canonical}
      />

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <div className="ownership-tools-page__inner">
        <nav className="ownership-tools-page__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <span>Tools</span>
        </nav>

        <header className="ownership-tools-page__hero">
          <h1 className="ownership-tools-page__title">{PAGE_TITLE}</h1>
          <p className="ownership-tools-page__subtitle">{PAGE_DESCRIPTION}</p>
        </header>

        <section
          className="ownership-tools-page__calculators"
          aria-labelledby="ownership-tools-calculators-title"
        >
          <h2 id="ownership-tools-calculators-title" className="visually-hidden">
            Ownership calculators
          </h2>

          <div className="ownership-tools-page__tool-grid">
            {OWNERSHIP_TOOL_CARDS.map((tool) => (
              <article key={tool.id} className="ownership-tools-page__tool-card">
                <h3 className="ownership-tools-page__tool-title">{tool.title}</h3>
                <p className="ownership-tools-page__tool-copy">{tool.description}</p>
                <Link
                  to={tool.path}
                  className="ownership-tools-page__tool-link"
                >
                  Open calculator →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          className="ownership-tools-page__benefits"
          aria-labelledby="ownership-tools-benefits-title"
        >
          <h2
            id="ownership-tools-benefits-title"
            className="ownership-tools-page__benefits-title"
          >
            Why use these tools?
          </h2>

          <div className="ownership-tools-page__benefits-grid">
            {OWNERSHIP_TOOL_BENEFITS.map((benefit) => (
              <article
                key={benefit.id}
                className="ownership-tools-page__benefit-card"
              >
                <h3 className="ownership-tools-page__benefit-title">
                  {benefit.title}
                </h3>
                <p className="ownership-tools-page__benefit-copy">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
