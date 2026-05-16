import { useState } from "react";
import {
  publishStaging,
  rollbackStaging,
} from "../../services/editorial/editorialApi";
import {
  btnPrimary,
  btnDanger,
  btnSecondary,
  card,
  h2,
  table,
  td,
  th,
  muted,
  editorialColors,
} from "./editorialStyles";

export default function StagedManifestList({ staged, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const manifests = staged?.manifests || [];
  const approved = staged?.approvedJobs || [];

  async function handlePublish() {
    if (
      !window.confirm(
        "Copy approved drafts to staging/published? Tier-1 catalog will NOT change."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await publishStaging();
      setMsg(`Published ${res.data.count} item(s) to staging.`);
      onRefresh?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRollback(manifestId) {
    if (!window.confirm(`Rollback manifest ${manifestId}?`)) return;
    setBusy(true);
    try {
      await rollbackStaging(manifestId);
      setMsg(`Rolled back ${manifestId}`);
      onRefresh?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={card}>
        <h2 style={h2}>Staged publish</h2>
        <p style={muted}>
          Staging archive only — production Tier-1 variants are never overwritten
          by this action.
        </p>
        <button
          type="button"
          style={{ ...btnPrimary, marginTop: 8 }}
          disabled={busy}
          onClick={handlePublish}
        >
          Publish approved → staging
        </button>
        {msg && (
          <p style={{ marginTop: 8, fontSize: 13 }}>{msg}</p>
        )}
      </div>

      <div style={card}>
        <h2 style={h2}>Approved job readiness</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Job</th>
              <th style={th}>Variant</th>
              <th style={th}>Provenance</th>
              <th style={th}>Ready</th>
            </tr>
          </thead>
          <tbody>
            {approved.map((j) => (
              <tr key={j.jobId}>
                <td style={td}>{j.jobId}</td>
                <td style={td}>{j.tier1VariantSlug}</td>
                <td style={td}>
                  {j.provenanceComplete ? "complete" : "gaps"}
                </td>
                <td style={td}>
                  {j.readyForStaging ? "yes" : "no"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h2 style={h2}>Publish manifests</h2>
        {manifests.length === 0 ? (
          <p style={muted}>No manifests yet.</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Manifest</th>
                <th style={th}>Generated</th>
                <th style={th}>Items</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {manifests.map((m) => (
                <tr key={m.manifestId}>
                  <td style={td}>{m.manifestId}</td>
                  <td style={td}>
                    {m.generatedAt
                      ? new Date(m.generatedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td style={td}>{m.itemCount}</td>
                  <td style={td}>
                    <button
                      type="button"
                      style={btnDanger}
                      disabled={busy}
                      onClick={() => handleRollback(m.manifestId)}
                    >
                      Rollback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
