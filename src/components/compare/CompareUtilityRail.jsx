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
  const compareSlug =
    metadata?.compareSlug ||
    (String(sourcePage || "").match(/^\/compare\/([^/?]+)/)?.[1] ?? "");
  const authorityLinks = buildCompareAuthorityLinks(cars, compareSlug);
  const stillUnsureLinks = authorityLinks.filter(
    (l) =>
      l.href?.includes("/ownership-guides/") ||
      l.href?.includes("/charging-guides/") ||
      l.href?.startsWith("/discover/")
  );
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

      {stillUnsureLinks.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Still unsure?
          </p>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "0.75rem",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Before you decide: read a short myth-buster or ownership explainer that matches
            your worry (charging, apartment, highway, or battery).
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              fontSize: "0.8rem",
              color: "#0369a1",
            }}
          >
            <li style={{ marginBottom: 4, listStyle: "none", marginLeft: "-1.1rem" }}>
              <Link to="/ownership-guides/ev-myths">EV myths vs reality hub</Link>
            </li>
            {stillUnsureLinks.slice(0, 4).map((link) => (
              <li key={link.href} style={{ marginBottom: 4 }}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
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
