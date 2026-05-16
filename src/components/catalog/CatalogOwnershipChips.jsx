/**
 * Lightweight ownership confidence chips (listing/compare).
 */

const row = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "8px",
};

const chip = {
  fontSize: "10px",
  fontWeight: "600",
  padding: "4px 8px",
  borderRadius: "6px",
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
  letterSpacing: "0.2px",
};

export default function CatalogOwnershipChips({
  chips = [],
}) {
  if (!chips.length) return null;
  return (
    <div style={row} aria-label="Ownership confidence">
      {chips.map((c) => (
        <span key={c.id} style={chip}>
          {c.label}
        </span>
      ))}
    </div>
  );
}
