import { Link } from "react-router-dom";

import { buildOwnershipToolHref } from "../../tools/ownershipToolLinks.js";

import "./vehicle-ownership-tools.css";

/**
 * Subtle secondary link into an ownership calculator.
 * @param {{
 *   toolKey: import("../../tools/ownershipToolLinks.js").OwnershipToolKey,
 *   vehicleSlug?: string,
 *   children: import("react").ReactNode,
 *   className?: string,
 * }} props
 */
export default function OwnershipToolSecondaryLink({
  toolKey,
  vehicleSlug = "",
  children,
  className = "",
}) {
  if (!vehicleSlug) return null;

  return (
    <Link
      to={buildOwnershipToolHref(toolKey, vehicleSlug)}
      className={["ownership-tool-link", className].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}
