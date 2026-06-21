import { Link } from "react-router-dom";

import OwnershipToolSecondaryLink from "../tools/OwnershipToolSecondaryLink.jsx";
import { vehicleDetailPath } from "../../utils/vehicleRoutes";

import "../tools/vehicle-ownership-tools.css";
import "./popular-among-similar-buyers.css";

export default function PopularAmongSimilarBuyersSection({ vehicles = [] }) {
  if (!vehicles.length) return null;

  return (
    <section
      className="popular-similar-buyers"
      aria-labelledby="popular-similar-buyers-title"
    >
      <h2 id="popular-similar-buyers-title" className="cd-section__title">
        Popular Among Similar Buyers
      </h2>
      <p className="cd-section__intro popular-similar-buyers__intro">
        EVs frequently explored by shoppers with similar needs.
      </p>

      <div className="popular-similar-buyers__grid">
        {vehicles.map((item) => (
          <article key={item.slug} className="popular-similar-buyers__card">
            <h3 className="popular-similar-buyers__card-title">{item.title}</h3>
            <div className="recommendation-loop-card__actions">
              <Link
                to={vehicleDetailPath(item.slug)}
                className="popular-similar-buyers__cta"
              >
                View details →
              </Link>
              <OwnershipToolSecondaryLink
                toolKey="tco"
                vehicleSlug={item.slug}
                className="ownership-tool-link--muted"
              >
                Ownership cost →
              </OwnershipToolSecondaryLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
