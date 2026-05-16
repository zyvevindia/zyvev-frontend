import { badge, editorialColors } from "./editorialStyles";

const METHOD_COLORS = {
  MANUAL_ENTRY: "#dbeafe",
  TEXT_EXTRACTION: "#e0e7ff",
  TABLE_EXTRACTION: "#d1fae5",
  OCR_EXTRACTION: "#fef3c7",
};

export default function ProvenanceBadge({ metadata }) {
  if (!metadata) return <span style={{ color: "#94a3b8" }}>—</span>;

  const method = metadata.extractionMethod || "UNKNOWN";
  const conf = metadata.confidenceLevel || "?";
  const review = metadata.reviewStatus || "pending";

  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      <span style={badge(METHOD_COLORS[method] || "#f1f5f9")}>{method}</span>
      <span
        style={badge(
          conf === "HIGH"
            ? "#d1fae5"
            : conf === "LOW"
              ? "#fee2e2"
              : "#fef3c7"
        )}
      >
        {conf}
      </span>
      <span style={badge("#f1f5f9")}>{review}</span>
      {metadata.pageHint && (
        <span style={{ fontSize: 11, color: editorialColors.muted }}>
          p.{metadata.pageHint}
        </span>
      )}
    </span>
  );
}
