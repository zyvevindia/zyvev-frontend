import ProvenanceBadge from "./ProvenanceBadge";
import {
  card,
  h2,
  muted,
  table,
  td,
  th,
  editorialColors,
} from "./editorialStyles";

const STATE_BG = {
  added: editorialColors.added,
  removed: editorialColors.removed,
  changed: editorialColors.changed,
};

export default function DiffReviewPanel({ diff }) {
  if (!diff) return null;

  if (diff.error) {
    return (
      <div style={card}>
        <p style={{ color: editorialColors.danger }}>
          Diff unavailable: {diff.error}
        </p>
      </div>
    );
  }

  const changes = diff.changes || [];

  return (
    <div style={card}>
      <h2 style={h2}>Tier-1 diff review</h2>
      <p style={muted}>
        {diff.tier1VariantSlug} · {diff.changeCount} change(s) — modified{" "}
        {diff.summary?.modified}, added {diff.summary?.draftOnly}, removed{" "}
        {diff.summary?.publishedOnly}
      </p>
      {changes.length === 0 ? (
        <p style={{ marginTop: 12 }}>No comparable differences detected.</p>
      ) : (
        <table style={{ ...table, marginTop: 12 }}>
          <thead>
            <tr>
              <th style={th}>Field</th>
              <th style={th}>Tier-1 (current)</th>
              <th style={th}>Proposed (draft)</th>
              <th style={th}>State</th>
              <th style={th}>Provenance</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr
                key={c.field}
                style={{
                  background:
                    STATE_BG[c.display?.state] || "transparent",
                }}
              >
                <td style={td}>
                  <code style={{ fontSize: 12 }}>{c.field}</code>
                </td>
                <td style={td}>
                  {c.oldValue === undefined ? "—" : String(c.oldValue)}
                </td>
                <td style={td}>
                  {c.newValue === undefined ? "—" : String(c.newValue)}
                </td>
                <td style={td}>{c.changeType}</td>
                <td style={td}>
                  <ProvenanceBadge metadata={c.provenance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
