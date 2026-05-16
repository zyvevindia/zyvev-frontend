import { useState } from "react";
import {
  approveJob,
  rejectJob,
  needsManualReview,
  returnToPending,
} from "../../services/editorial/editorialApi";
import {
  btnPrimary,
  btnSecondary,
  btnDanger,
  card,
  h2,
  editorialColors,
} from "./editorialStyles";

export default function WorkflowActions({ jobId, lifecycle, onDone }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function run(fn) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg("Action completed.");
      onDone?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={h2}>Approval workflow</h2>
      <p style={{ fontSize: 13, color: editorialColors.muted }}>
        Current: <strong>{lifecycle}</strong> — no direct Tier-1 overwrite
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reviewer notes (optional)"
        rows={2}
        style={{
          width: "100%",
          marginTop: 8,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          fontSize: 13,
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={busy || lifecycle === "approved"}
          onClick={() => run(() => approveJob(jobId, notes))}
        >
          Approve draft
        </button>
        <button
          type="button"
          style={btnDanger}
          disabled={busy}
          onClick={() => run(() => rejectJob(jobId, notes))}
        >
          Reject
        </button>
        <button
          type="button"
          style={btnSecondary}
          disabled={busy}
          onClick={() => run(() => needsManualReview(jobId, notes))}
        >
          Needs manual review
        </button>
        <button
          type="button"
          style={btnSecondary}
          disabled={busy}
          onClick={() => run(() => returnToPending(jobId, notes))}
        >
          Return to pending
        </button>
      </div>
      {msg && (
        <p style={{ marginTop: 8, fontSize: 13, color: editorialColors.muted }}>
          {msg}
        </p>
      )}
    </div>
  );
}
