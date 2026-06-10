import { Link } from "react-router-dom";
import { useMemo } from "react";

import { buildCompareDiscoveryLinks } from "../../seo/compareDiscoveryLinks";

import "../../styles/compare-internal-links.css";

/**
 * Crawlable compare pair links — bottom of compare and detail pages.
 */
export default function CompareInternalLinks({
  contextSlugs = [],
  title = "Popular EV comparisons",
  limit = 8,
  className = "",
}) {
  const links = useMemo(
    () =>
      buildCompareDiscoveryLinks({
        contextSlugs,
        limit,
      }),
    [contextSlugs.join("|"), limit]
  );

  if (!links.length) return null;

  return (
    <section
      className={`compare-internal-links${className ? ` ${className}` : ""}`}
      aria-labelledby="compare-internal-links-title"
    >
      <h2 id="compare-internal-links-title" className="compare-internal-links__title">
        {title}
      </h2>
      <p className="compare-internal-links__intro">
        Side-by-side EV comparisons to help you decide faster.
      </p>
      <ul className="compare-internal-links__list">
        {links.map((link) => (
          <li key={`${link.slugA}-${link.slugB}`}>
            <Link
              to={link.href}
              className="compare-internal-links__link"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
