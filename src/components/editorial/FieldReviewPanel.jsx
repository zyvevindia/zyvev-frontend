import { useState } from "react";
import ProvenanceBadge from "./ProvenanceBadge";
import { patchJobField } from "../../services/editorial/editorialApi";
import {
  btnPrimary,
  btnSecondary,
  btnDanger,
  card,
  h2,
  table,
  td,
  th,
  editorialColors,
} from "./editorialStyles";

export default function FieldReviewPanel({
  jobId,
  fieldSummary,
  onRefresh,
}) {
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const fields = fieldSummary?.fields || [];
  const warnings = [
    ...(fieldSummary?.unsupportedWarnings || []),
    ...(fieldSummary?.missingFlatKeys || []).map((k) => ({
      field: k,
      reason: "missing_flat_key",
    })),
  ];

  async function runAction(fieldPath, action, value) {
    setBusy(true);
    setError(null);
    try {
      await patchJobField(jobId, { fieldPath, action, value });
      setEditing(null);
      onRefresh?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={h2}>Structured field review</h2>
      {error && (
        <p style={{ color: editorialColors.danger, fontSize: 13 }}>{error}</p>
      )}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          <strong>Warnings:</strong>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>
                {w.field}: {w.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Field</th>
            <th style={th}>Value</th>
            <th style={th}>Provenance</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.path}>
              <td style={td}>
                <code style={{ fontSize: 12 }}>{f.path}</code>
              </td>
              <td style={td}>
                {editing === f.path ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{ width: "100%", padding: 4 }}
                  />
                ) : (
                  String(f.value)
                )}
              </td>
              <td style={td}>
                <ProvenanceBadge metadata={f.metadata} />
              </td>
              <td style={td}>
                {editing === f.path ? (
                  <>
                    <button
                      type="button"
                      style={{ ...btnPrimary, marginRight: 4 }}
                      disabled={busy}
                      onClick={() =>
                        runAction(f.path, "edit", Number(editValue) || editValue)
                      }
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      style={btnSecondary}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      style={{ ...btnSecondary, marginRight: 4, fontSize: 11 }}
                      onClick={() => {
                        setEditing(f.path);
                        setEditValue(String(f.value));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...btnSecondary, marginRight: 4, fontSize: 11 }}
                      disabled={busy}
                      onClick={() => runAction(f.path, "approve_field")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      style={{ ...btnDanger, fontSize: 11 }}
                      disabled={busy}
                      onClick={() => runAction(f.path, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
