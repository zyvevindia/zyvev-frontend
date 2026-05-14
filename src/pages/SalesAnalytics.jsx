import { useEffect, useState } from "react";
import { API_URL } from "../config";

import {
  useNavigate
} from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import {
  logout,
  isAuthenticated
} from "../auth";

/* =========================================================
   ================= SALES ANALYTICS =======================
   ========================================================= */

export default function SalesAnalytics() {

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  /* ================= STATE ================= */

  const [analytics, setAnalytics] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     ================= AUTO LOGOUT ========================
     ===================================================== */

  useEffect(() => {

    const interval = setInterval(() => {

      if (!isAuthenticated()) {

        logout();

        navigate("/login");
      }

    }, 60000);

    return () => clearInterval(interval);

  }, [navigate]);

  /* =====================================================
     ================= FETCH ANALYTICS ====================
     ===================================================== */

  const fetchAnalytics = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/admin/sales-performance`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setError(
          data.error ||
          "Failed to load analytics"
        );

        return;
      }

      setAnalytics(
        Array.isArray(data)
          ? data
          : data.analytics || []
      );

    } catch (err) {

      console.log(err);

      setError("Server error");

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     ================= INITIAL LOAD =======================
     ===================================================== */

  useEffect(() => {

    fetchAnalytics();

  }, []);

  /* =====================================================
     ================= HANDLE LOGOUT ======================
     ===================================================== */

  const handleLogout = () => {

    logout();

    navigate("/login");
  };

  /* =====================================================
     ==================== TOTALS ==========================
     ===================================================== */

  const totals = (
      Array.isArray(analytics)
        ? analytics
        : []
    ).reduce(

    (acc, item) => {

      acc.totalAssigned += item.totalAssigned;

      acc.converted += item.converted;

      acc.revenue += item.revenue;

      acc.overdue += item.overdue;

      return acc;

    },

    {
      totalAssigned: 0,
      converted: 0,
      revenue: 0,
      overdue: 0
    }
  );

  /* =====================================================
     ======================= LOADING ======================
     ===================================================== */

  if (loading) {

    return (

      <div style={loadingContainer}>

        <h2>
          Loading Sales Analytics...
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

        <h2>EVSavari CRM</h2>

        <button
          style={menuItem}
          onClick={() =>
            navigate("/admin")
          }
        >
          📊 Admin Dashboard
        </button>

        <button
          style={{
            ...menuItem,
            background: "#1e3c72"
          }}
        >
          🏆 Sales Analytics
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

          <h1>
            🏆 Sales Performance Analytics
          </h1>

          <p>
            Monitor team performance,
            conversions & revenue
          </p>

        </div>

        {/* ================= ERROR ================= */}

        {error && (

          <div style={errorBox}>
            {error}
          </div>

        )}

        {/* ================= KPI GRID ================= */}

        <div style={kpiGrid}>

          <div style={kpiCard}>

            <p>Total Assigned Leads</p>

            <h2>
              {totals.totalAssigned}
            </h2>

          </div>

          <div style={kpiCard}>

            <p>Total Conversions</p>

            <h2>
              {totals.converted}
            </h2>

          </div>

          <div style={kpiCard}>

            <p>Total Revenue</p>

            <h2>
              ₹ {totals.revenue}
            </h2>

          </div>

          <div style={kpiCard}>

            <p>Overdue Follow-Ups</p>

            <h2>
              {totals.overdue}
            </h2>

          </div>

        </div>

        {/* ================= CHART ================= */}

        <div style={chartCard}>

          <div style={cardHeader}>

            <h3>
              📈 Conversion Performance
            </h3>

          </div>

          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <BarChart data={analytics}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="converted"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* ================= LEADERBOARD ================= */}

        <div style={tableCard}>

          <div style={cardHeader}>

            <h3>
              🏅 Sales Leaderboard
            </h3>

          </div>

          <table style={table}>

            <thead>

              <tr>

                <th>Rank</th>

                <th>Sales User</th>

                <th>Assigned</th>

                <th>Contacted</th>

                <th>Interested</th>

                <th>Negotiation</th>

                <th>Converted</th>

                <th>Lost</th>

                <th>Conversion %</th>

                <th>Revenue</th>

                <th>Overdue</th>

              </tr>

            </thead>

            <tbody>

              {analytics.map(
                (user, index) => (

                  <tr
                    key={user.salesUserId}
                  >

                    <td>
                      #{index + 1}
                    </td>

                    <td>

                      <div>

                        <strong>
                          {user.name}
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.7
                          }}
                        >
                          {user.email}
                        </div>

                      </div>

                    </td>

                    <td>
                      {user.totalAssigned}
                    </td>

                    <td>
                      {user.contacted}
                    </td>

                    <td>
                      {user.interested}
                    </td>

                    <td>
                      {user.negotiation}
                    </td>

                    <td>
                      {user.converted}
                    </td>

                    <td>
                      {user.lost}
                    </td>

                    <td>

                      <span
                        style={{
                          ...conversionBadge,

                          background:
                            Number(
                              user.conversionRate
                            ) >= 20

                              ? "#16a34a"

                              : "#ea580c"
                        }}
                      >

                        {user.conversionRate}%

                      </span>

                    </td>

                    <td>
                      ₹ {user.revenue}
                    </td>

                    <td>

                      <span
                        style={{
                          ...overdueBadge,

                          background:
                            user.overdue > 0
                              ? "#dc2626"
                              : "#16a34a"
                        }}
                      >

                        {user.overdue}

                      </span>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

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
  background: "#f5f7fb"
};

const sidebar = {
  width: "220px",
  background: "#111",
  color: "white",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const menuItem = {
  background: "transparent",
  border: "none",
  color: "white",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px"
};

const main = {
  flex: 1,
  padding: "30px"
};

const header = {
  background: "#1e3c72",
  color: "white",
  padding: "25px",
  borderRadius: "14px",
  marginBottom: "20px"
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "20px"
};

const kpiCard = {
  background: "white",
  padding: "20px",
  borderRadius: "14px",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.08)"
};

const chartCard = {
  background: "white",
  padding: "20px",
  borderRadius: "14px",
  marginBottom: "20px",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.08)"
};

const tableCard = {
  background: "white",
  padding: "20px",
  borderRadius: "14px",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.08)",
  overflowX: "auto"
};

const cardHeader = {
  marginBottom: "20px"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const conversionBadge = {
  color: "white",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold"
};

const overdueBadge = {
  color: "white",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold"
};

const loadingContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "20px"
};