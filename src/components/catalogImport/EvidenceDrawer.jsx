import { useMemo } from "react";

import { FIELD_LABELS } from "../../catalogAcquisition/extractionSchema.js";
import { EVIDENCE_SOURCE_TYPE } from "../../catalogAcquisition/constants.js";
import ConfidenceBadge from "./ConfidenceBadge.jsx";

const SOURCE_LABELS = {
  [EVIDENCE_SOURCE_TYPE.OEM_PDF]: "OEM PDF",
  [EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]: "OEM Website",
  [EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE]: "Trusted Reference",
  [EVIDENCE_SOURCE_TYPE.SEARCH_RESULT]: "Search Result",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end",
};

const drawerStyle = {
  width: "min(420px, 100vw)",
  height: "100%",
  background: "#fff",
  boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.12)",
  padding: "20px 22px",
  overflowY: "auto",
};

export default function EvidenceDrawer({
  open,
  fieldKey,
  mergedField,
  onClose,
  onResolveConflict,
  readOnly = false,
}) {
  const label = FIELD_LABELS[fieldKey] || fieldKey;

  const statusColor = useMemo(() => {
    if (!mergedField?.status) return "#64748b";
    if (mergedField.status === "conflict") return "#dc2626";
    if (mergedField.status === "resolved") return "#16a34a";
    return "#2563eb";
  }, [mergedField?.status]);

  if (!open || !fieldKey) return null;

  return (
    <div
      style={overlayStyle}
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose?.()}
    >
      <aside
        style={drawerStyle}
        role="dialog"
        aria-label={`Evidence for ${label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Evidence
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 18 }}>{label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence drawer"
            style={closeBtnStyle}
          >
            ×
          </button>
        </div>

        <section style={{ marginTop: 20 }}>
          <p style={sectionLabel}>Final value</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800 }}>
            {mergedField?.value ?? "—"}
          </p>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <ConfidenceBadge score={mergedField?.confidence} />
            <span style={{ fontSize: 12, color: statusColor, fontWeight: 700 }}>
              {mergedField?.status || "unknown"}
              {mergedField?.manualReview ? " · manual review" : ""}
            </span>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <p style={sectionLabel}>Sources</p>
          {!mergedField?.sources?.length ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No evidence records for this field.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
              {mergedField.sources.map((src, i) => (
                <li
                  key={`${src.sourceType}-${i}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>
                      {SOURCE_LABELS[src.sourceType] || src.sourceType}
                    </strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      Trust {src.trustScore}
                    </span>
                  </div>
                  {src.sourceName && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>
                      {src.sourceName}
                    </p>
                  )}
                  <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700 }}>
                    {src.fieldValue}
                  </p>
                  {src.sourceUrl && (
                    <a
                      href={src.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: "#2563eb" }}
                    >
                      View source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {mergedField?.status === "conflict" && mergedField?.sourceValues?.length > 1 && (
          <section style={{ marginTop: 24 }}>
            <p style={sectionLabel}>Resolve conflict</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px" }}>
              Select the value to use for publish.
            </p>
            {!readOnly &&
              mergedField.sourceValues.map((group) => (
                <button
                  key={group.value}
                  type="button"
                  style={resolveBtnStyle}
                  onClick={() => onResolveConflict?.(fieldKey, group.value)}
                >
                  Use <strong>{group.value}</strong>
                  <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                    ({group.sources?.length || 0} sources)
                  </span>
                </button>
              ))}
          </section>
        )}
      </aside>
    </div>
  );
}

const sectionLabel = {
  margin: 0,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#94a3b8",
  fontWeight: 800,
};

const closeBtnStyle = {
  border: "none",
  background: "#f1f5f9",
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 20,
  cursor: "pointer",
  lineHeight: 1,
};

const resolveBtnStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  marginBottom: 8,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
