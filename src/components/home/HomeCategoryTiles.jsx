import { Link } from "react-router-dom";

import "../../styles/catalog-ux-wave-b.css";

export const HOME_DISCOVERY_TILES = Object.freeze([
  {
    id: "family",
    label: "Family EVs",
    path: "/discover/family-friendly",
    icon: "👨‍👩‍👧",
  },
  {
    id: "city",
    label: "City EVs",
    path: "/discover/city-driving",
    icon: "🏙️",
  },
  {
    id: "highway",
    label: "Highway EVs",
    path: "/discover/highway-evs",
    icon: "🛣️",
  },
  {
    id: "budget",
    label: "Budget EVs",
    path: "/discover/under-15-lakh",
    icon: "💰",
  },
  {
    id: "premium",
    label: "Premium EVs",
    path: "/cars?price=above_30",
    icon: "✨",
  },
  {
    id: "fast-charging",
    label: "Fast Charging",
    path: "/discover/fastest-charging",
    icon: "⚡",
  },
]);

function TileCard({ tile }) {
  return (
    <Link to={tile.path} className="home-category-tiles__card">
      <span className="home-category-tiles__icon" aria-hidden>
        {tile.icon}
      </span>
      <span className="home-category-tiles__label">{tile.label}</span>
    </Link>
  );
}

export default function HomeCategoryTiles() {
  return (
    <section className="home-category-tiles" aria-labelledby="home-category-tiles-title">
      <h2 id="home-category-tiles-title" className="home-category-tiles__title">
        Browse by Use Case
      </h2>

      <div className="home-category-tiles__grid">
        {HOME_DISCOVERY_TILES.map((tile) => (
          <TileCard key={tile.id} tile={tile} />
        ))}
      </div>
    </section>
  );
}
