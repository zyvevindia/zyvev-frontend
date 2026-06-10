import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import VehicleCreationReviewDossier from "../../components/vehicleCreation/VehicleCreationReviewDossier.jsx";
import CatalogImportReviewPanel from "../../components/catalogImport/CatalogImportReviewPanel.jsx";
import {
  STATUS_LABELS,
  VEHICLE_CREATION_STATUS,
  canHumanApprove,
  canHumanPublish,
} from "../../agents/vehicleCreation/vehicleCreationStatus.js";
import {
  apiApproveVehicleCreation,
  apiCreateVehicleCreationJob,
  apiGetVehicleCreationJob,
  apiListVehicleCreationJobs,
  apiPublishVehicleCreation,
  apiRefreshVehicleCreationDossier,
  apiRejectVehicleCreation,
  apiRunVehicleCreationWorkflow,
  apiUpdateVehicleCreationReview,
} from "../../services/vehicleCreationApi.js";
import { adminCard, adminBadge } from "./adminOpsStyles.js";
import { logOpsAudit, AUDIT_ACTIONS } from "../../services/opsAuditLog.js";

const card = { ...adminCard, marginBottom: "1rem" };

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const btnPrimary = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary = {
  ...btnPrimary,
  background: "#e2e8f0",
  color: "#0f172a",
};

const btnDanger = {
  ...btnPrimary,
  background: "#991b1b",
};

const btnSuccess = {
  ...btnPrimary,
  background: "#166534",
};

function statusTone(status) {
  if (status === VEHICLE_CREATION_STATUS.PUBLISHED) return "green";
  if (status === VEHICLE_CREATION_STATUS.APPROVED) return "green";
  if (status === VEHICLE_CREATION_STATUS.REJECTED) return "red";
  if (status === VEHICLE_CREATION_STATUS.REVIEW_REQUIRED) return "yellow";
  return "neutral";
}

export default function VehicleCreationPage() {
  const [oemUrl, setOemUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [familySlug, setFamilySlug] = useState("");
  const [label, setLabel] = useState("");
  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(true);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  const reviewer = useMemo(() => {
    try {
      return (
        localStorage.getItem("username") ||
        localStorage.getItem("evsavari-ingestion-reviewer") ||
        "admin"
      );
    } catch {
      return "admin";
    }
  }, []);

  const reloadJobs = useCallback(async () => {
    const r = await apiListVehicleCreationJobs({ limit: 20 });
    if (r.ok) setJobs(r.data || []);
  }, []);

  const loadJob = useCallback(async (id) => {
    if (!id) {
      setActiveJob(null);
      return;
    }
    const r = await apiGetVehicleCreationJob(id);
    if (r.ok) setActiveJob(r.data);
  }, []);

  useEffect(() => {
    reloadJobs();
  }, [reloadJobs]);

  useEffect(() => {
    loadJob(activeJobId);
  }, [activeJobId, loadJob]);

  const handleCreateAndRun = async () => {
    setError("");
    setLoading(true);
    try {
      const created = await apiCreateVehicleCreationJob({
        oemUrl,
        brochureUrl,
        pdfFile,
        familySlug: familySlug || null,
        label: label || oemUrl || brochureUrl,
        createdBy: reviewer,
      });
      if (!created.ok) {
        setError(created.errors?.join("; ") || "Failed to create job");
        return;
      }

      const jobId = created.data.id;
      setActiveJobId(jobId);
      setActiveJob(created.data);

      const run = await apiRunVehicleCreationWorkflow(jobId, { pdfFile });
      if (!run.ok) {
        setError(run.errors?.join("; ") || "Workflow failed");
        await loadJob(jobId);
        return;
      }

      setActiveJob(run.data);
      await reloadJobs();
    } catch (err) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeJobId) return;
    setLoading(true);
    setError("");
    const r = await apiApproveVehicleCreation(activeJobId, { approvedBy: reviewer });
    setLoading(false);
    if (!r.ok) {
      setError(r.errors?.join("; "));
      return;
    }
    setActiveJob(r.data);
    await reloadJobs();
    logOpsAudit({
      action: AUDIT_ACTIONS.CATALOG_INGESTION_APPROVED,
      entityType: "vehicle_creation_job",
      entityId: activeJobId,
      meta: { approvedBy: reviewer },
    });
  };

  const handleReject = async () => {
    if (!activeJobId) return;
    const reason = window.prompt("Rejection reason (optional):") || null;
    setLoading(true);
    const r = await apiRejectVehicleCreation(activeJobId, { rejectedBy: reviewer, reason });
    setLoading(false);
    if (!r.ok) {
      setError(r.errors?.join("; "));
      return;
    }
    setActiveJob(r.data);
    await reloadJobs();
  };

  const handlePublish = async () => {
    if (!activeJobId) return;
    if (
      !window.confirm(
        "Publish this vehicle to the catalog? Human approval is required — this action is explicit."
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    const r = await apiPublishVehicleCreation(activeJobId, { publishedBy: reviewer });
    setLoading(false);
    if (!r.ok) {
      setError(r.errors?.join("; "));
      return;
    }
    setActiveJob(r.data);
    await reloadJobs();
  };

  const handleAttentionToggle = async (next) => {
    setAttentionOnly(next);
    if (!activeJobId) return;
    const r = await apiRefreshVehicleCreationDossier(activeJobId, { attentionOnly: next });
    if (r.ok) setActiveJob(r.data);
  };

  const handleReviewChange = async (reviewedVehicle) => {
    if (!activeJobId) return;
    const r = await apiUpdateVehicleCreationReview(activeJobId, reviewedVehicle);
    if (r.ok) setActiveJob(r.data);
  };

  const dossier = activeJob?.reviewDossier;
  const evidence = activeJob?.evidencePacket;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog/import">Catalog Import Wizard</Link>
        {" · "}
        <Link to="/admin/catalog-ingestion">Catalog ingestion</Link>
        {" · "}
        <Link to="/admin/seo">SEO Agent</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
        {" · "}
        <Link to="/admin/change-detection">Change Detection</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Vehicle Creation Agent v1.1</h1>
      <p style={{ color: "#64748b", maxWidth: 720 }}>
        OEM URL + brochure → Catalog Acquisition v7.1 → golden-aware review dossier → human approval → publish.
        No autonomous publishing.
      </p>

      {error && (
        <div style={{ ...card, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>New vehicle onboarding</h2>
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          <label>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Label (optional)
            </span>
            <input
              style={inputStyle}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Tata Nexon EV"
            />
          </label>
          <label>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              OEM URL
            </span>
            <input
              style={inputStyle}
              value={oemUrl}
              onChange={(e) => setOemUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Brochure URL
            </span>
            <input
              style={inputStyle}
              value={brochureUrl}
              onChange={(e) => setBrochureUrl(e.target.value)}
              placeholder="https://...pdf"
            />
          </label>
          <label>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Or upload PDF brochure
            </span>
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
          </label>
          <label>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Family slug (optional, for golden alignment)
            </span>
            <input
              style={inputStyle}
              value={familySlug}
              onChange={(e) => setFamilySlug(e.target.value)}
              placeholder="tata-nexon-ev"
            />
          </label>
          <button
            type="button"
            style={btnPrimary}
            disabled={loading || (!oemUrl && !brochureUrl && !pdfFile)}
            onClick={handleCreateAndRun}
          >
            {loading ? "Running v7.1 pipeline…" : "Create & run acquisition"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>
        <div style={card}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Recent jobs</h3>
          {jobs.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 14 }}>No jobs yet</p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {jobs.map((j) => (
              <li key={j.id} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveJobId(j.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: activeJobId === j.id ? "2px solid #0f172a" : "1px solid #e2e8f0",
                    background: activeJobId === j.id ? "#f8fafc" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{j.label || j.id}</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={adminBadge(statusTone(j.status))}>
                      {STATUS_LABELS[j.status] || j.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {!activeJob && (
            <div style={card}>
              <p style={{ color: "#64748b", margin: 0 }}>Select a job or create a new one.</p>
            </div>
          )}

          {activeJob && (
            <>
              <div style={card}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>
                    {activeJob.label || activeJob.id}
                  </h2>
                  <span style={adminBadge(statusTone(activeJob.status))}>
                    {STATUS_LABELS[activeJob.status]}
                  </span>
                  {activeJob.recommendation?.code && (
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      Recommendation: {activeJob.recommendation.code}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
                  {activeJob.oemUrl && <>OEM: {activeJob.oemUrl}<br /></>}
                  {activeJob.brochureUrl && <>Brochure: {activeJob.brochureUrl}<br /></>}
                  {activeJob.catalogImportId && (
                    <>
                      Catalog import:{" "}
                      <Link to="/admin/catalog/import">{activeJob.catalogImportId}</Link>
                    </>
                  )}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {canHumanApprove(activeJob.status) && (
                    <button type="button" style={btnSuccess} disabled={loading} onClick={handleApprove}>
                      Approve for publish
                    </button>
                  )}
                  {canHumanPublish(activeJob.status) && (
                    <button type="button" style={btnPrimary} disabled={loading} onClick={handlePublish}>
                      Publish to catalog
                    </button>
                  )}
                  {activeJob.status !== VEHICLE_CREATION_STATUS.PUBLISHED &&
                    activeJob.status !== VEHICLE_CREATION_STATUS.REJECTED && (
                      <button type="button" style={btnDanger} disabled={loading} onClick={handleReject}>
                        Reject
                      </button>
                    )}
                  {evidence && (
                    <button
                      type="button"
                      style={btnSecondary}
                      onClick={() => setShowFieldEditor((v) => !v)}
                    >
                      {showFieldEditor ? "Hide field editor" : "Edit fields"}
                    </button>
                  )}
                </div>
              </div>

              {dossier && (
                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>Review dossier</h3>
                  <VehicleCreationReviewDossier
                    dossier={dossier}
                    jobStatus={activeJob.status}
                    attentionOnly={attentionOnly}
                    onAttentionOnlyChange={handleAttentionToggle}
                  />
                </div>
              )}

              {showFieldEditor && evidence && (
                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>Field corrections</h3>
                  <CatalogImportReviewPanel
                    extractedVehicle={evidence.extractedVehicle}
                    reviewedVehicle={evidence.reviewedVehicle || evidence.extractedVehicle}
                    evidenceSummary={evidence.mergedFields}
                    onChange={handleReviewChange}
                  />
                </div>
              )}

              {(activeJob.status === VEHICLE_CREATION_STATUS.ACQUIRING ||
                activeJob.status === VEHICLE_CREATION_STATUS.EXTRACTING) && (
                  <div style={card}>
                    <p style={{ margin: 0, color: "#64748b" }}>
                      Running Catalog Acquisition v7.1…
                    </p>
                  </div>
                )}

              {activeJob.error && (
                <div style={{ ...card, background: "#fef2f2", borderColor: "#fecaca" }}>
                  <strong>Error</strong>
                  <p style={{ margin: "8px 0 0" }}>{activeJob.error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
