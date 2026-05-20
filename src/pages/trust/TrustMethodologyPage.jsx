import { Link, useLocation } from "react-router-dom";

import SeoHead from "../../components/SEO/SeoHead";
import JsonLd from "../../components/SEO/JsonLd";
import { SITE_ORIGIN } from "../../config";
import { buildBreadcrumbSchema } from "../../utils/structuredData";

import "../../styles/trust-pages.css";

export default function TrustMethodologyPage({
  page,
  breadcrumbLabel,
}) {
  const location = useLocation();
  if (!page) return null;

  const canonical = `${SITE_ORIGIN}${location.pathname}`;

  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: SITE_ORIGIN },
    { name: breadcrumbLabel || page.title, url: canonical },
  ]);

  return (
    <article className="trust-page">
      <SeoHead
        meta={{
          title: page.pageTitle,
          description: page.subtitle,
          canonical,
          robots: "index, follow",
        }}
      />
      {breadcrumbs && <JsonLd data={breadcrumbs} />}

      <header className="trust-page__hero">
        <h1>{page.title}</h1>
        <p className="trust-page__subtitle">{page.subtitle}</p>
      </header>

      <div className="trust-page__body">
        {page.sections?.map((section) => (
          <section
            key={section.id || section.heading}
            id={section.id}
            className="trust-page__section"
          >
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
          </section>
        ))}

        {page.links?.length > 0 && (
          <nav className="trust-page__links" aria-label="Related trust topics">
            <h2 className="trust-page__links-title">Learn more</h2>
            <ul>
              {page.links.map((link) => (
                <li key={link.href}>
                  <Link to={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
}
