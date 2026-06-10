import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  STATUS_LABELS,
  SEO_STATUS,
  canHumanApprove,
  canHumanPublish,
  SEO_PAGE_SPECS,
} from "../../agents/seo/index.js";
import {
  apiApproveSeoJob,
  apiCreateSeoJob,
  apiGenerateSeoContent,
  apiGetSeoJob,
  apiGetSeoMetrics,
  apiListSeoJobs,
  apiPublishSeoJob,
  apiRejectSeoJob,
} from "../../services/seoApi.js";
import { adminBadge, adminCard } from "./adminOpsStyles.js";

const card = { ...adminCard, marginBottom: "1rem" };

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

const btnSecondary = { ...btnPrimary, background: "#e2e8f0", color: "#0f172a" };
const btnSuccess = { ...btnPrimary, background: "#166534" };
const btnDanger = { ...btnPrimary, background: "#991b1b" };

function statusTone(status) {
  if (status === SEO_STATUS.PUBLISHED) return "green";
  if (status === SEO_STATUS.APPROVED) return "green";
  if (status === SEO_STATUS.REVIEW_REQUIRED) return "yellow";
  if (status === SEO_STATUS.REJECTED) return "red";
  return "neutral";
}

export default function SeoAgentPage() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [selectedSpecId, setSelectedSpecId] = useState(SEO_PAGE_SPECS[0]?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reviewer =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "admin"
      : "admin";

  const refresh = useCallback(() => {
    const list = apiListSeoJobs().data?.jobs || [];
    setJobs(list);
    setMetrics(apiGetSeoMetrics().data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeJobId) {
      setActiveJob(null);
      return;
    }
    const res = apiGetSeoJob(activeJobId);
    setActiveJob(res.data?.job || null);
  }, [activeJobId, jobs]);

  const queueCounts = useMemo(
    () => ({
      draft: jobs.filter((j) => j.status === SEO_STATUS.DRAFT).length,
      review: jobs.filter((j) => j.status === SEO_STATUS.REVIEW_REQUIRED).length,
      approved: jobs.filter((j) => j.status === SEO_STATUS.APPROVED).length,
      published: jobs.filter((j) => j.status === SEO_STATUS.PUBLISHED).length,
    }),
    [jobs]
  );

  async function handleCreateAndGenerate() {
    setLoading(true);
    setError("");
    const created = await apiCreateSeoJob({
      specId: selectedSpecId,
      createdBy: reviewer,
    });
    if (!created.ok) {
      setError(created.errors?.join("; "));
      setLoading(false);
      return;
    }
    const gen = await apiGenerateSeoContent(created.data.job.id);
    if (!gen.ok) setError(gen.errors?.join("; "));
    setActiveJobId(created.data.job.id);
    refresh();
    setLoading(false);
  }

  async function handleRegenerate() {
    if (!activeJobId) return;
    setLoading(true);
    const gen = await apiGenerateSeoContent(activeJobId);
    if (!gen.ok) setError(gen.errors?.join("; "));
    refresh();
    setLoading(false);
  }

  async function handleApprove() {
    const res = apiApproveSeoJob(activeJobId, { approvedBy: reviewer });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  async function handleReject() {
    const res = apiRejectSeoJob(activeJobId, {
      rejectedBy: reviewer,
      reason: "Rejected from SEO dashboard",
    });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  async function handlePublish() {
    const res = apiPublishSeoJob(activeJobId, { publishedBy: reviewer });
    if (!res.ok) setError(res.errors?.join("; "));
    refresh();
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <nav style={{ marginBottom: "1rem", fontSize: 14 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/agents">Agent Platform</Link>
      </nav>

      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.5rem" }}>
          SEO Agent v1
        </h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
          Generate SEO assets from catalog scores — draft → human review →
          approve → publish. No LLM. No autonomous publishing.
        </p>
      </header>

      {error ? (
        <div style={{ ...card, background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      ) : null}

      {metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
            marginBottom: "1rem",
          }}
        >
          <Metric label="Generated" value={metrics.pagesGenerated} />
          <Metric label="Review queue" value={metrics.reviewQueue} />
          <Metric label="Approved" value={metrics.approved} />
          <Metric label="Published" value={metrics.published} />
          <Metric
            label="Approval rate"
            value={
              metrics.approvalRatePct != null
                ? `${metrics.approvalRatePct}%`
                : "—"
            }
          />
          <Metric
            label="Regenerations"
            value={metrics.regenerationCount}
          />
        </div>
      )}

      <div style={card}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
          Generate new draft
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={selectedSpecId}
            onChange={(e) => setSelectedSpecId(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, minWidth: 280 }}
          >
            {SEO_PAGE_SPECS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.h1}
              </option>
            ))}
          </select>
          <button
            type="button"
            style={btnPrimary}
            disabled={loading}
            onClick={handleCreateAndGenerate}
          >
            Generate draft
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        <div style={card}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
            Jobs ({queueCounts.review} in review)
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {jobs.length === 0 ? (
              <li style={{ color: "#64748b", fontSize: 14 }}>No jobs yet.</li>
            ) : (
              jobs.map((job) => (
                <li key={job.id} style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setActiveJobId(job.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border:
                        activeJobId === job.id
                          ? "2px solid #1d4ed8"
                          : "1px solid #e2e8f0",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {job.label || job.specId}
                    </div>
                    <span style={adminBadge(statusTone(job.status))}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div style={card}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
            Review dossier
          </h2>
          {!activeJob ? (
            <p style={{ color: "#64748b" }}>Select a job to review.</p>
          ) : (
            <>
              <p style={{ fontSize: 13, margin: "0 0 8px" }}>
                <strong>Recommendation:</strong>{" "}
                {activeJob.recommendation?.label || "—"}
              </p>
              {activeJob.reviewDossier?.sections?.map((section) => (
                <div key={section.id} style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, margin: "0 0 4px" }}>
                    {section.label}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                    {section.items?.slice(0, 8).map((item, i) => (
                      <li key={i}>
                        <strong>{item.label}:</strong> {item.value}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button
                  type="button"
                  style={btnSecondary}
                  disabled={loading}
                  onClick={handleRegenerate}
                >
                  Regenerate
                </button>
                {canHumanApprove(activeJob.status) && (
                  <>
                    <button type="button" style={btnSuccess} onClick={handleApprove}>
                      Approve
                    </button>
                    <button type="button" style={btnDanger} onClick={handleReject}>
                      Reject
                    </button>
                  </>
                )}
                {canHumanPublish(activeJob.status) && (
                  <button type="button" style={btnPrimary} onClick={handlePublish}>
                    Publish (human)
                  </button>
                )}
              </div>

              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 13, cursor: "pointer" }}>
                  Full SEO JSON
                </summary>
                <pre
                  style={{
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 280,
                    background: "#f8fafc",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  {JSON.stringify(activeJob.seoPage, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ ...adminCard, marginBottom: 0, padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</div>
    </div>
  );
}
