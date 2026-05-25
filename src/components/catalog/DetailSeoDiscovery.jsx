import { Link } from "react-router-dom";

import { buildVehicleDiscoveryLinkSections } from "../../seo/vehicleInternalLinks";

import "../../styles/car-details.css";

/**
 * Crawlable internal links for vehicle detail SEO (premium, minimal).
 */
export default function DetailSeoDiscovery({
  familySlug,
  vehicleName,
  compareRivals = [],
  brand = "",
  bodyType = "",
  priceInr = 0,
  peerFamilies = [],
  evIntelligence = null,
  catalogMeta = null,
}) {
  const sections = buildVehicleDiscoveryLinkSections({
    familySlug,
    vehicleName,
    compareRivals,
    brand,
    bodyType,
    priceInr,
    peerFamilies,
    evIntelligence,
    catalogMeta,
  });

  if (!sections.length) {
    return null;
  }

  return (
    <section
      id="related-evs"
      className="cd-seo-discovery"
      aria-labelledby="cd-seo-discovery-title"
    >
      <h2 id="cd-seo-discovery-title" className="cd-seo-discovery__title">
        Discover related EVs
      </h2>

      <div className="cd-seo-discovery__grid">
        {sections.map((section) => (
          <div key={section.id} className="cd-seo-discovery__block">
            <h3 className="cd-seo-discovery__heading">
              {section.title}
            </h3>
            <ul className="cd-seo-discovery__list">
              {section.links.map((link) => (
                <li key={`${section.id}-${link.href}`}>
                  <Link to={link.href} className="cd-seo-discovery__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
