import { Link } from "react-router-dom";

import CarCard from "../../components/CarCard.jsx";
import CarCardSkeleton from "../../components/skeletons/CarCardSkeleton.jsx";
import CatalogResultsGrid from "../../components/catalog/CatalogResultsGrid.jsx";

export default function VehicleGridSection({
  config,
  cards = [],
  loading = false,
  error = "",
  fallbackNotice = null,
}) {
  return (
    <section
      className="landing-vehicle-grid"
      data-content-block="vehicleGrid"
      aria-labelledby="landing-vehicle-grid-title"
    >
      <h2 id="landing-vehicle-grid-title" className="landing-section__title">
        {config?.title || "Electric vehicles"}
      </h2>

      {fallbackNotice ? (
        <p className="landing-vehicle-grid__notice">{fallbackNotice}</p>
      ) : null}

      {error ? (
        <p className="landing-vehicle-grid__error">
          Catalog is temporarily unavailable.{" "}
          <Link to="/cars">Browse all EVs</Link>
        </p>
      ) : null}

      {loading ? (
        <CatalogResultsGrid count={3}>
          {[1, 2, 3].map((i) => (
            <CarCardSkeleton key={i} />
          ))}
        </CatalogResultsGrid>
      ) : (
        <CatalogResultsGrid count={cards.length}>
          {cards.map((card) => (
            <CarCard key={card.slug || card.familySlug} car={card} />
          ))}
        </CatalogResultsGrid>
      )}
    </section>
  );
}
