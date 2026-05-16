import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchEditorialJob,
  fetchJobDiff,
  fetchExtract,
  fetchJobRevisions,
} from "../../../services/editorial/editorialApi";
import ExtractionViewer from "../../../components/editorial/ExtractionViewer";
import FieldReviewPanel from "../../../components/editorial/FieldReviewPanel";
import DiffReviewPanel from "../../../components/editorial/DiffReviewPanel";
import WorkflowActions from "../../../components/editorial/WorkflowActions";
import { card, h1, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function JobDetailPage() {
  const { jobId } = useParams();
  const [detail, setDetail] = useState(null);
  const [diff, setDiff] = useState(null);
  const [extract, setExtract] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("fields");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [jobRes, diffRes, revRes] = await Promise.all([
        fetchEditorialJob(jobId),
        fetchJobDiff(jobId),
        fetchJobRevisions(jobId),
      ]);
      setDetail(jobRes.data);
      setDiff(diffRes.data);
      setRevisions(revRes.data?.revisions || []);

      if (jobRes.data?.job?.sourceId) {
        try {
          const ex = await fetchExtract(jobRes.data.job.sourceId);
          setExtract(ex.data);
        } catch {
          setExtract(null);
        }
      }
    } catch (e) {
      setError(e.message);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <p style={{ color: editorialColors.danger }}>{error}</p>;
  }

  if (!detail) {
    return <p>Loading job…</p>;
  }

  const { job, fieldSummary, schemaValidation } = detail;

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      style={{
        padding: "8px 14px",
        marginRight: 8,
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: tab === id ? "#2563eb" : "#e2e8f0",
        color: tab === id ? "#fff" : "#0f172a",
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <Link to="/admin/editorial" style={{ fontSize: 13 }}>
        ← Dashboard
      </Link>
      <h1 style={{ ...h1, marginTop: 8 }}>{job.tier1VariantSlug}</h1>
      <p style={muted}>
        <code>{job.jobId}</code> · {job.lifecycle}
        {schemaValidation && !schemaValidation.ok && (
          <span style={{ color: editorialColors.warning }}>
            {" "}
            · {schemaValidation.provenanceGaps?.length} provenance gap(s)
          </span>
        )}
      </p>

      <WorkflowActions
        jobId={jobId}
        lifecycle={job.lifecycle}
        onDone={load}
      />

      <div style={{ margin: "16px 0" }}>
        {tabBtn("fields", "Fields")}
        {tabBtn("extract", "Raw extract")}
        {tabBtn("diff", "Diff vs Tier-1")}
        {tabBtn("history", "Revisions")}
      </div>

      {tab === "fields" && (
        <FieldReviewPanel
          jobId={jobId}
          fieldSummary={fieldSummary}
          onRefresh={load}
        />
      )}
      {tab === "extract" && <ExtractionViewer extractData={extract} />}
      {tab === "diff" && <DiffReviewPanel diff={diff} />}
      {tab === "history" && (
        <div style={card}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Revision history</h2>
          {revisions.length === 0 ? (
            <p style={muted}>No revisions recorded yet.</p>
          ) : (
            <ul style={{ fontSize: 13 }}>
              {revisions.map((r) => (
                <li key={r.revisionId} style={{ marginBottom: 8 }}>
                  <strong>{r.action}</strong> — {r.summary}
                  <br />
                  <span style={muted}>
                    {r.editor} · {new Date(r.recordedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
