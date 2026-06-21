import OwnershipToolSecondaryLink from "./OwnershipToolSecondaryLink.jsx";

import "./vehicle-ownership-tools.css";

/**
 * Inline ownership tool links below EV Intelligence "Our Take".
 * @param {{ vehicleSlug?: string }} props
 */
export default function OwnershipToolIntelLinks({ vehicleSlug = "" }) {
  if (!vehicleSlug) return null;

  return (
    <nav
      className="ownership-tool-intel-links"
      aria-label="Ownership calculators"
    >
      <OwnershipToolSecondaryLink
        toolKey="savings-vs-petrol"
        vehicleSlug={vehicleSlug}
      >
        Compare with petrol ownership →
      </OwnershipToolSecondaryLink>
      <OwnershipToolSecondaryLink toolKey="cost-per-km" vehicleSlug={vehicleSlug}>
        Estimate running cost →
      </OwnershipToolSecondaryLink>
    </nav>
  );
}
