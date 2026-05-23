import { buildCompareReliabilityLine } from "../../utils/compareTrustCopy";
import "./compare-reliability.css";

/**
 * Subtle compare-set reliability line — no overconfident tone.
 */
export default function CompareReliabilitySummary({ cars = [] }) {
  if (!cars?.length) return null;

  const line = buildCompareReliabilityLine(cars);

  return (
    <p className="compare-reliability" role="note">
      <span className="compare-reliability__label">Compare reliability:</span>{" "}
      {line}
    </p>
  );
}
