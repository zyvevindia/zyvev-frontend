import { Link } from "react-router-dom";

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

/**
 * @param {{ familySlug?: string }} props
 */
export default function VehicleOwnershipToolsSection({
  familySlug = "",
}) {
  const slug = normalizeVehicleSlug(familySlug);
  if (!slug) {
    return null;
  }

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
