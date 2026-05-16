/**
 * Confidence score explanation for ranked vehicles.
 */

const note = {
  fontSize: "0.85rem",
  color: "#64748b",
  marginTop: "0.5rem",
  lineHeight: 1.5,
};

export function confidenceLabel(confidence) {
  const c = String(confidence || "").toLowerCase();
  if (c === "high") return "High confidence";
  if (c === "medium") return "Medium confidence";
  if (c === "low") return "Lower confidence — verify locally";
  return null;
}

export default function ConfidenceExplainer({ showLegend = true }) {
  if (!showLegend) return null;

  return (
    <p style={note}>
      <strong>Confidence</strong> reflects how complete catalog signals are for
      this pick (range, charging, pricing), not a quality rating. Lower
      confidence means fewer data points — use test drives and dealer quotes
      before deciding.
    </p>
  );
}
