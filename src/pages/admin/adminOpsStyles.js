export const adminCard = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

export const adminBadge = (tone = "neutral") => {
  const map = {
    green: { bg: "#dcfce7", fg: "#166534" },
    yellow: { bg: "#fef9c3", fg: "#854d0e" },
    red: { bg: "#fee2e2", fg: "#991b1b" },
    neutral: { bg: "#f1f5f9", fg: "#475569" },
    blue: { bg: "#dbeafe", fg: "#1d4ed8" },
  };
  const c = map[tone] || map.neutral;
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: c.bg,
    color: c.fg,
  };
};

export const statusTone = {
  READY: "green",
  PARTIAL: "yellow",
  NEEDS_REVIEW: "red",
  CALIBRATED: "green",
  ACCEPTABLE: "yellow",
  NEEDS_TUNING: "red",
  STRONG: "green",
  green: "green",
  yellow: "yellow",
  red: "red",
};
