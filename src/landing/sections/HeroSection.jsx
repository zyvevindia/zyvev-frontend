import { Link } from "react-router-dom";

import { formatIndianPrice } from "../../utils/formatIndianPrice.js";

function buildHeroStats(families = []) {
  if (!families.length) return null;

  const prices = families
    .map((family) => Number(family.startingPrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  return {
    vehicleCount: families.length,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
  };
}

export default function HeroSection({ config, families = [], loading = false }) {
  const hero = config?.hero || {};
  const stats =
    hero.showStats && !loading ? buildHeroStats(families) : null;

  const logoAlt =
    hero.logoAlt ||
    (hero.title || config?.title
      ? `${hero.title || config.title} logo`
      : "Brand logo");

  return (
    <header className="landing-hero" data-content-block="hero">
      {hero.logoUrl ? (
        <img
          className="landing-hero__logo"
          src={hero.logoUrl}
          alt={logoAlt}
          loading="lazy"
        />
      ) : null}

      {hero.badge ? (
        <p className="landing-hero__badge">{hero.badge}</p>
      ) : null}

      <h1 className="landing-hero__title">
        {hero.title || config?.title}
      </h1>

      {hero.subtitle || config?.description ? (
        <p className="landing-hero__subtitle">
          {hero.subtitle || config?.description}
        </p>
      ) : null}

      {stats ? (
        <dl className="landing-hero__stats">
          <div>
            <dt>Models listed</dt>
            <dd>{stats.vehicleCount}</dd>
          </div>
          {stats.priceMin != null && stats.priceMax != null ? (
            <div>
              <dt>Price range (from)</dt>
              <dd>
                {formatIndianPrice(stats.priceMin)}
                {stats.priceMax > stats.priceMin
                  ? ` – ${formatIndianPrice(stats.priceMax)}`
                  : ""}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {hero.ctaLabel && hero.ctaHref ? (
        <div className="landing-hero__actions">
          <Link to={hero.ctaHref} className="landing-hero__cta">
            {hero.ctaLabel}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
