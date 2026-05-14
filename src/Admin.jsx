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

  /* =====================================================
     ================= FETCH LEADS ========================
     ===================================================== */

  const fetchLeads = () => {
    fetch(
      `${API_URL}/api/admin/leads?page=${page}&limit=5`,
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

  /* =====================================================
     ================= ASSIGN LEAD ========================
     ===================================================== */

  const assignLead = async (
    leadId
  ) => {
    const assignedTo =
      assignments[leadId];

    if (!assignedTo) {
      alert("Select sales user");

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/leads/${leadId}/assign`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            assignedTo,
          }),
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
      console.log(err);

      alert("Server error");
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
        console.log(err);

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
        <h2>Zyvev</h2>

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
          </>
        )}
      </div>

      {/* ================= MAIN ================= */}

      <div style={main}>
        {/* ================= HEADER ================= */}

        <div style={premiumHeader}>
          <div>
            <h1>
              📊 Zyvev CRM Dashboard
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