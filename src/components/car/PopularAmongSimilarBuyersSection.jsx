import { Link } from "react-router-dom";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";

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
            <Link
              to={vehicleDetailPath(item.slug)}
              className="popular-similar-buyers__cta"
            >
              View details →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
