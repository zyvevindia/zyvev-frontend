import { Link } from "react-router-dom";

import { getRecommendedOwnershipTool } from "../../tools/getRecommendedOwnershipTool.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

import "./vehicle-ownership-tools.css";

const OWNERSHIP_TOOL_CARDS = [
  {
    id: "cost-per-km",
    title: "Cost per km",
    description: "Estimate electricity running cost.",
    path: "/tools/cost-per-km",
  },
  {
    id: "tco",
    title: "Total Cost of Ownership",
    description: "Understand 5-year ownership expenses.",
    path: "/tools/tco",
  },
  {
    id: "savings-vs-petrol",
    title: "Petrol vs EV Savings",
    description: "Compare lifetime cost with petrol vehicles.",
    path: "/tools/savings-vs-petrol",
  },
  {
    id: "emi",
    title: "EMI Calculator",
    description: "Estimate monthly loan payments.",
    path: "/tools/emi",
  },
];

const RECOMMENDATION_ICONS = {
  "cost-per-km": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19h16M6 19l3-14M18 19l-3-14M10 10h4M9 14h6" />
    </svg>
  ),
  tco: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9v-5zM9 13h5a2.5 2.5 0 0 1 0 5H9v-5z" />
    </svg>
  ),
  savings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3v18M17 8c0-2.8-2.2-5-5-5S7 5.2 7 8s2.2 5 5 5 5-2.2 5-5zM7 16c0 2.8 2.2 5 5 5s5-2.2 5-5" />
    </svg>
  ),
  emi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 14h4" />
    </svg>
  ),
};

/**
 * @param {{ familySlug?: string, vehicle?: object|null }} props
 */
export default function VehicleOwnershipToolsSection({
  familySlug = "",
  vehicle = null,
}) {
  const slug = normalizeVehicleSlug(familySlug);
  if (!slug) {
    return null;
  }

  const recommendation = getRecommendedOwnershipTool(vehicle);
  const recommendationHref = `${recommendation.path}?vehicle=${encodeURIComponent(slug)}`;

  return (
    <section
      className="vehicle-ownership-tools"
      aria-labelledby="vehicle-ownership-tools-title"
    >
      <h2 id="vehicle-ownership-tools-title" className="cd-section__title">
        Ownership Tools
      </h2>
      <p className="cd-section__intro vehicle-ownership-tools__intro">
        Estimate running cost, ownership cost, savings and financing before
        buying.
      </p>

      <article
        className="vehicle-ownership-tools__featured"
        aria-label={`Recommended tool: ${recommendation.title}`}
      >
        <div
          className="vehicle-ownership-tools__featured-icon"
          aria-hidden="true"
        >
          {RECOMMENDATION_ICONS[recommendation.icon]}
        </div>
        <div className="vehicle-ownership-tools__featured-copy">
          <h3 className="vehicle-ownership-tools__featured-headline">
            {recommendation.headline}
          </h3>
          <p className="vehicle-ownership-tools__featured-desc">
            {recommendation.description}
          </p>
        </div>
        <Link
          to={recommendationHref}
          className="vehicle-ownership-tools__featured-cta"
        >
          {recommendation.ctaLabel}
        </Link>
      </article>

      <div className="vehicle-ownership-tools__grid">
        {OWNERSHIP_TOOL_CARDS.map((tool) => (
          <article key={tool.id} className="vehicle-ownership-tools__card">
            <div className="vehicle-ownership-tools__copy">
              <h3 className="vehicle-ownership-tools__card-title">
                {tool.title}
              </h3>
              <p className="vehicle-ownership-tools__card-desc">
                {tool.description}
              </p>
            </div>
            <Link
              to={`${tool.path}?vehicle=${encodeURIComponent(slug)}`}
              className="vehicle-ownership-tools__cta"
            >
              Calculate →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
