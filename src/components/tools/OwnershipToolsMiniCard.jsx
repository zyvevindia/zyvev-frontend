import { Link } from "react-router-dom";

import { buildOwnershipToolHref } from "../../tools/ownershipToolLinks.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

import "./vehicle-ownership-tools.css";

const MINI_TOOL_BUTTONS = [
  {
    id: "cost-per-km",
    label: "Calculate cost/km",
    toolKey: "cost-per-km",
  },
  {
    id: "tco",
    label: "Estimate total ownership",
    toolKey: "tco",
  },
  {
    id: "savings-vs-petrol",
    label: "Compare against petrol",
    toolKey: "savings-vs-petrol",
  },
  {
    id: "emi",
    label: "Calculate EMI",
    toolKey: "emi",
  },
];

/**
 * Compact ownership tools card for review pages.
 * @param {{ vehicleSlug?: string, className?: string }} props
 */
export default function OwnershipToolsMiniCard({
  vehicleSlug = "",
  className = "",
}) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  if (!slug) return null;

  return (
    <article
      className={["ownership-tools-mini", className].filter(Boolean).join(" ")}
      aria-labelledby="ownership-tools-mini-title"
    >
      <h2 id="ownership-tools-mini-title" className="ownership-tools-mini__title">
        Ownership Tools
      </h2>
      <div className="ownership-tools-mini__grid">
        {MINI_TOOL_BUTTONS.map((tool) => (
          <Link
            key={tool.id}
            to={buildOwnershipToolHref(tool.toolKey, slug)}
            className="ownership-tools-mini__btn"
          >
            {tool.label}
          </Link>
        ))}
      </div>
    </article>
  );
}
