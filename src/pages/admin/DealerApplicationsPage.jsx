import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import {
  AUDIT_ACTIONS,
  logOpsAudit,
} from "../../services/opsAuditLog";
import { fetchDealerApplicationsForExport } from "../../services/adminExportApi";
import { downloadCsvFromObjects } from "../../utils/csvExport";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

export default function DealerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState({});
  const [exporting, setExporting] = useState(false);
  const [exportFrom, setExportFrom] = useState("");

  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = filter ? `?status=${filter}` : "";
      const res = await fetch(
        `${API_URL}/api/admin/dealer-applications${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const patchApplication = async (id, body) => {
    const res = await fetch(
      `${API_URL}/api/admin/dealer-applications/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    await load();
  };

  const handleReview = async (id, onboardingStatus) => {
    try {
      const payload = {
        onboardingStatus,
        reviewNotes: review[id]?.notes || "",
        assignedTo: review[id]?.assignedTo || "",
      };
      if (onboardingStatus === "approved") {
        const pwd = window.prompt(
          "Set initial dealer password (min 6 chars):"
        );
        if (!pwd || pwd.length < 6) {
          alert("Password required to approve");
          return;
        }
        payload.approvePassword = pwd;
      }
      await patchApplication(id, payload);

      logOpsAudit({
        action: AUDIT_ACTIONS.DEALER_APPLICATION_REVIEW,
        actorRole: "admin",
        targetType: "application",
        targetId: id,
        metadata: {
          onboardingStatus,
          summary: `${onboardingStatus} · ${payload.assignedTo || ""}`,
        },
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      let rows = await fetchDealerApplicationsForExport(token, filter);
      if (exportFrom) {
        const from = new Date(exportFrom).getTime();
        rows = rows.filter(
          (a) => a.createdAt && new Date(a.createdAt).getTime() >= from
        );
      }
      if (!rows.length) {
        alert("No applications to export");
        return;
      }
      downloadCsvFromObjects(
        rows,
        (a) => ({
          id: a._id,
          dealership: a.dealershipName,
          contact: a.contactName,
          email: a.email,
          phone: a.phone,
          city: a.citySlug,
          brands: (a.brands || []).join("; "),
          status: a.onboardingStatus,
          submitted: a.createdAt,
        }),
        `dealer-applications-${filter || "all"}.csv`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <nav style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        <Link to="/admin">Admin</Link>
        <span style={{ color: "#94a3b8" }}> / Dealer applications</span>
      </nav>

      <h1 style={{ marginTop: 0 }}>Dealer onboarding queue</h1>
      <p style={{ color: "#64748b" }}>
        Review signup requests before activating dealer accounts.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
      <label style={{ display: "block" }}>
        Status{" "}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </label>
      <label style={{ fontSize: "0.85rem" }}>
        From{" "}
        <input
          type="date"
          value={exportFrom}
          onChange={(e) => setExportFrom(e.target.value)}
        />
      </label>
      <button type="button" onClick={exportCsv} disabled={exporting}>
        {exporting ? "Exporting…" : "Export CSV"}
      </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading &&
        applications.map((app) => (
          <article key={app._id} style={card}>
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem" }}>
                  {app.dealershipName}
                </h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                  {app.contactName} · {app.email} · {app.phone}
                </p>
                <p style={{ margin: "0.35rem 0 0" }}>
                  City: <strong>{app.citySlug}</strong> · Brands:{" "}
                  {(app.brands || []).join(", ")}
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                  Submitted {new Date(app.createdAt).toLocaleString("en-IN")} ·
                  Queue: {app.leadQueue}
                </p>
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "999px",
                  background: "#f1f5f9",
                  fontSize: "0.8rem",
                }}
              >
                {app.onboardingStatus}
              </span>
            </header>

            {app.notes && (
              <p style={{ marginTop: "0.75rem" }}>
                <strong>Applicant notes:</strong> {app.notes}
              </p>
            )}

            <div style={{ marginTop: "0.75rem" }}>
              <input
                type="text"
                placeholder="Assignee (ops email)"
                value={review[app._id]?.assignedTo || app.assignedTo || ""}
                onChange={(e) =>
                  setReview((r) => ({
                    ...r,
                    [app._id]: {
                      ...r[app._id],
                      assignedTo: e.target.value,
                    },
                  }))
                }
                style={{
                  width: "100%",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                }}
              />
              <textarea
                rows={2}
                placeholder="Review notes"
                value={review[app._id]?.notes || ""}
                onChange={(e) =>
                  setReview((r) => ({
                    ...r,
                    [app._id]: { ...r[app._id], notes: e.target.value },
                  }))
                }
                style={{
                  width: "100%",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleReview(app._id, "under_review")}
              >
                Mark under review
              </button>
              <button
                type="button"
                onClick={() => handleReview(app._id, "approved")}
              >
                Approve & create dealer
              </button>
              <button
                type="button"
                onClick={() => handleReview(app._id, "rejected")}
              >
                Reject
              </button>
            </div>
          </article>
        ))}

      {!loading && !applications.length && (
        <p style={{ color: "#64748b" }}>No applications in this queue.</p>
      )}
    </div>
  );
}
