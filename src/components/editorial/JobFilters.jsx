import { btnSecondary, card, h2 } from "./editorialStyles";

const STATUSES = [
  "",
  "pending_review",
  "needs_manual_review",
  "approved",
  "rejected",
  "staged",
];

const BRANDS = ["", "tata", "mg", "mahindra", "hyundai", "byd"];

export default function JobFilters({ filters, onChange }) {
  const selectStyle = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    marginRight: 8,
  };

  return (
    <div style={card}>
      <h2 style={h2}>Filters</h2>
      <select
        style={selectStyle}
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s || "all"} value={s}>
            {s || "All statuses"}
          </option>
        ))}
      </select>
      <select
        style={selectStyle}
        value={filters.brand || ""}
        onChange={(e) => onChange({ ...filters, brand: e.target.value })}
      >
        {BRANDS.map((b) => (
          <option key={b || "all"} value={b}>
            {b || "All OEMs"}
          </option>
        ))}
      </select>
      <select
        style={selectStyle}
        value={filters.confidenceLevel || ""}
        onChange={(e) =>
          onChange({ ...filters, confidenceLevel: e.target.value })
        }
      >
        <option value="">All confidence</option>
        <option value="HIGH">HIGH</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="LOW">LOW</option>
      </select>
      <button
        type="button"
        style={{ ...btnSecondary, marginLeft: 8 }}
        onClick={() => onChange({})}
      >
        Clear
      </button>
    </div>
  );
}

