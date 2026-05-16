/**
 * Ownership practicality notes for guide pages.
 */

const box = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  padding: "1rem 1.25rem",
  marginBottom: "1.5rem",
};

export default function OwnershipPracticality({ bullets = [] }) {
  const items =
    bullets.length > 0
      ? bullets
      : [
          "Factor home or workplace charging into total cost — not just ex-showroom price.",
          "Service network density varies by brand and city; confirm nearest workshop.",
          "Warranty and battery terms differ by variant — read the fine print before booking.",
        ];

  return (
    <aside style={box} aria-label="Ownership practicality">
      <strong style={{ display: "block", marginBottom: "0.5rem", color: "#1e40af" }}>
        Ownership practicality
      </strong>
      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#1e3a8a", fontSize: "0.9rem", lineHeight: 1.6 }}>
        {items.map((b) => (
          <li key={b.slice(0, 40)}>{b}</li>
        ))}
      </ul>
    </aside>
  );
}
