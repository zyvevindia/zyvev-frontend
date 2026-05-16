import { card, h2, table, td, th, muted } from "./editorialStyles";

function Metric({ label, value, warn }) {
  return (
    <li style={{ color: warn ? "#b45309" : undefined }}>
      {label}: <strong>{value}</strong>
    </li>
  );
}

export default function CoverageTable({ report }) {
  if (!report) return null;

  const agg = report.aggregate || {};
  const obs = report.observationFleet || {};

  return (
    <div>
      <div style={card}>
        <h2 style={h2}>Fleet coverage summary</h2>
        <p style={muted}>{report.variantCount} Tier-1 variants analyzed</p>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>
          Trust &amp; charging gaps
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          <Metric label="Missing range reality expanded" value={agg.missingRangeRealityExpanded ?? 0} warn={agg.missingRangeRealityExpanded > 0} />
          <Metric label="Missing charging practicality" value={agg.missingChargingPracticality ?? 0} warn={agg.missingChargingPracticality > 0} />
          <Metric label="Missing ownership confidence" value={agg.missingOwnershipConfidence ?? 0} warn={agg.missingOwnershipConfidence > 0} />
          <Metric label="Low trust indicator count" value={agg.lowTrustIndicatorCount ?? 0} warn={agg.lowTrustIndicatorCount > 0} />
          <Metric label="Incomplete charging practicality" value={agg.incompleteChargingPracticality ?? 0} warn={agg.incompleteChargingPracticality > 0} />
          <Metric label="Missing usable kWh" value={agg.missingUsableKwh ?? 0} warn={agg.missingUsableKwh > 0} />
          <Metric label="Brochure verification gap" value={agg.brochureVerificationGap ?? 0} warn={agg.brochureVerificationGap > 0} />
          <Metric label="Trust consistency issues" value={agg.trustConsistencyIssues ?? 0} warn={agg.trustConsistencyIssues > 0} />
          <Metric label="Variants needs_review" value={agg.variantsWithNeedsReview ?? 0} warn={agg.variantsWithNeedsReview > 0} />
          <Metric label="Calibration-ready variants" value={agg.calibrationReady ?? 0} />
        </ul>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>
          Observation pilot
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
          <Metric label="Total observations" value={obs.totalObservations ?? 0} />
          <Metric label="Verified editorial" value={obs.verifiedCount ?? 0} />
          <Metric label="Pending review" value={obs.pendingCount ?? 0} warn={obs.pendingCount > 0} />
          <Metric label="Stale observations" value={obs.staleCount ?? 0} warn={obs.staleCount > 0} />
          <Metric label="Variants with observations" value={obs.variantsWithObservations ?? 0} />
          <Metric label="Low observation coverage" value={agg.lowObservationCoverage ?? 0} warn={agg.lowObservationCoverage > 0} />
        </ul>
        <p style={{ ...muted, marginTop: 12 }}>
          Priorities: {report.enrichmentPriorities?.join(" · ")}
        </p>
      </div>

      {report.flagships?.length > 0 && (
        <div style={card}>
          <h2 style={h2}>Flagship variants</h2>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Variant</th>
                <th style={th}>Observations</th>
                <th style={th}>Review flags</th>
                <th style={th}>Calibration</th>
              </tr>
            </thead>
            <tbody>
              {report.flagships.map((v) => (
                <tr key={v.slug}>
                  <td style={td}>
                    <strong>{v.slug}</strong>
                  </td>
                  <td style={td}>
                    {v.observationSupport?.verifiedEditorial ?? 0} verified
                  </td>
                  <td style={td}>{v.needsReviewCount ?? 0}</td>
                  <td style={td}>
                    {v.calibrationReady ? "ready" : "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={card}>
        <h2 style={h2}>Variant gaps (sorted)</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Variant</th>
              <th style={th}>Gaps</th>
              <th style={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {(report.variants || []).slice(0, 40).map((v) => (
              <tr key={v.slug}>
                <td style={td}>
                  <strong>{v.slug}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {v.brand} / {v.model}
                  </span>
                </td>
                <td style={td}>{v.gapCount}</td>
                <td style={td}>
                  <code style={{ fontSize: 11 }}>
                    {v.gaps?.join(", ") || "—"}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
