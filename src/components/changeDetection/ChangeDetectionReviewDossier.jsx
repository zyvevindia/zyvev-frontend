import { adminBadge } from "../../pages/admin/adminOpsStyles.js";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

function recommendationTone(code) {
  if (code === "NO_CHANGE") return "green";
  if (code === "BLOCKED") return "red";
  return "yellow";
}

function ChangeTable({ rows = [] }) {
  if (!rows.length) {
    return <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>No changes in this section</p>;
  }
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
          <th style={{ padding: "6px 8px" }}>Field</th>
          <th style={{ padding: "6px 8px" }}>Type</th>
          <th style={{ padding: "6px 8px" }}>Before</th>
          <th style={{ padding: "6px 8px" }}>After</th>
          <th style={{ padding: "6px 8px" }}>Severity</th>
          <th style={{ padding: "6px 8px" }}>Priority</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.fieldKey || row.label} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{row.label}</td>
            <td style={{ padding: "6px 8px" }}>{row.changeType}</td>
            <td style={{ padding: "6px 8px" }}>{formatVal(row.before)}</td>
            <td style={{ padding: "6px 8px" }}>{formatVal(row.after)}</td>
            <td style={{ padding: "6px 8px" }}>{row.severity}</td>
            <td style={{ padding: "6px 8px" }}>{row.priority}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatVal(v) {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function ChangeDetectionReviewDossier({ dossier }) {
  const sections = dossier?.sections || {};
  const recommendation = dossier?.recommendation;
  const metrics = dossier?.metrics || {};

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {recommendation?.code && (
          <span style={adminBadge(recommendationTone(recommendation.code))}>
            {recommendation.code}
          </span>
        )}
        {dossier?.priority && (
          <span style={adminBadge(dossier.priority === "CRITICAL" ? "red" : "yellow")}>
            Priority: {dossier.priority}
          </span>
        )}
        <span style={{ fontSize: 14, color: "#64748b" }}>
          Est. review: ~{metrics.reviewMinutes ?? "—"} min
        </span>
      </div>

      {recommendation?.reason && (
        <p style={{ color: "#475569", marginTop: 0, fontSize: 14 }}>{recommendation.reason}</p>
      )}

      {sections.vehicleSummary && (
        <Section title="Vehicle Summary">
          <p style={{ margin: 0, fontSize: 14 }}>
            {sections.vehicleSummary.vehicle} ({sections.vehicleSummary.familySlug})
            <br />
            Last checked: {sections.vehicleSummary.lastCheckedAt || "—"}
          </p>
        </Section>
      )}

      {sections.changesDetected && (
        <Section title={`Changes Detected (${sections.changesDetected.count})`}>
          <ChangeTable rows={sections.changesDetected.rows} />
        </Section>
      )}

      {sections.priceChanges?.count > 0 && (
        <Section title="Price Changes">
          <ChangeTable rows={sections.priceChanges.rows} />
        </Section>
      )}

      {sections.variantChanges?.count > 0 && (
        <Section title="Variant Changes">
          <ChangeTable rows={sections.variantChanges.rows} />
        </Section>
      )}

      {sections.batteryRangeChanges?.count > 0 && (
        <Section title="Battery and Range Changes">
          <ChangeTable rows={sections.batteryRangeChanges.rows} />
        </Section>
      )}

      {sections.chargingChanges?.count > 0 && (
        <Section title="Charging Changes">
          <ChangeTable rows={sections.chargingChanges.rows} />
        </Section>
      )}

      {sections.featureChanges?.count > 0 && (
        <Section title="Feature Changes">
          <ChangeTable rows={sections.featureChanges.rows} />
        </Section>
      )}

      {sections.evidenceSources && (
        <Section title="Evidence Sources">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            <li>OEM: {sections.evidenceSources.oemUrl || "—"}</li>
            <li>Brochure: {sections.evidenceSources.brochureUrl || "—"}</li>
            {sections.evidenceSources.sourceChanges?.length > 0 && (
              <li>Source URL changes: {sections.evidenceSources.sourceChanges.length}</li>
            )}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "1rem",
        marginBottom: "0.85rem",
      }}
    >
      <strong style={{ fontSize: 15 }}>{title}</strong>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}
