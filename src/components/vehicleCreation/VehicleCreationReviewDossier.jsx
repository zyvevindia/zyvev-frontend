import { useMemo, useState } from "react";

import {
  RECOMMENDATION_LABELS,
  STATUS_LABELS,
} from "../../agents/vehicleCreation/vehicleCreationStatus.js";
import ConfidenceBadge from "../catalogImport/ConfidenceBadge.jsx";
import { adminBadge } from "../../pages/admin/adminOpsStyles.js";

const sectionCard = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "1rem 1.1rem",
  marginBottom: "0.85rem",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

function recommendationTone(code) {
  if (code === "READY") return "green";
  if (code === "BLOCKED") return "red";
  return "yellow";
}

function FieldTable({ rows = [], emptyMessage = "No items" }) {
  if (!rows.length) {
    return <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>{emptyMessage}</p>;
  }
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
          <th style={{ padding: "6px 8px" }}>Field</th>
          <th style={{ padding: "6px 8px" }}>Value</th>
          <th style={{ padding: "6px 8px" }}>Confidence</th>
          <th style={{ padding: "6px 8px" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.fieldKey || row.label} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{row.label}</td>
            <td style={{ padding: "6px 8px" }}>{row.value ?? "—"}</td>
            <td style={{ padding: "6px 8px" }}>
              {row.confidence != null ? <ConfidenceBadge score={row.confidence} /> : "—"}
            </td>
            <td style={{ padding: "6px 8px", color: row.needsAttention ? "#b45309" : "#64748b" }}>
              {row.status || (row.needsAttention ? "attention" : "ok")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeltaTable({ rows = [], emptyMessage = "No benchmark deltas" }) {
  if (!rows.length) {
    return <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>{emptyMessage}</p>;
  }
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
          <th style={{ padding: "6px 8px" }}>Item</th>
          <th style={{ padding: "6px 8px" }}>Expected</th>
          <th style={{ padding: "6px 8px" }}>Actual</th>
          <th style={{ padding: "6px 8px" }}>Category</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.fieldKey || row.message} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{row.label || row.fieldKey}</td>
            <td style={{ padding: "6px 8px" }}>{row.expected ?? "—"}</td>
            <td style={{ padding: "6px 8px" }}>{row.actual ?? "—"}</td>
            <td style={{ padding: "6px 8px", color: "#64748b" }}>{row.category || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VariantTable({ rows = [] }) {
  if (!rows.length) {
    return <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>No variants extracted</p>;
  }
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
          <th style={{ padding: "6px 8px" }}>#</th>
          <th style={{ padding: "6px 8px" }}>Variant</th>
          <th style={{ padding: "6px 8px" }}>Price</th>
          <th style={{ padding: "6px 8px" }}>Battery</th>
          <th style={{ padding: "6px 8px" }}>Range</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.index} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: "6px 8px" }}>{row.index + 1}</td>
            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{row.name || "—"}</td>
            <td style={{ padding: "6px 8px" }}>{row.price ?? "—"}</td>
            <td style={{ padding: "6px 8px" }}>{row.battery ?? "—"}</td>
            <td style={{ padding: "6px 8px" }}>{row.range ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PublishReadinessSection({ section, recommendation }) {
  const recCode = section?.recommendation || recommendation?.code;
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {recCode && (
          <span style={adminBadge(recommendationTone(recCode))}>
            {recCode} — {RECOMMENDATION_LABELS[recCode]}
          </span>
        )}
        <span style={adminBadge(section?.qualityGateStatus === "passed" ? "green" : "red")}>
          Gates: {section?.qualityGateStatus === "passed" ? "Passed" : "Failed"}
          {section?.qualityGateFailureCount ? ` (${section.qualityGateFailureCount})` : ""}
        </span>
        {section?.publishProbability != null && (
          <span style={adminBadge(section.publishProbability >= 75 ? "green" : "yellow")}>
            Publish probability: {section.publishProbability}%
          </span>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Review time</div>
          <strong>{section?.reviewTimeMinutes ?? "—"} min</strong>
        </div>
        <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Correction time</div>
          <strong>{section?.correctionTimeMinutes ?? "—"} min</strong>
        </div>
        <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Total effort</div>
          <strong>{section?.totalEffortMinutes ?? "—"} min</strong>
        </div>
        <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Est. corrections</div>
          <strong>{section?.estimatedCorrections ?? "—"}</strong>
        </div>
      </div>
      {!section?.hasGolden && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "#b45309" }}>
          No golden dossier — correction estimate is heuristic only.
        </p>
      )}
    </div>
  );
}

function HiddenBenchmarkSection({ section }) {
  if (!section?.hasGolden) {
    return (
      <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
        Golden dossier unavailable — benchmark deltas cannot be computed.
      </p>
    );
  }

  const groups = [
    { key: "variant", label: "Variant mismatches", rows: section.variant },
    { key: "pricing", label: "Pricing gaps", rows: section.pricing },
    { key: "missing", label: "Missing fields", rows: section.missing },
    { key: "features", label: "Feature mismatches", rows: section.features },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
        Always visible — includes benchmark gaps hidden from attention-only field sections (
        {section.hiddenCount ?? 0} hidden delta(s)).
      </p>
      {groups.map((g) => (
        <div key={g.key}>
          <strong style={{ fontSize: 14 }}>{g.label}</strong>
          <div style={{ marginTop: 8 }}>
            <DeltaTable rows={g.rows} emptyMessage={`No ${g.label.toLowerCase()}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VehicleCreationReviewDossier({
  dossier,
  jobStatus,
  attentionOnly = true,
  onAttentionOnlyChange,
}) {
  const [expandedSections, setExpandedSections] = useState({
    publishReadiness: true,
    hiddenBenchmarkDeltas: true,
  });

  const sections = dossier?.sections || {};
  const sectionOrder = dossier?.sectionOrder || Object.keys(sections);
  const alwaysVisible = new Set(["publishReadiness", "hiddenBenchmarkDeltas"]);

  const visibleSectionIds = useMemo(() => {
    return sectionOrder.filter((id) => {
      const section = sections[id];
      if (!section) return false;
      if (alwaysVisible.has(id)) return true;
      if (!attentionOnly) return true;
      if (id === "variantTable") return (section.totalVariants || section.rows?.length || 0) > 0;
      if (id === "confidence") return true;
      return (section.rows?.length || section.count || 0) > 0;
    });
  }, [sectionOrder, sections, attentionOnly]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const recommendation = dossier?.recommendation;
  const metrics = dossier?.metrics || {};

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
        {jobStatus && (
          <span style={adminBadge("blue")}>{STATUS_LABELS[jobStatus] || jobStatus}</span>
        )}
        {dossier?.agentVersion && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Agent {dossier.agentVersion}</span>
        )}
        <label style={{ marginLeft: "auto", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => onAttentionOnlyChange?.(e.target.checked)}
          />
          Show attention items only (benchmark deltas always shown)
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <div style={{ padding: "10px 12px", background: "#eff6ff", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Review time</div>
          <strong>{metrics.reviewTimeMinutes ?? dossier?.estimatedReviewMinutes ?? "—"} min</strong>
        </div>
        <div style={{ padding: "10px 12px", background: "#fef9c3", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Correction time</div>
          <strong>{metrics.correctionTimeMinutes ?? dossier?.estimatedCorrectionMinutes ?? "—"} min</strong>
        </div>
        <div style={{ padding: "10px 12px", background: "#f0fdf4", borderRadius: 8 }}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Total effort</div>
          <strong>{metrics.totalEffortMinutes ?? dossier?.estimatedTotalEffortMinutes ?? "—"} min</strong>
        </div>
      </div>

      {recommendation?.reason && (
        <p style={{ color: "#475569", marginTop: 0, marginBottom: 16, fontSize: 14 }}>
          {recommendation.reason}
        </p>
      )}

      {visibleSectionIds.map((id) => {
        const section = sections[id];
        const isExpanded = expandedSections[id] !== false;
        const itemCount =
          section.count ??
          section.totalVariants ??
          section.hiddenCount ??
          section.rows?.length ??
          (id === "confidence" || id === "publishReadiness" ? 1 : 0);

        return (
          <div
            key={id}
            style={{
              ...sectionCard,
              ...(alwaysVisible.has(id) ? { borderColor: "#cbd5e1", background: "#fafbfc" } : {}),
            }}
          >
            <button
              type="button"
              onClick={() => toggleSection(id)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <strong style={{ fontSize: 15 }}>
                {section.label}
                {alwaysVisible.has(id) && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                    always visible
                  </span>
                )}
              </strong>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                {itemCount} item{itemCount === 1 ? "" : "s"} {isExpanded ? "▾" : "▸"}
              </span>
            </button>

            {isExpanded && (
              <div style={{ marginTop: 12 }}>
                {id === "publishReadiness" && (
                  <PublishReadinessSection section={section} recommendation={recommendation} />
                )}
                {id === "hiddenBenchmarkDeltas" && <HiddenBenchmarkSection section={section} />}
                {id === "variantTable" && <VariantTable rows={section.rows} />}
                {id === "conflicts" && (
                  <FieldTable
                    rows={section.rows.map((r) => ({
                      fieldKey: r.fieldKey,
                      label: r.label,
                      value: r.message,
                      needsAttention: true,
                    }))}
                    emptyMessage="No conflicts"
                  />
                )}
                {id === "missingFields" && (
                  <FieldTable
                    rows={section.rows.map((r) => ({
                      fieldKey: r.fieldKey,
                      label: r.label,
                      value: "Missing",
                      status: r.status,
                      needsAttention: true,
                    }))}
                    emptyMessage="No missing required fields"
                  />
                )}
                {id === "confidence" && (
                  <div style={{ fontSize: 14, color: "#334155" }}>
                    <p style={{ margin: "0 0 8px" }}>
                      Overall score:{" "}
                      {section.score != null ? (
                        <ConfidenceBadge score={section.score} />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                      Attention fields: {section.attentionCount ?? 0}
                    </p>
                    <p style={{ margin: 0 }}>
                      Evidence records: {section.evidenceRecordCount ?? 0}
                    </p>
                  </div>
                )}
                {["vehicleSummary", "pricingSummary", "batteryRange", "charging", "features"].includes(
                  id
                ) && (
                  <FieldTable
                    rows={section.rows}
                    emptyMessage={
                      attentionOnly ? "No attention items in this section" : "No fields"
                    }
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {dossier?.qualityGates && (
        <div style={{ ...sectionCard, background: "#f8fafc" }}>
          <strong>Quality gates {dossier.qualityGates.goldenAware ? "(golden-aware)" : ""}</strong>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: dossier.qualityGates.passed ? "#166534" : "#b45309",
            }}
          >
            {dossier.qualityGates.passed ? "Passed" : `${dossier.qualityGates.failureCount} failure(s)`}
          </p>
          {!dossier.qualityGates.passed && dossier.qualityGates.failures?.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, color: "#64748b" }}>
              {dossier.qualityGates.failures.map((f, i) => (
                <li key={i}>{typeof f === "string" ? f : f.message || JSON.stringify(f)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
