import { useMemo, useState } from "react";

import {
  EXTRACTION_FIELD_GROUPS,
  FIELD_LABELS,
  flattenExtractionDraft,
  formatFieldDisplay,
  fieldNeedsAttention,
  LOW_CONFIDENCE_THRESHOLD,
} from "../../catalogAcquisition/extractionSchema.js";
import { confidenceBand } from "../../catalogAcquisition/confidence.js";
import { EVIDENCE_FIELD_STATUS } from "../../catalogAcquisition/constants.js";
import ConfidenceBadge from "./ConfidenceBadge.jsx";
import EvidenceDrawer from "./EvidenceDrawer.jsx";

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

export default function CatalogImportReviewPanel({
  extractedVehicle = {},
  reviewedVehicle = {},
  evidenceSummary = {},
  onChange,
  onResolveConflict,
  readOnly = false,
}) {
  const extractedFlat = useMemo(
    () => flattenExtractionDraft(extractedVehicle),
    [extractedVehicle]
  );
  const reviewedFlat = useMemo(
    () => flattenExtractionDraft(reviewedVehicle),
    [reviewedVehicle]
  );

  const mergedEvidence = useMemo(
    () => evidenceSummary || extractedVehicle.evidence || {},
    [evidenceSummary, extractedVehicle.evidence]
  );

  const [edits, setEdits] = useState({});
  const [drawerField, setDrawerField] = useState(null);
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(true);

  const getEditableValue = (key) => {
    if (edits[key] !== undefined) return edits[key];
    const r = reviewedFlat[key];
    if (r?.value !== undefined && r?.value !== null) return r.value;
    return extractedFlat[key]?.value ?? "";
  };

  const handleEdit = (key, value) => {
    const nextEdits = { ...edits, [key]: value };
    setEdits(nextEdits);

    const nextReviewed = structuredClone(reviewedVehicle);
    for (const group of EXTRACTION_FIELD_GROUPS) {
      if (!group.fields.includes(key)) continue;
      nextReviewed[group.id] = nextReviewed[group.id] || {};
      nextReviewed[group.id][key] = {
        value,
        confidence: Math.max(reviewedFlat[key]?.confidence ?? 70, 85),
        accepted: true,
      };
    }
    onChange?.(nextReviewed);
  };

  const attentionKeys = useMemo(() => {
    const keys = new Set();
    for (const group of EXTRACTION_FIELD_GROUPS) {
      for (const key of group.fields) {
        if (fieldNeedsAttention(key, mergedEvidence[key], extractedFlat[key])) {
          keys.add(key);
        }
      }
    }
    return keys;
  }, [mergedEvidence, extractedFlat]);

  const conflictCount = useMemo(
    () =>
      Object.values(mergedEvidence).filter(
        (m) => m?.status === EVIDENCE_FIELD_STATUS.CONFLICT
      ).length,
    [mergedEvidence]
  );

  const visibleField = (key) => {
    if (!needsAttentionOnly) return true;
    return attentionKeys.has(key);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={needsAttentionOnly}
            onChange={(e) => setNeedsAttentionOnly(e.target.checked)}
          />
          <strong>Needs attention only</strong>
          <span style={{ color: "#64748b" }}>
            ({attentionKeys.size} field{attentionKeys.size !== 1 ? "s" : ""} · conflicts, low
            confidence &lt; {LOW_CONFIDENCE_THRESHOLD}, required missing)
          </span>
        </label>
      </div>

      {conflictCount > 0 && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          {conflictCount} field{conflictCount > 1 ? "s" : ""} with source conflicts — open
          evidence drawer to resolve.
        </div>
      )}

      {needsAttentionOnly && attentionKeys.size === 0 && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            fontSize: 13,
          }}
        >
          No fields need attention — all extracted values meet confidence thresholds. Uncheck
          filter to view all fields.
        </div>
      )}

      {EXTRACTION_FIELD_GROUPS.map((group) => {
        const visibleFields = group.fields.filter(visibleField);
        if (!visibleFields.length) return null;

        return (
          <section key={group.id}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>
              {group.label}
            </h3>
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 720,
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Field</th>
                    <th style={thStyle}>Merged value</th>
                    <th style={thStyle}>Editable</th>
                    <th style={thStyle}>Confidence</th>
                    <th style={thStyle}>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFields.map((key) => {
                    const ext = extractedFlat[key];
                    const evidence = mergedEvidence[key];
                    const band = confidenceBand(evidence?.confidence ?? ext?.confidence);
                    const isConflict = evidence?.status === EVIDENCE_FIELD_STATUS.CONFLICT;
                    const highlight = band === "red" || isConflict;

                    return (
                      <tr
                        key={key}
                        style={{
                          background: highlight ? "#fef2f2" : "transparent",
                        }}
                      >
                        <td style={tdStyle}>
                          <strong>{FIELD_LABELS[key] || key}</strong>
                          {isConflict && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                color: "#dc2626",
                                fontWeight: 800,
                              }}
                            >
                              CONFLICT
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {formatFieldDisplay(
                            evidence?.value != null
                              ? { value: evidence.value, confidence: evidence.confidence }
                              : ext
                          )}
                        </td>
                        <td style={tdStyle}>
                          {readOnly ? (
                            formatFieldDisplay(reviewedFlat[key])
                          ) : (
                            <input
                              style={inputStyle}
                              value={getEditableValue(key)}
                              onChange={(e) => handleEdit(key, e.target.value)}
                              aria-label={`Edit ${FIELD_LABELS[key] || key}`}
                            />
                          )}
                        </td>
                        <td style={tdStyle}>
                          <ConfidenceBadge
                            score={evidence?.confidence ?? ext?.confidence}
                            compact
                          />
                        </td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => setDrawerField(key)}
                            style={evidenceBtnStyle}
                            aria-label={`View evidence for ${FIELD_LABELS[key] || key}`}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {Array.isArray(extractedVehicle.variants) &&
        extractedVehicle.variants.length > 0 && (
          <section>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>
              Variants ({extractedVehicle.variants.length})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              {extractedVehicle.variants.map((v, i) => (
                <li key={i}>
                  <strong>{v.variantName}</strong>
                  {" — "}
                  {formatFieldDisplay(v.price)}
                  {v.battery ? ` · ${formatFieldDisplay(v.battery)} kWh` : ""}
                  {v.range ? ` · ${formatFieldDisplay(v.range)} km` : ""}
                  {v.featureHighlights?.value
                    ? ` · ${v.featureHighlights.value}`
                    : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

      <EvidenceDrawer
        open={Boolean(drawerField)}
        fieldKey={drawerField}
        mergedField={drawerField ? mergedEvidence[drawerField] : null}
        onClose={() => setDrawerField(null)}
        onResolveConflict={(fieldKey, value) => {
          onResolveConflict?.(fieldKey, value);
          setDrawerField(null);
        }}
        readOnly={readOnly}
      />
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#64748b",
};

const tdStyle = {
  padding: "10px 12px",
  borderTop: "1px solid #f1f5f9",
  verticalAlign: "top",
};

const evidenceBtnStyle = {
  padding: "4px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  color: "#2563eb",
};
