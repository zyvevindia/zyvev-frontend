import { Link } from "react-router-dom";

import UsefulnessFeedback from "../feedback/UsefulnessFeedback";
import { buildCompareAuthorityLinks } from "../../seo/compareAuthorityLinks";
import {
  buildCompareToLeadConfidenceNote,
  buildCompareTrustReassuranceLine,
} from "../../utils/conversionTrustCopy";

/**
 * Compare page utility strip — methodology, usefulness vote, data report.
 * Placed after Detailed Specifications, before real-world comparison blocks.
 */
export default function CompareUtilityRail({
  recommendationLogic = null,
  sourcePage = "",
  metadata = {},
  usefulnessLabel = "Was this useful?",
  cars = [],
}) {
  const methodology = recommendationLogic?.methodology;
  const authorityLinks = buildCompareAuthorityLinks(cars);
  const leadNote = buildCompareToLeadConfidenceNote(metadata?.compareDepth || cars.length);

  return (
    <div className="compare-utility-rail" aria-label="Comparison feedback and methodology">
      {methodology ? (
        <div className="compare-utility-rail__methodology">
          <p className="compare-utility-rail__methodology-text">
            <strong>How we compare:</strong> {methodology}
          </p>
          <p
            className="compare-utility-rail__trust-note"
            style={{
              margin: "8px 0 0",
              fontSize: "0.8rem",
              color: "#64748b",
            }}
          >
            {buildCompareTrustReassuranceLine()} Estimated fields are labelled on
            specs.
          </p>
        </div>
      ) : null}

      {leadNote ? (
        <p
          className="compare-utility-rail__lead-note"
          style={{
            margin: "12px 0 0",
            fontSize: "0.8rem",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {leadNote}
        </p>
      ) : null}

      {authorityLinks.length > 0 ? (
        <nav
          aria-label="Related EV guides"
          style={{ marginTop: 12, fontSize: "0.8rem" }}
        >
          <span style={{ color: "#64748b" }}>Practical guides: </span>
          {authorityLinks.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : null}
              <Link to={link.href} style={{ color: "#0369a1" }}>
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      ) : null}

      <UsefulnessFeedback
        context="compare"
        sourcePage={sourcePage}
        metadata={metadata}
        label={usefulnessLabel}
      />
    </div>
  );
}
