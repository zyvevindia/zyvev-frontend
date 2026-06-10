import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ChangeDetectionReviewDossier from "../../components/changeDetection/ChangeDetectionReviewDossier.jsx";
import {
  STATUS_LABELS,
  CHANGE_DETECTION_STATUS,
  canHumanApprove,
  canHumanPublish,
} from "../../agents/changeDetection/changeDetectionStatus.js";
import { priorityTone } from "../../agents/changeDetection/changePriority.js";
import {
  apiApproveChangeDetection,
  apiCreateChangeDetectionJob,
  apiGetChangeDetectionJob,
  apiIgnoreChangeDetection,
  apiListChangeDetectionJobs,
  apiPublishChangeDetection,
  apiRunChangeDetectionCheck,
  apiSeedMonitorsFromRegistry,
} from "../../services/changeDetectionApi.js";
import { adminCard, adminBadge } from "./adminOpsStyles.js";

const card = { ...adminCard, marginBottom: "1rem" };

const btnPrimary = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary = { ...btnPrimary, background: "#e2e8f0", color: "#0f172a" };
const btnSuccess = { ...btnPrimary, background: "#166534" };

function statusTone(status) {
  if (status === CHANGE_DETECTION_STATUS.PUBLISHED) return "green";
  if (status === CHANGE_DETECTION_STATUS.APPROVED) return "green";
  if (status === CHANGE_DETECTION_STATUS.REVIEW_REQUIRED) return "yellow";
  if (status === CHANGE_DETECTION_STATUS.CHANGE_DETECTED) return "yellow";
  if (status === CHANGE_DETECTION_STATUS.IGNORED) return "neutral";
  return "blue";
}

export default function ChangeDetectionPage() {
  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [label, setLabel] = useState("");
  const [oemUrl, setOemUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");

  const reviewer = useMemo(() => {
    try {
      return localStorage.getItem("username") || "admin";
    } catch {
      return "admin";
    }
  }, []);

  const reloadJobs = useCallback(async () => {
    const r = await apiListChangeDetectionJobs({ limit: 30 });
    if (r.ok) setJobs(r.data || []);
  }, []);

  const loadJob = useCallback(async (id) => {
    if (!id) {
      setActiveJob(null);
      return;
    }
    const r = await apiGetChangeDetectionJob(id);
    if (r.ok) setActiveJob(r.data);
  }, []);

  useEffect(() => {
    reloadJobs();
  }, [reloadJobs]);

  useEffect(() => {
    loadJob(activeJobId);
  }, [activeJobId, loadJob]);

  const handleSeedRegistry = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/catalog/source-registry.json");
      const registry = await res.json();
      await apiSeedMonitorsFromRegistry(registry.slice(0, 10));
      await reloadJobs();
    } catch (err) {
      setError(err?.message || "Seed failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    const r = await apiCreateChangeDetectionJob({
      familySlug,
      label: label || familySlug,
      oemUrl,
      brochureUrl,
      createdBy: reviewer,
    });
    setLoading(false);
    if (!r.ok) {
      setError(r.errors?.join("; "));
      return;
    }
    setActiveJobId(r.data.id);
    await reloadJobs();
  };

  const handleCheck = async (jobId) => {
    setLoading(true);
    setError("");
    const r = await apiRunChangeDetectionCheck(jobId || activeJobId);
    setLoading(false);
    if (!r.ok) {
      setError(r.errors?.join("; "));
      return;
    }
    setActiveJob(r.data);
    await reloadJobs();
  };

  const handleApprove = async () => {
    setLoading(true);
    const r = await apiApproveChangeDetection(activeJobId, { approvedBy: reviewer });
    setLoading(false);
    if (!r.ok) setError(r.errors?.join("; "));
    else {
      setActiveJob(r.data);
      await reloadJobs();
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Apply approved changes to catalog baseline? Human approval required.")) return;
    setLoading(true);
    const r = await apiPublishChangeDetection(activeJobId, { publishedBy: reviewer });
    setLoading(false);
    if (!r.ok) setError(r.errors?.join("; "));
    else {
      setActiveJob(r.data);
      await reloadJobs();
    }
  };

  const handleIgnore = async () => {
    const reason = window.prompt("Ignore reason (optional):") || null;
    setLoading(true);
    const r = await apiIgnoreChangeDetection(activeJobId, { ignoredBy: reviewer, reason });
    setLoading(false);
    if (!r.ok) setError(r.errors?.join("; "));
    else {
      setActiveJob(r.data);
      await reloadJobs();
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
        {" · "}
        <Link to="/admin/vehicle-creation">Vehicle Creation</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Change Detection Agent v1</h1>
      <p style={{ color: "#64748b", maxWidth: 720 }}>
        Monitor published vehicles for OEM/brochure changes. Weekly cadence + manual trigger.
        Human approval required before catalog updates. No autonomous publishing.
      </p>

      {error && (
        <div style={{ ...card, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={btnSecondary} disabled={loading} onClick={handleSeedRegistry}>
            Seed monitors from registry (10)
          </button>
        </div>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Add monitor</h2>
        <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <input placeholder="familySlug e.g. tata-nexon-ev" value={familySlug} onChange={(e) => setFamilySlug(e.target.value)} />
          <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input placeholder="OEM URL" value={oemUrl} onChange={(e) => setOemUrl(e.target.value)} />
          <input placeholder="Brochure URL" value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} />
          <button type="button" style={btnPrimary} disabled={loading || !familySlug} onClick={handleCreate}>
            Create monitor
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Monitored vehicles</h3>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: 6 }}>Vehicle</th>
                <th style={{ padding: 6 }}>Changes</th>
                <th style={{ padding: 6 }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => setActiveJobId(j.id)}
                  style={{
                    cursor: "pointer",
                    background: activeJobId === j.id ? "#f8fafc" : "transparent",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <td style={{ padding: 6 }}>
                    <div style={{ fontWeight: 600 }}>{j.label || j.familySlug}</div>
                    <span style={adminBadge(statusTone(j.status))}>{STATUS_LABELS[j.status]}</span>
                  </td>
                  <td style={{ padding: 6 }}>{j.changeCount ?? 0}</td>
                  <td style={{ padding: 6 }}>
                    {j.priority ? (
                      <span style={adminBadge(priorityTone(j.priority))}>{j.priority}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {!activeJob && (
            <div style={card}>
              <p style={{ color: "#64748b", margin: 0 }}>Select a monitor or create one.</p>
            </div>
          )}

          {activeJob && (
            <>
              <div style={card}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{activeJob.label || activeJob.familySlug}</h2>
                <p style={{ fontSize: 13, color: "#64748b" }}>
                  Last checked: {activeJob.lastCheckedAt || "Never"} · Schedule: weekly
                  <br />
                  Recommendation: {activeJob.recommendation?.code || "—"}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button type="button" style={btnPrimary} disabled={loading} onClick={() => handleCheck(activeJob.id)}>
                    {loading ? "Checking…" : "Run check now"}
                  </button>
                  {canHumanApprove(activeJob.status) && (
                    <button type="button" style={btnSuccess} disabled={loading} onClick={handleApprove}>
                      Approve changes
                    </button>
                  )}
                  {canHumanPublish(activeJob.status) && (
                    <button type="button" style={btnPrimary} disabled={loading} onClick={handlePublish}>
                      Update catalog
                    </button>
                  )}
                  {activeJob.status !== CHANGE_DETECTION_STATUS.PUBLISHED &&
                    activeJob.status !== CHANGE_DETECTION_STATUS.IGNORED && (
                      <button type="button" style={btnSecondary} disabled={loading} onClick={handleIgnore}>
                        Ignore
                      </button>
                    )}
                </div>
              </div>

              {activeJob.diffDossier && (
                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>Diff dossier</h3>
                  <ChangeDetectionReviewDossier dossier={activeJob.diffDossier} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
