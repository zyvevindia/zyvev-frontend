import { useEffect, useState } from "react";
import { API_URL } from "../config";

import {
  useNavigate
} from "react-router-dom";

import {
  logout,
  isAuthenticated
} from "../auth";

import NotificationBell from "../components/NotificationBell";

import LeadDetailDrawer from "../components/LeadDetailDrawer";

import {
  PIPELINE_STAGES,

  kanbanBucketKey
} from "../crm/leadPipeline";

/* =========================================================
   ==================== KANBAN BOARD =======================
   ========================================================= */

export default function KanbanBoard() {

  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  /* ================= STATE ================= */

  const [leads, setLeads] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [draggedLead,
    setDraggedLead] =
    useState(null);

  const [detailLead, setDetailLead] =
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

        alert(
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

      alert("Server error");

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     ================= INITIAL LOAD =======================
     ===================================================== */

  useEffect(() => {

    fetchLeads();

  }, []);

  /* =====================================================
     ============== MERGE LEAD FROM DRAWER ==================
     ===================================================== */

  const handleLeadUpdatedFromDrawer =
    (updated) => {

      setLeads((prev) =>

        prev.map((l) =>

          l._id === updated._id

            ? updated
            : l
        )
      );

      setDetailLead((cur) =>

        cur &&
        cur._id === updated._id

          ? updated
          : cur
      );
    };

  /* =====================================================
     ================= UPDATE STATUS ======================
     ===================================================== */

  const updateLeadStatus =
    async (
      leadId,
      status
    ) => {

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

      } catch (err) {

        console.error(err);

        alert("Server error");
      }
    };

  /* =====================================================
     ================= DRAG START =========================
     ===================================================== */

  const handleDragStart = (
    lead
  ) => {

    setDraggedLead(lead);
  };

  /* =====================================================
     ================= DROP ===============================
     ===================================================== */

  const handleDrop = async (
    status
  ) => {

    if (!draggedLead) return;

    await updateLeadStatus(
      draggedLead._id,
      status
    );

    setDraggedLead(null);
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
     ================= HANDLE LOGOUT ======================
     ===================================================== */

  const handleLogout = () => {

    logout();

    navigate("/login");
  };

  /* =====================================================
     ======================= LOADING ======================
     ===================================================== */

  if (loading) {

    return (

      <div style={loadingContainer}>

        <h2>
          Loading CRM Pipeline...
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
            Sales Pipeline
          </p>

        </div>

        <button
          style={menuItem}
          onClick={() =>
            navigate("/sales")
          }
        >
          📞 Sales Dashboard
        </button>

        <button
          style={{
            ...menuItem,
            background:
              "linear-gradient(135deg, #2563eb, #1d4ed8)"
          }}
        >
          📌 Kanban Board
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
              📌 CRM Kanban Pipeline
            </h1>

            <p style={headerSubtitle}>
              Drag and drop leads between
              sales stages to manage your
              EV sales workflow efficiently.
            </p>

          </div>

          <NotificationBell />

        </div>

        {/* ================= BOARD ================= */}

        <div style={board}>

          {PIPELINE_STAGES.map((stage) => (

            <div
              key={stage.key}
              style={column}
              onDragOver={(e) =>
                e.preventDefault()
              }
              onDrop={() =>
                handleDrop(stage.key)
              }
            >

              {/* ================= HEADER ================= */}

              <div style={columnHeader}>

                <h3 style={columnTitle}>
                  {stage.label}
                </h3>

                <span style={countBadge}>

                  {
                    leads.filter(
                      (l) =>
                        kanbanBucketKey(
                          l.status
                        ) ===
                        stage.key
                    ).length
                  }

                </span>

              </div>

              {/* ================= LEADS ================= */}

              <div style={columnBody}>

                {leads
                  .filter(
                    (lead) =>
                      kanbanBucketKey(
                        lead.status
                      ) ===
                      stage.key
                  )
                  .map((lead) => (

                    <div
                      key={lead._id}
                      draggable

                      onDragStart={() =>
                        handleDragStart(
                          lead
                        )
                      }

                      style={leadCard}
                    >

                      <h4 style={leadName}>
                        {lead.name}
                      </h4>

                      <p style={leadInfo}>
                        📞 {lead.phone}
                      </p>

                      <p style={leadInfo}>
                        🚗{" "}
                        {lead.vehicleName ||

                          lead.carId?.name ||

                          "—"}
                      </p>

                      {/* PRIORITY */}

                      <div
                        style={{
                          ...priorityBadge,

                          background:
                            getPriorityColor(
                              lead.priority
                            )
                        }}
                      >
                        {
                          lead.priority ||
                          "medium"
                        }
                      </div>

                      {/* FOLLOW-UP */}

                      {lead.nextFollowUp && (

                        <div style={followUpBox}>

                          📅{" "}

                          {new Date(
                            lead.nextFollowUp
                          ).toLocaleString()}

                        </div>

                      )}

                      {/* NOTES */}

                      <div style={noteCount}>

                        📝 Notes:
                        {" "}

                        {
                          lead.notes
                            ?.length || 0
                        }

                      </div>

                      <button
                        type="button"
                        draggable={false}
                        style={detailsBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailLead(lead);
                        }}
                      >
                        View details
                      </button>

                    </div>

                  ))}

              </div>

            </div>

          ))}

        </div>

        <LeadDetailDrawer

          lead={detailLead}

          open={Boolean(detailLead)}

          onClose={() =>
            setDetailLead(null)
          }

          token={token}

          onUpdated={
            handleLeadUpdatedFromDrawer
          }
        />

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
  marginBottom: "24px"
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
  padding: "30px",
  overflowX: "auto"
};

const header = {
  background:
    "linear-gradient(135deg, #1e3a8a, #2563eb)",
  color: "white",
  padding: "30px",
  borderRadius: "24px",
  marginBottom: "28px",
  boxShadow:
    "0 15px 40px rgba(37,99,235,0.25)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap"
};

const headerTitle = {
  margin: 0,
  fontSize: "40px",
  fontWeight: "800"
};

const headerSubtitle = {
  marginTop: "12px",
  color: "#dbeafe",
  lineHeight: "1.8",
  maxWidth: "700px"
};

const board = {
  display: "flex",
  gap: "22px",
  alignItems: "flex-start",
  minHeight: "80vh",
  overflowX: "auto",
  paddingBottom: "20px"
};

const column = {
  minWidth: "320px",
  background: "#e2e8f0",
  borderRadius: "24px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  boxShadow:
    "inset 0 1px 3px rgba(255,255,255,0.4)"
};

const columnHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px"
};

const columnTitle = {
  margin: 0,
  textTransform: "none",
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "700"
};

const countBadge = {
  background: "#0f172a",
  color: "white",
  borderRadius: "999px",
  minWidth: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: "700",
  padding: "0 10px"
};

const columnBody = {
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const leadCard = {
  background: "white",
  padding: "18px",
  borderRadius: "20px",
  cursor: "grab",
  boxShadow:
    "0 10px 24px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
  transition: "0.3s"
};

const leadName = {
  marginBottom: "12px",
  color: "#0f172a",
  fontSize: "22px"
};

const leadInfo = {
  color: "#475569",
  marginBottom: "8px",
  lineHeight: "1.5"
};

const priorityBadge = {
  marginTop: "14px",
  color: "white",
  padding: "7px 12px",
  borderRadius: "999px",
  display: "inline-block",
  fontSize: "12px",
  textTransform: "capitalize",
  fontWeight: "700"
};

const followUpBox = {
  marginTop: "14px",
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "14px",
  fontSize: "13px",
  color: "#334155",
  border: "1px solid #e2e8f0"
};

const noteCount = {
  marginTop: "14px",
  fontSize: "13px",
  color: "#64748b"
};

const detailsBtn = {
  marginTop: "12px",
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#1e40af",
  fontWeight: "700",
  fontSize: "13px",
  cursor: "pointer"
};

const loadingContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f7fb"
};