import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  isAuthenticated,
  logout,
  getRole,
} from "./auth";

/* ================= COMPONENTS ================= */

import NotificationBell from "./components/NotificationBell";

/* ================= CHART IMPORT ================= */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

/* ================= API ================= */

import { API_URL } from "./config";

import {
  labelForStatus
} from "./crm/leadPipeline";

/* =========================================================
   ===================== LEAD TABLE HELPERS ==================
   ========================================================= */

function statusBadge(status) {

  const map = {

    new: {
      bg: "#dbeafe",
      fg: "#1d4ed8",
    },

    assigned: {
      bg: "#fef3c7",
      fg: "#b45309",
    },

    contacted: {
      bg: "#e0e7ff",
      fg: "#4338ca",
    },

    interested: {
      bg: "#dcfce7",
      fg: "#15803d",
    },

    negotiation: {
      bg: "#ffedd5",
      fg: "#c2410c",
    },

    test_drive: {
      bg: "#cffafe",
      fg: "#0e7490",
    },

    won: {
      bg: "#bbf7d0",
      fg: "#166534",
    },

    converted: {
      bg: "#bbf7d0",
      fg: "#166534",
    },

    lost: {
      bg: "#fee2e2",
      fg: "#b91c1c",
    },
  };

  const c =
    map[status] ||
    map.new;

  return {

    display: "inline-block",

    padding: "4px 10px",

    borderRadius: "999px",

    fontWeight: "700",

    fontSize: "11px",

    textTransform: "uppercase",

    background: c.bg,

    color: c.fg,
  };
}

const thCell = {

  padding: "10px 8px",

  fontWeight: "600",

  whiteSpace: "nowrap",
};

const tdCell = {

  padding: "10px 8px",

  verticalAlign: "top",
};

const newBadge = {

  display: "inline-block",

  padding: "3px 8px",

  borderRadius: "8px",

  fontSize: "10px",

  fontWeight: "800",

  background: "#2563eb",

  color: "white",
};

const linkBtn = {

  border: "none",

  background: "transparent",

  color: "#2563eb",

  cursor: "pointer",

  fontSize: "12px",

  fontWeight: "600",

  textDecoration: "underline",
  padding: 0,
};

/* =========================================================
   ==================== ADMIN DASHBOARD =====================
   ========================================================= */

export default function Admin() {
  const navigate = useNavigate();

  const role = getRole();

  const token = localStorage.getItem(
    "token"
  );

  /* =====================================================
     ====================== STATES ========================
     ===================================================== */

  const [analytics, setAnalytics] =
    useState(null);

  const [leads, setLeads] =
    useState([]);

  const [salesUsers, setSalesUsers] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [assignments, setAssignments] =
    useState({});

  const [assignmentDealers, setAssignmentDealers] =
    useState({});

  const [dealersList, setDealersList] =
    useState([]);

  const [dealerPick, setDealerPick] =
    useState({});

  const [dealerForm, setDealerForm] =
    useState({
      name: "",
      email: "",
      password: "",
      phone: "",
      cities: "",
      brands: "",
    });

  const [opsSummary, setOpsSummary] =
    useState(null);

  /* ================= ADD CAR ================= */

  const [carForm, setCarForm] =
  useState({
    name: "",
    brand: "",
    slug: "",
    category: "SUV",
    status: "active",

    startingPrice: "",
    topVariantPrice: "",

    batteryCapacity: "",
    range: "",
    chargingTime: "",
    topSpeed: "",

    overview: "",

    features: "",
    safety: "",

    galleryImages: "",
    colors: "",
    variants: "",

    isFeatured: false,
  });
  const [heroImage, setHeroImage] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

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

  useEffect(() => {
    fetch(
      `${API_URL}/api/admin/analytics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())

      .then((data) =>
        setAnalytics(data || {})
      )

      .catch(() =>
        setAnalytics({})
      );
  }, []);

  useEffect(() => {
    if (role !== "admin") return;

    fetch(`${API_URL}/api/admin/ops-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setOpsSummary(data))
      .catch(() => setOpsSummary(null));
  }, [role, token]);

  /* =====================================================
     ================= FETCH LEADS ========================
     ===================================================== */

  const fetchLeads = () => {
    fetch(
      `${API_URL}/api/admin/leads?page=${page}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())

      .then((data) => {
        setLeads(data.leads || []);

        setTotalPages(
          data.totalPages || 1
        );
      })

      .catch(() => setLeads([]));
  };

  useEffect(() => {
    fetchLeads();
  }, [page]);

  /* =====================================================
     ================= FETCH SALES USERS ==================
     ===================================================== */

  useEffect(() => {
    if (role !== "admin") return;

    fetch(`${API_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())

      .then((data) => {
        const onlySales = data.filter(
          (u) => u.role === "sales"
        );

        setSalesUsers(onlySales);
      })

      .catch(() => {
        setSalesUsers([]);
      });
  }, []);

  useEffect(() => {
    if (role !== "admin") return;

    fetch(`${API_URL}/api/admin/dealers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())

      .then((data) => {
        setDealersList(Array.isArray(data) ? data : []);
      })

      .catch(() => {
        setDealersList([]);
      });
  }, [role, token]);

  /* =====================================================
     ================= ASSIGN LEAD ========================
     ===================================================== */

  const assignLead = async (
    leadId
  ) => {
    const assignedTo =
      assignments[leadId];

    const dealerId =
      dealerPick[leadId];

    if (!assignedTo && !dealerId) {
      alert("Select a sales user and/or dealer account");

      return;
    }

    try {
      const body = {};

      if (assignedTo) {
        body.assignedTo = assignedTo;
      }

      if (dealerId) {
        body.dealerId = dealerId;
      }

      const desk =
        assignmentDealers[leadId];

      if (desk != null && desk !== "") {
        body.assignedDealer = desk;
      }

      const response = await fetch(
        `${API_URL}/api/admin/leads/${leadId}/assign`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Assignment failed"
        );

        return;
      }

      fetchLeads();

      alert(
        "Lead assigned successfully"
      );
    } catch (err) {
      console.error(err);

      alert("Server error");
    }
  };

  const createDealer = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/admin/dealers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: dealerForm.name,
          email: dealerForm.email,
          password: dealerForm.password,
          phone: dealerForm.phone,
          cities: dealerForm.cities,
          brands: dealerForm.brands,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || data.errors?.join?.(", ") || "Failed");
        return;
      }

      setDealerForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        cities: "",
        brands: "",
      });

      const list = await fetch(`${API_URL}/api/admin/dealers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      setDealersList(Array.isArray(list) ? list : []);

      alert("Dealer created");
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const toggleDealerActive = async (dealerId, next) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dealers/${dealerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: next }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Update failed");
        return;
      }

      const list = await fetch(`${API_URL}/api/admin/dealers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      setDealersList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================================================
     ================= CREATE CAR =========================
     ===================================================== */

  const handleCreateCar =
    async (e) => {
      e.preventDefault();

      try {
        setUploading(true);

        const formData =
          new FormData();

        Object.keys(carForm).forEach(
          (key) => {
            formData.append(
              key,
              carForm[key]
            );
          }
        );

        formData.append(
          "heroImage",
          heroImage
        );

        formData.append(
          "specifications",

          JSON.stringify({
            batteryPack:
              carForm.batteryCapacity,

            range:
              Number(carForm.range) || 0,

            chargingTime:
              carForm.chargingTime,

            topSpeed:
              carForm.topSpeed,
          })
        );

        formData.append(
          "features",

          JSON.stringify(
            carForm.features
              .split(",")
              .map((f) => f.trim())
          )
        );

        formData.append(
          "safety",

          JSON.stringify(
            carForm.safety
              .split(",")
              .map((f) => f.trim())
          )
        );

        formData.append(
          "overview",
          carForm.overview
        );

        formData.append(
          "colors",

          JSON.stringify(
            carForm.colors
              ? carForm.colors
                  .split("\n")
                  .map((line) => {
                    const [
                      name,
                      image,
                    ] = line.split("|");

                    return {
                      name:
                        name?.trim(),
                      image:
                        image?.trim(),
                    };
                  })
              : []
          )
        );

        formData.append(
          "variants",

          JSON.stringify(
            carForm.variants
              ? carForm.variants
                  .split("\n")
                  .map((line) => {
                    const [
                      name,
                      price,
                      batteryPack,
                      range,
                    ] = line.split("|");

                    return {
                      name:
                        name?.trim(),

                      price:
                        Number(price) || 0,

                      batteryPack:
                        batteryPack?.trim(),

                      range:
                        Number(range) || 0,
                    };
                  })
              : []
          )
        );

        const response =
          await fetch(
            `${API_URL}/cars`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.error ||
              "Failed to create car"
          );

          return;
        }

        alert(
          "Car created successfully 🚀"
        );

        setCarForm({
          name: "",
          brand: "",
          slug: "",
          category: "SUV",
          status: "active",

          startingPrice: "",
          topVariantPrice: "",

          batteryCapacity: "",
          range: "",
          chargingTime: "",
          topSpeed: "",

          overview: "",

          features: "",
          safety: "",

          galleryImages: "",
          colors: "",
          variants: "",

          isFeatured: false,
        });
        setHeroImage(null);
      } catch (err) {
        console.error(err);

        alert("Server error");
      } finally {
        setUploading(false);
      }
    };

  /* =====================================================
     ======================= LOADING ======================
     ===================================================== */

  if (!analytics) {
    return (
      <h2
        style={{
          textAlign: "center",
        }}
      >
        Loading...
      </h2>
    );
  }

  /* =====================================================
     ====================== SAFE DATA =====================
     ===================================================== */

  const leadsPerCar =
    analytics?.leadsPerCar || [];

  const leadsOverTime =
    analytics?.leadsOverTime || [];

  const performance =
    analytics?.performance || [];

  const chartData =
    leadsPerCar.map((i) => ({
      car: i.carName,
      leads: i.count,
    }));

  const trendData =
    leadsOverTime.map((i) => ({
      date: i._id,
      leads: i.count,
    }));

  /* =====================================================
     ========================= UI =========================
     ===================================================== */

  return (
    <div style={layout}>
      {/* ================= SIDEBAR ================= */}

      <div style={sidebar}>
        <h2>EVSavari</h2>

        <Link
          to="/admin"
          style={menuItem}
        >
          📊 Dashboard
        </Link>

        <a
          href="#add-car"
          style={menuItem}
        >
          🚘 Add Car
        </a>

        <a
          href="#recent-leads"
          style={menuItem}
        >
          📥 Leads
        </a>

        <Link
          to="/kanban"
          style={menuItem}
        >
          📌 Kanban CRM
        </Link>

        {role === "admin" && (
          <>
            <Link
              to="/admin/analytics"
              style={menuItem}
            >
              📈 Analytics
            </Link>

            <Link
              to="/admin/traffic"
              style={menuItem}
            >
              📊 Traffic intelligence
            </Link>

            <Link
              to="/admin/dealer-applications"
              style={menuItem}
            >
              📝 Dealer applications
            </Link>

            <Link
              to="/sales-analytics"
              style={menuItem}
            >
              🏆 Sales Analytics
            </Link>

            <Link
              to="/admin/users"
              style={menuItem}
            >
              👥 Sales Users
            </Link>

            <Link
              to="/admin/editorial"
              style={menuItem}
            >
              📋 Editorial Ops
            </Link>

            <a
              href="#dealers"
              style={menuItem}
            >
              🏢 Dealers
            </a>
          </>
        )}
      </div>

      {/* ================= MAIN ================= */}

      <div style={main}>
        {/* ================= HEADER ================= */}

        <div style={premiumHeader}>
          <div>
            <h1>
              📊 EVSavari CRM Dashboard
            </h1>

            <p>
              Real-time insights &
              lead management
            </p>
          </div>

          <div style={headerActions}>
            <NotificationBell />

            <button
              onClick={() => {
                logout();

                navigate("/login");
              }}
              style={logoutBtn}
            >
              Logout
            </button>
          </div>
        </div>

        {role === "admin" && opsSummary && (
          <div style={card}>
            <h2 style={sectionTitle}>⚙️ Operations pulse</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Overdue follow-ups
                </div>
                <strong style={{ fontSize: "1.25rem", color: "#dc2626" }}>
                  {opsSummary.overdueCount}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Avg response (hrs)
                </div>
                <strong style={{ fontSize: "1.25rem" }}>
                  {opsSummary.avgResponseHours ?? "—"}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Pending dealer apps
                </div>
                <strong style={{ fontSize: "1.25rem" }}>
                  {opsSummary.pendingDealerApplications}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Active dealers
                </div>
                <strong style={{ fontSize: "1.25rem" }}>
                  {opsSummary.activeDealers}
                </strong>
              </div>
            </div>
            {opsSummary.overdueLeads?.length > 0 && (
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748b" }}>
                Overdue:{" "}
                {opsSummary.overdueLeads
                  .slice(0, 5)
                  .map((l) => l.name)
                  .join(", ")}
              </p>
            )}
            {opsSummary.dealerActivity?.length > 0 && (
              <div style={{ fontSize: "13px" }}>
                <strong>Dealer activity (7d):</strong>{" "}
                {opsSummary.dealerActivity
                  .slice(0, 4)
                  .map((d) => `${d.name} (${d.leads7d} leads)`)
                  .join(" · ")}
              </div>
            )}
          </div>
        )}

        {role === "admin" && (
          <div id="dealers" style={card}>
            <h2 style={sectionTitle}>🏢 Dealer accounts</h2>

            <form
              onSubmit={createDealer}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <input
                placeholder="Name"
                required
                value={dealerForm.name}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    name: e.target.value,
                  })
                }
                style={input}
              />
              <input
                placeholder="Email"
                type="email"
                required
                value={dealerForm.email}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    email: e.target.value,
                  })
                }
                style={input}
              />
              <input
                placeholder="Password"
                type="password"
                required
                value={dealerForm.password}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    password: e.target.value,
                  })
                }
                style={input}
              />
              <input
                placeholder="Phone"
                value={dealerForm.phone}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    phone: e.target.value,
                  })
                }
                style={input}
              />
              <input
                placeholder="Cities (comma-separated)"
                value={dealerForm.cities}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    cities: e.target.value,
                  })
                }
                style={input}
              />
              <input
                placeholder="Brands (comma-separated)"
                value={dealerForm.brands}
                onChange={(e) =>
                  setDealerForm({
                    ...dealerForm,
                    brands: e.target.value,
                  })
                }
                style={input}
              />
              <button type="submit" style={submitBtn}>
                Create dealer
              </button>
            </form>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                    }}
                  >
                    <th style={thCell}>Name</th>
                    <th style={thCell}>Email</th>
                    <th style={thCell}>Cities</th>
                    <th style={thCell}>Brands</th>
                    <th style={thCell}>Active</th>
                    <th style={thCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dealersList.map((d) => (
                    <tr key={d._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdCell}>{d.name}</td>
                      <td style={tdCell}>{d.email}</td>
                      <td style={tdCell}>
                        {(d.cities || []).join(", ") || "—"}
                      </td>
                      <td style={tdCell}>
                        {(d.brands || []).join(", ") || "—"}
                      </td>
                      <td style={tdCell}>
                        {d.isActive ? "Yes" : "No"}
                      </td>
                      <td style={tdCell}>
                        <button
                          type="button"
                          style={linkBtn}
                          onClick={() =>
                            toggleDealerActive(d._id, !d.isActive)
                          }
                        >
                          {d.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================
           ================= RECENT LEADS ======================
           ===================================================== */}

        <div
          id="recent-leads"
          style={card}
        >

          <h2 style={sectionTitle}>
            📥 Recent leads
          </h2>

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                fontSize: "13px",
              }}
            >

              <thead>

                <tr
                  style={{
                    textAlign: "left",
                    borderBottom:
                      "1px solid #e2e8f0",
                    color: "#64748b",
                  }}
                >

                  <th style={thCell}>
                    New
                  </th>

                  <th style={thCell}>
                    Date
                  </th>

                  <th style={thCell}>
                    Name
                  </th>

                  <th style={thCell}>
                    Phone
                  </th>

                  <th style={thCell}>
                    Email
                  </th>

                  <th style={thCell}>
                    City
                  </th>

                  <th style={thCell}>
                    Vehicle
                  </th>

                  <th style={thCell}>
                    Page
                  </th>

                  <th style={thCell}>
                    Channel
                  </th>

                  <th style={thCell}>
                    SLA
                  </th>

                  <th style={thCell}>
                    Status
                  </th>

                  <th style={thCell}>
                    Dealership
                  </th>

                  <th style={thCell}>
                    Message
                  </th>

                  <th style={thCell}>
                    Assign
                  </th>

                  <th style={thCell} />

                </tr>

              </thead>

              <tbody>

                {leads.map(
                  (lead) => {

                    const isUnread =

                      lead.status ===
                        "new" &&
                      !lead.readByAdmin;

                    return (

                      <tr
                        key={
                          lead._id
                        }
                        style={{
                          borderBottom:
                            "1px solid #f1f5f9",
                          background:
                            isUnread
                              ? "#eff6ff"
                              : "transparent",
                        }}
                      >

                        <td style={tdCell}>

                          {isUnread ? (

                            <span
                              style={
                                newBadge
                              }
                            >
                              NEW
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td style={tdCell}>

                          {lead.createdAt
                            ? new Date(
                              lead.createdAt
                            ).toLocaleString()
                            : "—"}
                        </td>

                        <td style={tdCell}>
                          {lead.name}
                        </td>

                        <td style={tdCell}>
                          {lead.phone}
                        </td>

                        <td style={tdCell}>
                          {lead.email ||
                            "—"}
                        </td>

                        <td style={tdCell}>
                          {lead.city ||
                            "—"}
                        </td>

                        <td style={tdCell}>

                          {lead.vehicleName ||

                            lead.carId
                              ?.name ||

                            "—"}
                        </td>

                        <td style={tdCell}>

                          {lead.sourcePage ||
                            "—"}
                        </td>

                        <td style={tdCell}>
                          {lead.leadSource || "form"}
                        </td>

                        <td style={tdCell}>
                          {(() => {
                            const overdue =
                              opsSummary?.overdueLeads?.some(
                                (o) => o._id === lead._id
                              ) ||
                              (lead.createdAt &&
                                !lead.firstRespondedAt &&
                                (Date.now() -
                                  new Date(lead.createdAt).getTime()) /
                                  3600000 >=
                                  48);
                            if (overdue) {
                              return (
                                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                                  Overdue
                                </span>
                              );
                            }
                            if (lead.firstRespondedAt && lead.createdAt) {
                              const hrs = Math.round(
                                ((new Date(lead.firstRespondedAt) -
                                  new Date(lead.createdAt)) /
                                  3600000) *
                                  10
                              ) / 10;
                              return `${hrs}h`;
                            }
                            return "—";
                          })()}
                        </td>

                        <td style={tdCell}>

                          <span
                            style={statusBadge(
                              lead.status
                            )}
                          >

                            {labelForStatus(
                              lead.status
                            )}
                          </span>
                        </td>

                        <td style={tdCell}>
                          {lead.dealer?.name ||
                            lead.dealer?.email ||
                            "—"}
                        </td>

                        <td
                          style={{
                            ...tdCell,
                            maxWidth:
                              "180px",
                            whiteSpace:
                              "nowrap",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                          }}
                          title={
                            lead.message ||
                            ""
                          }
                        >

                          {lead.message ||
                            "—"}
                        </td>

                        <td style={tdCell}>

                          <select
                            style={input}
                            value={
                              assignments[
                                lead._id
                              ] ||
                              ""
                            }
                            onChange={(e) =>
                              setAssignments(
                                {
                                  ...assignments,

                                  [lead._id]:
                                    e.target
                                      .value,
                                }
                              )
                            }
                          >

                            <option value="">
                              Select sales (optional)
                            </option>

                            {salesUsers.map(
                              (u) => (

                                <option
                                  key={
                                    u._id
                                  }
                                  value={
                                    u._id
                                  }
                                >
                                  {u.name}{" "}
                                  (
                                  {
                                    u.email
                                  }
                                  )
                                </option>
                              )
                            )}
                          </select>

                          <input
                            type="text"
                            placeholder="Dealer / desk (optional)"
                            style={{
                              ...input,
                              marginTop: "6px",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                            value={
                              assignmentDealers[
                                lead._id
                              ] || ""
                            }
                            onChange={(e) =>
                              setAssignmentDealers(
                                {
                                  ...assignmentDealers,

                                  [lead._id]:
                                    e.target
                                      .value,
                                }
                              )
                            }
                          />

                          <select
                            style={{
                              ...input,
                              marginTop: "6px",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                            value={
                              dealerPick[
                                lead._id
                              ] || ""
                            }
                            onChange={(e) =>
                              setDealerPick({
                                ...dealerPick,

                                [lead._id]:
                                  e.target
                                    .value,
                              })
                            }
                          >

                            <option value="">
                              Dealer account (optional)
                            </option>

                            {dealersList.map(
                              (d) => (

                                <option
                                  key={d._id}
                                  value={d._id}
                                >
                                  {d.name}{" "}
                                  ({d.email})
                                </option>
                              )
                            )}
                          </select>

                          <button
                            type="button"
                            style={{
                              ...submitBtn,
                              marginTop:
                                "8px",
                              width:
                                "100%",
                              fontSize:
                                "12px",
                              padding:
                                "8px 10px",
                            }}
                            onClick={() =>
                              assignLead(
                                lead._id
                              )
                            }
                          >
                            Assign
                          </button>
                        </td>

                        <td style={tdCell}>

                          {role ===
                            "admin" &&
                            isUnread && (

                              <button
                                type="button"
                                style={
                                  linkBtn
                                }
                                onClick={async () => {

                                  try {

                                    await fetch(

                                      `${API_URL}/api/admin/leads/${lead._id}/read`,

                                      {
                                        method:
                                          "PUT",

                                        headers:
                                          {
                                            Authorization:
                                              `Bearer ${token}`,
                                          },
                                      }
                                    );

                                    fetchLeads();
                                  } catch (e) {

                                    console.error(
                                      e
                                    );
                                  }
                                }}
                              >
                                Mark read
                              </button>
                            )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginTop: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >

            <button
              type="button"
              style={submitBtn}
              disabled={
                page <= 1
              }
              onClick={() =>
                setPage(
                  (p) =>
                    Math.max(
                      1,
                      p - 1
                    )
                )
              }
            >
              Prev
            </button>

            <span
              style={{
                fontSize: "14px",
                color: "#64748b",
              }}
            >

              Page {page} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              style={submitBtn}
              disabled={
                page >=
                totalPages
              }
              onClick={() =>
                setPage(
                  (p) =>
                    p + 1
                )
              }
            >
              Next
            </button>

          </div>

        </div>

        {/* =====================================================
           ================= ADD CAR SECTION ===================
           ===================================================== */}

        <div
          id="add-car"
          style={card}
        >
          <h2 style={sectionTitle}>
            🚘 Add New Car
          </h2>

          <form
            onSubmit={
              handleCreateCar
            }
            style={formGrid}
          >
            <input
              type="text"
              placeholder="Car Name"
              value={carForm.name}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  name:
                    e.target.value,
                })
              }
              style={input}
              required
            />

            <input
              type="text"
              placeholder="Brand"
              value={carForm.brand}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  brand:
                    e.target.value,
                })
              }
              style={input}
              required
            />

            <input
              type="text"
              placeholder="Slug"
              value={carForm.slug}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  slug:
                    e.target.value,
                })
              }
              style={input}
              required
            />

            <input
              type="number"
              placeholder="Starting Price"
              value={
                carForm.startingPrice
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  startingPrice:
                    e.target.value,
                })
              }
              style={input}
              required
            />

            <input
              type="number"
              placeholder="Top Variant Price"
              value={
                carForm.topVariantPrice
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  topVariantPrice:
                    e.target.value,
                })
              }
              style={input}
            />

            <input
              type="text"
              placeholder="Battery Capacity"
              value={
                carForm.batteryCapacity
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  batteryCapacity:
                    e.target.value,
                })
              }
              style={input}
            />

            <input
              type="text"
              placeholder="Range"
              value={carForm.range}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  range:
                    e.target.value,
                })
              }
              style={input}
            />

            <input
              type="text"
              placeholder="Charging Time"
              value={
                carForm.chargingTime
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  chargingTime:
                    e.target.value,
                })
              }
              style={input}
            />

            <input
              type="text"
              placeholder="Top Speed"
              value={
                carForm.topSpeed
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  topSpeed:
                    e.target.value,
                })
              }
              style={input}
            />

            <textarea
              placeholder="Features separated by comma"
              value={
                carForm.features
              }
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  features:
                    e.target.value,
                })
              }
              style={textarea}
            />

            <textarea
              placeholder="Safety Features separated by comma"
              value={carForm.safety}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  safety:
                    e.target.value,
                })
              }
              style={textarea}
            />

            <textarea
              placeholder="Vehicle Overview"
              value={carForm.overview}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  overview:
                    e.target.value,
                })
              }
              style={textarea}
            />

            <textarea
              placeholder={`Colors Format:
            Blue | https://image-url.com
            White | https://image-url.com`}
              value={carForm.colors}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  colors:
                    e.target.value,
                })
              }
              style={textarea}
            />

            <textarea
              placeholder={`Variants Format:
            Long Range | 2500000 | 55 kWh | 585
            Performance | 3200000 | 72 kWh | 650`}
              value={carForm.variants}
              onChange={(e) =>
                setCarForm({
                  ...carForm,
                  variants:
                    e.target.value,
                })
              }
              style={textarea}
            />

            <div
              style={uploadWrapper}
            >
              <label>
                Hero Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setHeroImage(
                    e.target.files[0]
                  )
                }
              />
            </div>

            <label
              style={checkboxRow}
            >
              <input
                type="checkbox"
                checked={
                  carForm.isFeatured
                }
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    isFeatured:
                      e.target
                        .checked,
                  })
                }
              />

              Featured Car
            </label>

            <button
              type="submit"
              style={submitBtn}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Create Car"}
            </button>
          </form>
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
};

const sidebar = {
  width: "240px",
  background: "#0f172a",
  color: "white",
  padding: "24px",
  minHeight: "100vh",
};

const main = {
  flex: 1,
  padding: "30px",
  background: "#f5f7fb",
};

const card = {
  background: "white",
  padding: "24px",
  borderRadius: "20px",
  marginBottom: "24px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.06)",
};

const premiumHeader = {
  background:
    "linear-gradient(135deg,#0f172a,#2563eb)",
  color: "white",
  padding: "24px",
  borderRadius: "20px",
  marginBottom: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const logoutBtn = {
  background: "white",
  color: "#0f172a",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "700",
};

const menuItem = {
  display: "block",
  color: "white",
  textDecoration: "none",
  marginBottom: "16px",
  opacity: 0.9,
};

const sectionTitle = {
  marginBottom: "24px",
  color: "#0f172a",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(260px,1fr))",
  gap: "18px",
};

const input = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #dbe2ea",
  fontSize: "14px",
};

const textarea = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #dbe2ea",
  minHeight: "120px",
  gridColumn: "1 / -1",
};

const uploadWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const checkboxRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const submitBtn = {
  background:
    "linear-gradient(135deg,#2563eb,#1d4ed8)",
  color: "white",
  border: "none",
  padding: "14px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "15px",
};