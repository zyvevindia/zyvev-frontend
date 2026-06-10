import { Link } from "react-router-dom";

import "../../styles/catalog-ux-wave-b.css";

export const HOME_DISCOVERY_TILES = Object.freeze([
  {
    id: "family",
    label: "Family EVs",
    description: "Space, safety, and comfort ranked by EVSavari family score",
    path: "/discover/family-friendly",
    icon: "👨‍👩‍👧",
  },
  {
    id: "city",
    label: "City EVs",
    description: "Best for daily commutes and urban charging",
    path: "/discover/city-driving",
    icon: "🏙️",
  },
  {
    id: "highway",
    label: "Highway EVs",
    description: "Long-range picks for inter-city driving",
    path: "/discover/highway-evs",
    icon: "🛣️",
  },
  {
    id: "budget",
    label: "Budget EVs",
    description: "Strong value under ₹15 lakh",
    path: "/discover/under-15-lakh",
    icon: "💰",
  },
  {
    id: "premium",
    label: "Premium EVs",
    description: "Luxury and high-spec models above ₹30 lakh",
    path: "/cars?price=above_30",
    icon: "✨",
  },
  {
    id: "fast-charging",
    label: "Fast Charging",
    description: "Quickest DC charging and convenience scores",
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
      <span className="home-category-tiles__desc">{tile.description}</span>
    </Link>
  );
}

export default function HomeCategoryTiles() {
  return (
    <section className="home-category-tiles" aria-labelledby="home-category-tiles-title">
      <div className="home-category-tiles__header">
        <h2 id="home-category-tiles-title" className="home-category-tiles__title">
          Find your EV by use case
        </h2>
        <p className="home-category-tiles__subtitle">
          Score-ranked discovery guides — tap a category to see EVSavari&apos;s top picks.
        </p>
      </div>

      <div className="home-category-tiles__grid">
        {HOME_DISCOVERY_TILES.map((tile) => (
          <TileCard key={tile.id} tile={tile} />
        ))}
      </div>

      <div className="home-category-tiles__scroll" aria-label="Discovery categories">
        {HOME_DISCOVERY_TILES.map((tile) => (
          <TileCard key={`scroll-${tile.id}`} tile={tile} />
        ))}
      </div>
    </section>
  );
}
