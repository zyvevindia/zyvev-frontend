/**
 * Up to 2 decision chips for listing/compare cards.
 */

const row = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "10px",
};

const chip = {
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "600",
  background: "rgba(255,255,255,0.92)",
  color: "#1e3a8a",
  border: "1px solid rgba(147,197,253,0.9)",
  boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
  letterSpacing: "0.2px",
  lineHeight: 1.3,
};

export default function CatalogListingSignals({
  signals = [],
}) {
  if (!signals.length) return null;

  return (
    <div
      style={row}
      aria-label="EV highlights"
    >
      {signals.map((s) => (
        <span key={s.id} style={chip}>
          {s.label}
        </span>
      ))}
    </div>
  );
}
