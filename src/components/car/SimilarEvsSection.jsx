import { Link } from "react-router-dom";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";

import "./similar-evs.css";

export default function SimilarEvsSection({ similarVehicles = [] }) {
  if (!similarVehicles.length) return null;

  return (
    <section className="similar-evs" aria-labelledby="similar-evs-title">
      <h2 id="similar-evs-title" className="cd-section__title">
        Similar EVs
      </h2>
      <p className="cd-section__intro similar-evs__intro">
        Other EVs with comparable price and usage characteristics.
      </p>

      <div className="similar-evs__grid">
        {similarVehicles.map((item) => (
          <article key={item.slug} className="similar-evs__card">
            <h3 className="similar-evs__card-title">{item.title}</h3>
            <Link
              to={vehicleDetailPath(item.slug)}
              className="similar-evs__cta"
            >
              View details →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
