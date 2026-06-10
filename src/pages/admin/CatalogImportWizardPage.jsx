import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CatalogImportReviewPanel from "../../components/catalogImport/CatalogImportReviewPanel.jsx";
import CatalogQualityDashboard from "../../components/catalogImport/CatalogQualityDashboard.jsx";
import ConfidenceBadge from "../../components/catalogImport/ConfidenceBadge.jsx";
import { adminCard } from "./adminOpsStyles";
import {
  apiAcquireEvidence,
  apiApproveImport,
  apiCreateImportDraft,
  apiExtractAndNormalize,
  apiFetchSourceContent,
  apiGetEvidenceRecords,
  apiGetImport,
  apiListImports,
  apiPublishImport,
  apiRejectImport,
  apiResolveFieldConflict,
  apiRunV3AutoAcquire,
  apiUpdateReviewedVehicle,
  IMPORT_SOURCE_TYPE,
  IMPORT_STATUS,
} from "../../services/catalogImportApi.js";
import {
  createReviewSession,
  persistReviewMetrics,
  buildReviewMetricsReport,
  finalizeReviewSession,
  fetchGoldenDossier,
  fetchGoldenManifest,
  checkPublishQualityGates,
} from "../../catalogAcquisition/benchmark/index.js";
import { TRUSTED_REFERENCE_SOURCES } from "../../catalogAcquisition/trustedReferenceSources.js";
import { logOpsAudit, AUDIT_ACTIONS } from "../../services/opsAuditLog";

const STEPS = [
  "URLs + PDF",
  "Auto-acquire",
  "AI extract & merge",
  "Review",
  "Publish",
];

const card = { ...adminCard, marginBottom: "1rem" };

export default function CatalogImportWizardPage() {
  const [step, setStep] = useState(0);
  const [oemUrl, setOemUrl] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [referenceUrls, setReferenceUrls] = useState([""]);
  const [useLegacyManual, setUseLegacyManual] = useState(false);
  const [sourceType, setSourceType] = useState(IMPORT_SOURCE_TYPE.OEM_URL);
  const [pasteContent, setPasteContent] = useState("");
  const [importId, setImportId] = useState(null);
  const [record, setRecord] = useState(null);
  const [reviewedVehicle, setReviewedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentImports, setRecentImports] = useState([]);
  const [storageHint, setStorageHint] = useState("");
  const [lastTiming, setLastTiming] = useState(null);
  const [reviewSession, setReviewSession] = useState(null);
  const [goldenDossier, setGoldenDossier] = useState(null);
  const [evidenceRecords, setEvidenceRecords] = useState([]);

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

  const reloadRecent = useCallback(async () => {
    const r = await apiListImports({ limit: 10 });
    if (r.ok) {
      setRecentImports(r.data || []);
      setStorageHint(r.storage || "");
    }
  }, []);

  useEffect(() => {
    reloadRecent();
  }, [reloadRecent]);

  const loadRecord = useCallback(async (id) => {
    const r = await apiGetImport(id);
    if (r.ok) {
      setRecord(r.data);
      setReviewedVehicle(r.data.reviewedVehicle || r.data.extractedVehicle);
      const ev = await apiGetEvidenceRecords(id);
      if (ev.ok) setEvidenceRecords(ev.data || []);
    }
  }, []);

  const familySlug = useMemo(() => {
    return (
      reviewedVehicle?.vehicle?.familySlug?.value ??
      record?.extractedVehicle?.vehicle?.familySlug?.value ??
      null
    );
  }, [reviewedVehicle, record]);

  useEffect(() => {
    if (!familySlug) {
      setGoldenDossier(null);
      return;
    }
    fetchGoldenManifest()
      .then((manifest) => {
        const entry = (manifest.vehicles || []).find((v) => v.familySlug === familySlug);
        if (!entry) {
          setGoldenDossier(null);
          return;
        }
        return fetchGoldenDossier(entry.id).then(setGoldenDossier);
      })
      .catch(() => setGoldenDossier(null));
  }, [familySlug]);

  const qualityGates = useMemo(() => {
    if (!record) return null;
    return checkPublishQualityGates(record, evidenceRecords, goldenDossier);
  }, [record, evidenceRecords, goldenDossier]);

  const handleCreateDraft = async () => {
    setError("");
    setLoading(true);
    try {
      if (!oemUrl.trim() && !pdfFile) {
        throw new Error("Provide OEM URL and/or PDF brochure");
      }
      const r = await apiCreateImportDraft({
        sourceType: IMPORT_SOURCE_TYPE.OEM_URL,
        sourceUrl: oemUrl || null,
        sourceFile: pdfFile ? { name: pdfFile.name, size: pdfFile.size } : {},
        sourceInputs: {
          oemUrl,
          referenceUrls: referenceUrls.filter(Boolean),
          engine: "v3",
        },
        createdBy: reviewer,
      });
      if (!r.ok) throw new Error(r.errors?.join("; "));
      setImportId(r.data.id);
      setRecord(r.data);
      setStorageHint(r.storage);
      setStep(1);
    } catch (e) {
      setError(e?.message || "Failed to create draft");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAcquire = async () => {
    if (!importId) return;
    setError("");
    setLoading(true);
    const startedAt = Date.now();
    try {
      if (useLegacyManual) {
        let content = pasteContent;
        if (!content.trim()) {
          const fetched = await apiFetchSourceContent(sourceType, oemUrl, "");
          if (!fetched.ok) throw new Error((fetched.errors || []).join(" "));
          content = fetched.content;
        }
        const r = await apiExtractAndNormalize(importId, content, { sourceType });
        if (!r.ok) throw new Error(r.errors?.join("; "));
        setRecord(r.data);
        setReviewedVehicle(r.data.reviewedVehicle);
        setStep(3);
        return;
      }

      const r = await apiRunV3AutoAcquire(importId, {
        oemUrl: oemUrl.trim() || null,
        referenceUrls: referenceUrls.map((u) => u.trim()).filter(Boolean),
        pdfFile,
      });
      if (!r.ok) throw new Error(r.errors?.join("; ") + (r.hint ? ` ${r.hint}` : ""));
      setRecord(r.data);
      setReviewedVehicle(r.data.reviewedVehicle);
      const elapsedMs = r.pipeline?.diagnostics?.elapsedMs ?? Date.now() - startedAt;
      setLastTiming({
        elapsedSec: (elapsedMs / 1000).toFixed(1),
        attentionCount: r.pipeline?.diagnostics?.attentionCount,
        aiProvider: r.pipeline?.diagnostics?.aiProvider,
      });
      setReviewSession(createReviewSession(importId));
      const ev = await apiGetEvidenceRecords(importId);
      if (ev.ok) setEvidenceRecords(ev.data || []);
      setStep(2);
      setTimeout(() => setStep(3), 300);
    } catch (e) {
      setError(e?.message || "Auto-acquire failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async (fieldKey, value) => {
    if (!importId) return;
    const r = await apiResolveFieldConflict(importId, fieldKey, value);
    if (r.ok) {
      setRecord(r.data);
      setReviewedVehicle(r.data.reviewedVehicle || r.data.extractedVehicle);
      await loadRecord(importId);
    }
  };

  const handleApprove = async () => {
    if (!importId) return;
    setLoading(true);
    setError("");
    try {
      await apiUpdateReviewedVehicle(importId, reviewedVehicle);
      const finalizedSession = reviewSession
        ? finalizeReviewSession(reviewSession)
        : null;
      if (finalizedSession) {
        const metrics = buildReviewMetricsReport(
          finalizedSession,
          record?.extractedVehicle,
          reviewedVehicle
        );
        persistReviewMetrics(importId, metrics);
      }
      const r = await apiApproveImport(importId, reviewer);
      if (!r.ok) throw new Error(r.errors?.join("; "));
      setRecord(r.data);
      logOpsAudit({
        action: AUDIT_ACTIONS.CATALOG_INGESTION_APPROVED,
        detail: importId,
        meta: { reviewer },
      });
      setStep(4);
    } catch (e) {
      setError(e?.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!importId) return;
    const r = await apiRejectImport(importId, reviewer);
    if (r.ok) {
      setRecord(r.data);
      setError("Import rejected.");
    }
  };

  const handlePublish = async () => {
    if (!importId) return;
    if (qualityGates && !qualityGates.passed) {
      setError(
        `Publish blocked by quality gates: ${qualityGates.failures.map((f) => f.message).join("; ")}`
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await apiPublishImport(importId, {
        goldenDossier,
        reviewSession,
      });
      if (!r.ok) throw new Error(r.errors?.join("; "));
      setRecord(r.data);
      await reloadRecent();
      logOpsAudit({
        action: "catalog_import_published",
        detail: importId,
        meta: { vehicle: r.publish?.vehicle?.slug },
      });
    } catch (e) {
      setError(e?.message || "Publish failed");
    } finally {
      setLoading(false);
    }
  };

  const attentionCount = record?.diagnostics?.attentionCount ?? 0;
  const conflictCount = record?.diagnostics?.conflictCount ?? 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog-ingestion">Legacy CSV/JSON ingestion</Link>
        {" · "}
        <Link to="/admin/catalog/benchmark">Accuracy benchmark</Link>
        {" · "}
        <Link to="/admin/catalog/acquisition">Acquisition quality (v5)</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
        {" · "}
        <Link to="/admin/vehicle-creation">Vehicle Creation Agent v1.1</Link>
        {" · "}
        <Link to="/admin/change-detection">Change Detection Agent v1</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Catalog Import Wizard</h1>
      <p style={{ color: "#64748b", maxWidth: 760, lineHeight: 1.6 }}>
        v3: paste OEM URL + upload PDF — system auto-fetches sources, parses PDF, runs AI
        extraction, merges evidence. Review exceptions only, then publish.
      </p>

      {storageHint && (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          Storage: {storageHint}
        </p>
      )}

      <nav
        aria-label="Wizard steps"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "1rem 0 1.5rem" }}
      >
        {STEPS.map((label, i) => (
          <span
            key={label}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: i === step ? "#2563eb" : i < step ? "#dbeafe" : "#f1f5f9",
              color: i === step ? "#fff" : "#0f172a",
            }}
          >
            {i + 1}. {label}
          </span>
        ))}
      </nav>

      {error && (
        <div style={{ ...card, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      {step === 0 && (
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Step 1 — OEM URL + PDF</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            No manual copy/paste required. Optional reference URLs from{" "}
            {TRUSTED_REFERENCE_SOURCES.map((s) => s.name).join(", ")}.
          </p>

          <label style={labelStyle}>OEM website URL</label>
          <input
            type="url"
            placeholder="https://www.tata-motors.com/nexon/ev"
            value={oemUrl}
            onChange={(e) => setOemUrl(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>PDF brochure</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />

          <label style={{ ...labelStyle, marginTop: 12 }}>Reference URLs (optional)</label>
          {referenceUrls.map((url, i) => (
            <input
              key={i}
              type="url"
              placeholder="https://www.cardekho.com/..."
              value={url}
              onChange={(e) =>
                setReferenceUrls((prev) =>
                  prev.map((u, j) => (j === i ? e.target.value : u))
                )
              }
              style={inputStyle}
            />
          ))}
          <button
            type="button"
            style={secondaryBtn}
            onClick={() => setReferenceUrls((p) => [...p, ""])}
          >
            + Add reference URL
          </button>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "#64748b" }}>
              Legacy manual paste (v1/v2)
            </summary>
            <label style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={useLegacyManual}
                onChange={(e) => setUseLegacyManual(e.target.checked)}
              />
              Use legacy single-source paste
            </label>
            {useLegacyManual && (
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={6}
                style={textareaStyle}
                placeholder="Paste HTML/text…"
              />
            )}
          </details>

          <button
            type="button"
            disabled={loading}
            onClick={handleCreateDraft}
            style={{ ...primaryBtn, marginTop: 16 }}
          >
            Continue →
          </button>
        </section>
      )}

      {step === 1 && (
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Step 2 — Auto-acquire & extract</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Server fetches OEM/reference URLs, parses PDF, runs AI extraction, and merges
            evidence into review draft.
          </p>
          <ul style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            {oemUrl && <li>OEM: {oemUrl}</li>}
            {pdfFile && <li>PDF: {pdfFile.name}</li>}
            {referenceUrls.filter(Boolean).map((u) => (
              <li key={u}>Reference: {u}</li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={loading} onClick={handleAutoAcquire} style={primaryBtn}>
              {loading ? "Acquiring…" : "Auto-acquire & extract →"}
            </button>
            <button type="button" onClick={() => setStep(0)} style={secondaryBtn}>
              Back
            </button>
          </div>
        </section>
      )}

      {step >= 2 && record && (
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Step 3–4 — Review</h2>
          <p style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Overall confidence: <ConfidenceBadge score={record.confidenceScore} />
            <span style={{ color: "#64748b", fontSize: 13 }}>Status: {record.status}</span>
            {attentionCount > 0 && (
              <span style={{ color: "#b45309", fontSize: 13, fontWeight: 700 }}>
                {attentionCount} need attention
              </span>
            )}
            {conflictCount > 0 && (
              <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
                {conflictCount} conflict(s)
              </span>
            )}
            {lastTiming && (
              <span style={{ color: "#64748b", fontSize: 12 }}>
                Acquired in {lastTiming.elapsedSec}s · AI: {lastTiming.aiProvider}
              </span>
            )}
          </p>

          <CatalogQualityDashboard
            importRecord={record}
            evidenceRecords={evidenceRecords}
            reviewSession={reviewSession}
            familySlug={familySlug}
          />

          <CatalogImportReviewPanel
            extractedVehicle={record.extractedVehicle}
            reviewedVehicle={reviewedVehicle}
            evidenceSummary={record.evidenceSummary}
            onChange={setReviewedVehicle}
            onResolveConflict={handleResolveConflict}
            readOnly={record.status === IMPORT_STATUS.PUBLISHED}
          />

          {record.status !== IMPORT_STATUS.PUBLISHED &&
            record.status !== IMPORT_STATUS.REJECTED && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={loading} onClick={handleApprove} style={primaryBtn}>
                  Approve for publish
                </button>
                <button type="button" onClick={handleReject} style={secondaryBtn}>
                  Reject
                </button>
              </div>
            )}
        </section>
      )}

      {step === 4 && record?.status === IMPORT_STATUS.APPROVED && (
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Step 5 — Publish</h2>
          {qualityGates && !qualityGates.passed && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                fontSize: 13,
              }}
            >
              <strong>Quality gates must pass before publish:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {qualityGates.failures.map((f) => (
                  <li key={`${f.gate}-${f.fieldKey || f.message}`}>{f.message}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            disabled={loading || (qualityGates && !qualityGates.passed)}
            onClick={handlePublish}
            style={primaryBtn}
          >
            {loading ? "Publishing…" : "Publish to catalog"}
          </button>
        </section>
      )}

      {record?.status === IMPORT_STATUS.PUBLISHED && (
        <section style={{ ...card, borderColor: "#86efac", background: "#f0fdf4" }}>
          <strong>Published successfully.</strong>
        </section>
      )}

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Recent imports</h2>
        {recentImports.length === 0 ? (
          <p style={{ color: "#64748b" }}>No imports yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {recentImports.map((imp) => (
              <li key={imp.id} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "none",
                    color: "#2563eb",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    setImportId(imp.id);
                    loadRecord(imp.id);
                    setStep(imp.status === IMPORT_STATUS.DRAFT ? 1 : 3);
                  }}
                >
                  {imp.sourceType}
                </button>
                {" — "}
                {imp.status}
                {imp.confidenceScore != null && (
                  <>
                    {" "}
                    <ConfidenceBadge score={imp.confidenceScore} compact />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const primaryBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  marginBottom: 8,
};

const textareaStyle = {
  width: "100%",
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  padding: 12,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  marginTop: 8,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 4,
};
