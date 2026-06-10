import { confidenceBand, confidenceLabel } from "../../catalogAcquisition/confidence.js";

const BAND_STYLE = {
  green: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  yellow: { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  red: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

export default function ConfidenceBadge({ score, compact = false }) {
  const band = confidenceBand(score);
  const style = BAND_STYLE[band] || BAND_STYLE.red;
  const label = confidenceLabel(score);

  return (
    <span
      title={`Confidence: ${score ?? 0}%`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: compact ? 10 : 11,
        fontWeight: 700,
        padding: compact ? "2px 6px" : "3px 8px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {compact ? `${score ?? 0}%` : `${label} · ${score ?? 0}%`}
    </span>
  );
}
