import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

import NotificationBell from "../components/NotificationBell";

import {
  labelForStatus
} from "../crm/leadPipeline";

import {
  logout,
  isAuthenticated
} from "../auth";

/* =========================================================
   ==================== SALES DASHBOARD =====================
   ========================================================= */

export default function SalesDashboard() {

  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  /* ================= STATE ================= */

  const [leads, setLeads] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusUpdates,
    setStatusUpdates] =
    useState({});

  const [notes, setNotes] =
    useState({});

  const [followUps,
    setFollowUps] =
    useState({});

  const [followUpSummary,
    setFollowUpSummary] =
    useState({
      overdueCount: 0,
      todayCount: 0,
      overdue: [],
      today: []
    });

  const [crmMetrics, setCrmMetrics] =
    useState(null);

  /* =====================================================
     ================= AUTO LOGOUT ========================
     ===================================================== */

  useEffect(() => {

    const interval =
      setInterval(() => {

        if (!isAuthenticated()) {

          logout();

          navigate("/login");
        }

      }, 60000);

    return () =>
      clearInterval(interval);

  }, [navigate]);

  /* =====================================================
     ================= FETCH LEADS ========================
     ===================================================== */

  const fetchLeads = async () => {

    try {

      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/api/sales/leads`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.error ||
          "Failed to fetch leads"
        );

        return;
      }

      setLeads(
        Array.isArray(data)
          ? data
          : data.leads || []
      );

    } catch (err) {

      console.error(err);

      setError("Server error");

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     =============== FETCH FOLLOW-UP SUMMARY ===============
     ===================================================== */

  const fetchFollowUpSummary =
    async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/api/sales/followups`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

        if (response.ok) {

          setFollowUpSummary(data);
        }

      } catch (err) {

        console.error(err);
      }
    };

  const fetchCrmMetrics =
    async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/api/sales/crm-dashboard`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

        if (response.ok) {

          setCrmMetrics(data);
        }
      } catch (err) {

        console.error(err);
      }
    };

  /* =====================================================
     ================= INITIAL LOAD =======================
     ===================================================== */

  useEffect(() => {

    fetchLeads();

    fetchFollowUpSummary();

    fetchCrmMetrics();

  }, []);

  /* =====================================================
     ================= UPDATE STATUS ======================
     ===================================================== */

  const updateStatus = async (
    leadId
  ) => {

    const status =
      statusUpdates[leadId];

    if (!status) {

      alert("Select status");

      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/api/sales/leads/${leadId}/status`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              status
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.error ||
          "Status update failed"
        );

        return;
      }

      fetchLeads();

      fetchCrmMetrics();

      alert(
        "Lead status updated"
      );

    } catch (err) {

      console.error(err);

      alert("Server error");
    }
  };

  /* =====================================================
     ==================== ADD NOTE ========================
     ===================================================== */

  const addNote = async (
    leadId
  ) => {

    const text =
      notes[leadId];

    if (
      !text ||
      !text.trim()
    ) {

      alert("Enter note");

      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/api/sales/leads/${leadId}/notes`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              text
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.error ||
          "Failed to add note"
        );

        return;
      }

      setNotes({
        ...notes,
        [leadId]: ""
      });

      fetchLeads();

      fetchCrmMetrics();

      alert("Note added");

    } catch (err) {

      console.error(err);

      alert("Server error");
    }
  };

  /* =====================================================
     ============== UPDATE FOLLOW-UP ======================
     ===================================================== */

  const updateFollowUp =
    async (leadId) => {

      const leadData =
        followUps[leadId];

      if (!leadData) {

        alert(
          "Select follow-up details"
        );

        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/api/sales/leads/${leadId}/followup`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`
              },

              body: JSON.stringify({
                nextFollowUp:
                  leadData.nextFollowUp,

                priority:
                  leadData.priority,

                followUpCompleted:
                  leadData.followUpCompleted
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          alert(
            data.error ||
            "Failed to update follow-up"
          );

          return;
        }

        fetchLeads();

        fetchFollowUpSummary();

        alert(
          "Follow-up updated"
        );

      } catch (err) {

        console.error(err);

        alert("Server error");
      }
    };

  /* =====================================================
     ================= WHATSAPP MESSAGE ===================
     ===================================================== */

  const openWhatsApp = (
    lead
  ) => {

    const phone =
      lead.phone?.replace(
        /\D/g,
        ""
      );

    if (
      !phone ||
      phone.length < 10
    ) {

      alert(
        "Invalid phone number"
      );

      return;
    }

    const message =
`Hello ${lead.name},

Thank you for your interest in ${lead.vehicleName || lead.carId?.name || "our EVs"}.

Our sales team from EVSavari will assist you shortly.

Thank you.`;

    const url =
`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  /* =====================================================
     ================= HANDLE LOGOUT ======================
     ===================================================== */

  const handleLogout = () => {

    logout();

    navigate("/login");
  };

  /* =====================================================
     ================= STATUS COLOR =======================
     ===================================================== */

  const getStatusColor = (
    status
  ) => {

    switch (status) {

      case "new":
        return "#2563eb";

      case "assigned":
        return "#7c3aed";

      case "contacted":
        return "#f59e0b";

      case "interested":
        return "#0f9d58";

      case "test_drive":
        return "#0891b2";

      case "negotiation":
        return "#ea580c";

      case "won":
      case "converted":
        return "#16a34a";

      case "lost":
        return "#dc2626";

      default:
        return "#64748b";
    }
  };

  /* =====================================================
     ================= PRIORITY COLOR =====================
     ===================================================== */

  const getPriorityColor = (
    priority
  ) => {

    switch (priority) {

      case "low":
        return "#64748b";

      case "medium":
        return "#2563eb";

      case "high":
        return "#ea580c";

      case "urgent":
        return "#dc2626";

      default:
        return "#64748b";
    }
  };

  /* =====================================================
     ======================= LOADING ======================
     ===================================================== */

  if (loading) {

    return (

      <div style={loadingContainer}>

        <h2>
          Loading CRM Dashboard...
        </h2>

      </div>

    );
  }

  /* =====================================================
     ========================= UI =========================
     ===================================================== */

  return (

    <div style={layout}>

      {/* ================= SIDEBAR ================= */}

      <div style={sidebar}>

        <div>

          <h2 style={sidebarTitle}>
            EVSavari CRM
          </h2>

          <p style={sidebarSubtext}>
            Sales Management
          </p>

        </div>

        <button
          style={{
            ...menuItem,
            background:
              "linear-gradient(135deg, #2563eb, #1d4ed8)"
          }}
          onClick={() =>
            navigate("/sales")
          }
        >
          📞 My Leads
        </button>

        <button
          style={menuItem}
          onClick={() =>
            navigate("/kanban")
          }
        >
          📌 Kanban CRM
        </button>

        <button
          style={menuItem}
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </div>

      {/* ================= MAIN ================= */}

      <div style={main}>

        {/* ================= HEADER ================= */}

        <div style={header}>

          <div>

            <h1 style={headerTitle}>
              📞 Sales Dashboard
            </h1>

            <p style={headerSubtitle}>
              Manage customer leads,
              follow-ups and EV sales
              interactions.
            </p>

          </div>

          <div style={headerActions}>

            <NotificationBell />

          </div>

        </div>

        {/* ================= ALERTS ================= */}

        <div style={alertGrid}>

          <div style={overdueCard}>

            <p style={alertLabel}>
              Overdue Follow-Ups
            </p>

            <h1>
              {
                followUpSummary.overdueCount
              }
            </h1>

          </div>

          <div style={todayCard}>

            <p style={alertLabel}>
              Today's Follow-Ups
            </p>

            <h1>
              {
                followUpSummary.todayCount
              }
            </h1>

          </div>

        </div>

        {/* ================= KPI ================= */}

        <div style={kpiGrid}>

          <div style={kpiCard}>
            <p>Total leads</p>
            <h2>
              {crmMetrics?.totalLeads ??
                leads.length}
            </h2>
          </div>

          <div style={kpiCard}>
            <p>New leads</p>
            <h2>

              {crmMetrics?.newLeads ??
                leads.filter(
                  (l) =>
                    l.status ===
                      "new" ||
                    l.status ===
                      "assigned"
                ).length}

            </h2>
          </div>

          <div style={kpiCard}>
            <p>Won leads</p>
            <h2>

              {crmMetrics?.wonLeads ??
                leads.filter(
                  (l) =>
                    l.status ===
                      "won" ||
                    l.status ===
                      "converted"
                ).length}

            </h2>
          </div>

          <div style={kpiCard}>
            <p>Conversion rate</p>
            <h2>

              {crmMetrics
                ? `${crmMetrics.conversionRate}%`
                : leads.length > 0
                  ? `${(
                      (leads.filter(
                        (l) =>
                          l.status ===
                            "won" ||
                          l.status ===
                            "converted"
                      ).length /
                        leads.length) *
                      100
                    ).toFixed(2)}%`
                  : "0%"}

            </h2>
          </div>

        </div>

        {crmMetrics && (

          <>

            <h3 style={analyticsSectionTitle}>
              Pipeline analytics
            </h3>

            <div style={analyticsGrid}>

              <div style={analyticsCard}>

                <h4 style={analyticsCardTitle}>
                  Top vehicles
                </h4>

                <ul style={rankedList}>

                  {(
                    !crmMetrics.topVehicles ||
                    crmMetrics.topVehicles
                      .length === 0
                  ) ? (

                    <li style={mutedLi}>
                      No data yet
                    </li>

                  ) : (

                    crmMetrics.topVehicles.map(
                      (row, i) => (

                        <li
                          key={i}
                          style={rankedLi}
                        >

                          <span>
                            {row.name}
                          </span>

                          <strong>
                            {row.count}
                          </strong>

                        </li>

                      )
                    )

                  )}

                </ul>

              </div>

              <div style={analyticsCard}>

                <h4 style={analyticsCardTitle}>
                  Top cities
                </h4>

                <ul style={rankedList}>

                  {(
                    !crmMetrics.topCities ||
                    crmMetrics.topCities
                      .length === 0
                  ) ? (

                    <li style={mutedLi}>
                      No data yet
                    </li>

                  ) : (

                    crmMetrics.topCities.map(
                      (row, i) => (

                        <li
                          key={i}
                          style={rankedLi}
                        >

                          <span>
                            {row.name}
                          </span>

                          <strong>
                            {row.count}
                          </strong>

                        </li>

                      )
                    )

                  )}

                </ul>

              </div>

              <div style={analyticsCard}>

                <h4 style={analyticsCardTitle}>
                  Lead sources
                </h4>

                <ul style={rankedList}>

                  {(
                    !crmMetrics.leadSources ||
                    crmMetrics.leadSources
                      .length === 0
                  ) ? (

                    <li style={mutedLi}>
                      No data yet
                    </li>

                  ) : (

                    crmMetrics.leadSources.map(
                      (row, i) => (

                        <li
                          key={i}
                          style={rankedLi}
                        >

                          <span
                            style={{
                              wordBreak:
                                "break-word",
                              paddingRight:
                                "8px"
                            }}
                          >
                            {row.source}
                          </span>

                          <strong>
                            {row.count}
                          </strong>

                        </li>

                      )
                    )

                  )}

                </ul>

              </div>

            </div>

          </>

        )}

        {/* ================= ERROR ================= */}

        {error && (

          <div style={errorBox}>
            {error}
          </div>

        )}

        {/* ================= LEADS ================= */}

        {leads.length === 0 ? (

          <div style={emptyCard}>

            <h3>
              No leads assigned yet
            </h3>

          </div>

        ) : (

          leads.map((lead) => (

            <div
              key={lead._id}
              style={leadCard}
            >

              {/* ================= TOP ================= */}

              <div style={leadTop}>

                <div>

                  <h3 style={leadName}>
                    {lead.name}
                  </h3>

                  <p style={leadInfo}>
                    📞 {lead.phone}
                  </p>

                  <p style={leadInfo}>
                    🚗{" "}
                    {lead.vehicleName ||

                      lead.carId?.name ||

                      "—"}
                  </p>

                </div>

                <div>

                  <span
                    style={{
                      ...statusBadge,
                      background:
                        getStatusColor(
                          lead.status
                        )
                    }}
                  >
                    {labelForStatus(
                      lead.status
                    )}
                  </span>

                  <div
                    style={{
                      ...priorityBadge,
                      background:
                        getPriorityColor(
                          lead.priority
                        )
                    }}
                  >
                    {lead.priority}
                  </div>

                </div>

              </div>

              {/* ================= FOLLOW-UP ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Follow-Up Management
                </h4>

                <div style={followUpGrid}>

                  <input
                    type="datetime-local"
                    onChange={(e) =>
                      setFollowUps({
                        ...followUps,

                        [lead._id]: {
                          ...followUps[
                            lead._id
                          ],

                          nextFollowUp:
                            e.target.value
                        }
                      })
                    }
                    style={input}
                  />

                  <select
                    onChange={(e) =>
                      setFollowUps({
                        ...followUps,

                        [lead._id]: {
                          ...followUps[
                            lead._id
                          ],

                          priority:
                            e.target.value
                        }
                      })
                    }
                    style={select}
                  >

                    <option value="">
                      Priority
                    </option>

                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>

                  </select>

                  <button
                    style={followBtn}
                    onClick={() =>
                      updateFollowUp(
                        lead._id
                      )
                    }
                  >
                    Save Follow-Up
                  </button>

                </div>

                {lead.nextFollowUp && (

                  <div style={followUpInfo}>

                    📅 Next Follow-Up:
                    {" "}

                    {new Date(
                      lead.nextFollowUp
                    ).toLocaleString()}

                  </div>

                )}

              </div>

              {/* ================= STATUS ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Update Status
                </h4>

                <div style={statusBox}>

                  <select
                    value={
                      statusUpdates[
                        lead._id
                      ] || ""
                    }

                    onChange={(e) =>
                      setStatusUpdates({
                        ...statusUpdates,

                        [lead._id]:
                          e.target.value
                      })
                    }

                    style={select}
                  >

                    <option value="">
                      Select
                    </option>

                    <option value="contacted">
                      Contacted
                    </option>

                    <option value="interested">
                      Interested
                    </option>

                    <option value="test_drive">
                      Test drive
                    </option>

                    <option value="negotiation">
                      Negotiation
                    </option>

                    <option value="won">
                      Won
                    </option>

                    <option value="lost">
                      Lost
                    </option>

                  </select>

                  <button
                    style={updateBtn}
                    onClick={() =>
                      updateStatus(
                        lead._id
                      )
                    }
                  >
                    Update
                  </button>

                </div>

              </div>

              {/* ================= COMMUNICATION ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Customer Communication
                </h4>

                <button
                  style={whatsappBtn}
                  onClick={() =>
                    openWhatsApp(lead)
                  }
                >
                  💬 WhatsApp Customer
                </button>

              </div>

              {/* ================= NOTES ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Notes
                </h4>

                <textarea
                  placeholder="Add customer discussion notes..."
                  value={
                    notes[
                      lead._id
                    ] || ""
                  }

                  onChange={(e) =>
                    setNotes({
                      ...notes,

                      [lead._id]:
                        e.target.value
                    })
                  }

                  style={textarea}
                />

                <button
                  style={noteBtn}
                  onClick={() =>
                    addNote(
                      lead._id
                    )
                  }
                >
                  Add Note
                </button>

              </div>

              {/* ================= STATUS HISTORY ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Status history
                </h4>

                {!lead.statusHistory ||
                lead.statusHistory.length === 0 ? (

                  <p style={emptyText}>
                    {labelForStatus(lead.status)}
                    {" · "}
                    {lead.createdAt
                      ? new Date(
                        lead.createdAt
                      ).toLocaleString()
                      : "—"}
                  </p>

                ) : (

                  <div>

                    {[...lead.statusHistory]
                      .reverse()
                      .map((h, index) => (

                        <div
                          key={index}
                          style={noteCard}
                        >

                          <strong>
                            {labelForStatus(
                              h.status
                            )}
                          </strong>

                          <p
                            style={{
                              margin:
                                "6px 0 0",

                              fontSize: "13px",

                              color: "#64748b"
                            }}
                          >

                            {h.at
                              ? new Date(
                                h.at
                              ).toLocaleString()
                              : "—"}
                            {h.changedBy?.name
                              ? ` · ${h.changedBy.name}`
                              : ""}
                            {h.changedByDealer?.name
                              ? ` · ${h.changedByDealer.name} (dealer)`
                              : ""}
                          </p>

                        </div>

                      ))}

                  </div>

                )}

              </div>

              {/* ================= TIMELINE ================= */}

              <div style={section}>

                <h4 style={sectionTitle}>
                  Interaction Timeline
                </h4>

                {!lead.notes ||
                lead.notes.length === 0 ? (

                  <p style={emptyText}>
                    No notes yet
                  </p>

                ) : (

                  <div>

                    {lead.notes
                      .slice()
                      .reverse()
                      .map((note, index) => (

                        <div
                          key={index}
                          style={noteCard}
                        >

                          <p>
                            {note.text}
                          </p>

                          <small>

                            {new Date(
                              note.createdAt
                            ).toLocaleString()}
                            {note.createdBy?.name
                              ? ` · ${note.createdBy.name}`
                              : ""}
                            {note.createdByDealer?.name
                              ? ` · ${note.createdByDealer.name} (dealer)`
                              : ""}
                          </small>

                        </div>

                      ))}

                  </div>

                )}

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#f5f7fb",
  flexWrap: "wrap"
};

const sidebar = {
  width: "240px",
  background:
    "linear-gradient(180deg, #0f172a, #1e293b)",
  color: "white",
  padding: "28px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.15)"
};

const sidebarTitle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "800"
};

const sidebarSubtext = {
  color: "#cbd5e1",
  marginTop: "6px",
  marginBottom: "26px"
};

const menuItem = {
  background:
    "rgba(255,255,255,0.06)",
  border: "none",
  color: "white",
  padding: "14px 16px",
  borderRadius: "14px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const main = {
  flex: 1,
  padding: "32px"
};

const header = {
  background:
    "linear-gradient(135deg, #1e3a8a, #2563eb)",
  color: "white",
  padding: "28px",
  borderRadius: "24px",
  marginBottom: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "20px",
  boxShadow:
    "0 15px 40px rgba(37,99,235,0.25)"
};

const headerTitle = {
  margin: 0,
  fontSize: "36px",
  fontWeight: "800"
};

const headerSubtitle = {
  marginTop: "10px",
  color: "#dbeafe",
  lineHeight: "1.7"
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: "14px"
};

const alertGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
  marginBottom: "24px"
};

const overdueCard = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "24px",
  borderRadius: "20px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.05)"
};

const todayCard = {
  background: "#dbeafe",
  color: "#1e3a8a",
  padding: "24px",
  borderRadius: "20px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.05)"
};

const alertLabel = {
  opacity: 0.8,
  marginBottom: "12px"
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "24px"
};

const kpiCard = {
  background: "white",
  padding: "24px",
  borderRadius: "20px",
  boxShadow:
    "0 12px 30px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb"
};

const analyticsSectionTitle = {
  margin: "8px 0 16px",
  fontSize: "20px",
  fontWeight: "800",
  color: "#0f172a"
};

const analyticsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
  marginBottom: "28px"
};

const analyticsCard = {
  background: "white",
  padding: "20px",
  borderRadius: "20px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 8px 24px rgba(15,23,42,0.05)"
};

const analyticsCardTitle = {
  margin: "0 0 12px",
  fontSize: "15px",
  fontWeight: "700",
  color: "#1e293b"
};

const rankedList = {
  listStyle: "none",
  margin: 0,
  padding: 0
};

const rankedLi = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "14px",
  color: "#334155"
};

const mutedLi = {
  padding: "8px 0",
  fontSize: "14px",
  color: "#94a3b8"
};

const leadCard = {
  background: "white",
  padding: "28px",
  borderRadius: "24px",
  marginBottom: "24px",
  boxShadow:
    "0 12px 30px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb"
};

const leadTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "26px"
};

const leadName = {
  fontSize: "28px",
  marginBottom: "12px",
  color: "#0f172a"
};

const leadInfo = {
  color: "#475569",
  marginBottom: "8px"
};

const statusBadge = {
  color: "white",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "capitalize",
  display: "inline-block"
};

const priorityBadge = {
  color: "white",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  marginTop: "12px",
  textAlign: "center",
  fontWeight: "700",
  textTransform: "capitalize"
};

const section = {
  marginTop: "28px"
};

const sectionTitle = {
  marginBottom: "14px",
  color: "#0f172a",
  fontSize: "18px"
};

const followUpGrid = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap"
};

const input = {
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  minWidth: "220px"
};

const select = {
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  minWidth: "180px"
};

const statusBox = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap"
};

const updateBtn = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700"
};

const whatsappBtn = {
  background:
    "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700",
  boxShadow:
    "0 10px 24px rgba(22,163,74,0.25)"
};

const followBtn = {
  background:
    "linear-gradient(135deg, #7c3aed, #6d28d9)",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700"
};

const textarea = {
  width: "100%",
  minHeight: "110px",
  marginTop: "10px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box"
};

const noteBtn = {
  marginTop: "14px",
  background:
    "linear-gradient(135deg, #0f9d58, #15803d)",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700"
};

const noteCard = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "16px",
  marginTop: "14px",
  border: "1px solid #e2e8f0"
};

const followUpInfo = {
  marginTop: "14px",
  padding: "14px 16px",
  background: "#f8fafc",
  borderRadius: "14px",
  color: "#334155"
};

const loadingContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f7fb"
};

const emptyCard = {
  background: "white",
  padding: "50px",
  borderRadius: "24px",
  textAlign: "center",
  boxShadow:
    "0 12px 30px rgba(15,23,42,0.06)"
};

const emptyText = {
  opacity: 0.6
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "16px",
  borderRadius: "14px",
  marginBottom: "24px"
};