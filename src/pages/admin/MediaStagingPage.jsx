import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { buildMediaStagingReport, approveStagingItem, upsertStagingItem, listStagingQueue } from "../../ops/mediaStagingOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import { adminBadge, statusTone } from "./adminOpsStyles";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

export default function MediaStagingPage() {
  const [report, setReport] = useState(null);
  const [queue, setQueue] = useState(() => listStagingQueue());
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setReport(buildMediaStagingReport());
    setQueue(listStagingQueue());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStageNote = (familySlug) => {
    upsertStagingItem({
      familySlug,
      role: "core",
      note: "Manual review queued",
      candidateConfidence: 50,
    });
    setQueue(listStagingQueue());
    load();
  };

  const handleApprove = (id) => {
    approveStagingItem(id);
    setQueue(listStagingQueue());
    load();
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/media-health">Media health</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Media staging</h1>
      <p style={{ color: "#64748b", maxWidth: 720 }}>
        Human-governed workflow: source → staging → review → Cloudinary → manifest →
        verify → publish. No auto-publish without approval.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
        {report ? (
          <OpsExportActions
            reportType="media-staging"
            rows={report.families}
            fullReport={report}
            filenamePrefix="media-staging"
            mapCsvRow={(f) => ({
              family: f.familySlug,
              publishStatus: f.publishStatus,
              candidateConfidence: f.candidateConfidence,
              issues: f.issues.join("; "),
            })}
          />
        ) : null}
      </div>

      {report ? (
        <>
          <div style={card}>
            <p>
              Workflow: {report.workflow.join(" → ")} · Unresolved families:{" "}
              <strong>{report.unresolvedFamilies.length}</strong> · Approval queue:{" "}
              <strong>{report.approvalQueue.length}</strong>
            </p>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Run CLI: <code>npm run media:staging-audit</code> · Publish only after{" "}
              <code>npm run media:verify</code>
            </p>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Tier-1 families</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: 8 }}>Family</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Issues</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {report.families.map((f) => (
                  <tr key={f.familySlug} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>
                      <code>{f.familySlug}</code>
                    </td>
                    <td>
                      <span style={adminBadge(statusTone[f.publishStatus] || "neutral")}>
                        {f.publishStatus}
                      </span>
                    </td>
                    <td>{f.candidateConfidence}</td>
                    <td>{f.issues.join(", ") || "—"}</td>
                    <td>
                      {f.publishStatus !== "PUBLISHED" ? (
                        <button
                          type="button"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => handleStageNote(f.familySlug)}
                        >
                          Queue review
                        </button>
                      ) : (
                        "✓"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {queue.length > 0 ? (
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Staging queue</h3>
              <ul style={{ paddingLeft: 20 }}>
                {queue.slice(0, 20).map((q) => (
                  <li key={q.id} style={{ marginBottom: 8 }}>
                    <code>{q.id}</code> — {q.publishStatus}
                    {q.publishStatus === "REVIEW" ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          style={{ fontSize: "0.75rem", marginLeft: 8 }}
                          onClick={() => handleApprove(q.id)}
                        >
                          Approve (ops)
                        </button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
