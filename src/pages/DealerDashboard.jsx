import {
  useEffect,
  useState
} from "react";

import { API_URL } from "../config";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  logout,
  isAuthenticated
} from "../auth";

import {
  labelForStatus,
  PIPELINE_STATUS_VALUES,
} from "../crm/leadPipeline";

import { openDealerLeadWhatsApp } from "../utils/whatsappOps";
import LeadTimeline from "../components/crm/LeadTimeline";
import DealerQualityBar from "../components/dealer/DealerQualityBar";
import {
  AUDIT_ACTIONS,
  logOpsAudit,
} from "../services/opsAuditLog";
import { hoursSince } from "../utils/leadTimeline";

const QUICK_STATUSES = [
  "contacted",
  "follow_up",
  "interested",
  "won",
  "lost",
];

/* =========================================================
   ==================== DEALER DASHBOARD ===================
   ========================================================= */

export default function DealerDashboard() {

  const navigate = useNavigate();
  const location = useLocation();

  const tabFromPath =
    location.pathname.includes("/leads")
      ? "leads"
      : location.pathname.includes("/profile")
        ? "inventory"
        : "analytics";

  const token =
    localStorage.getItem("token");

  const [tab, setTab] =
    useState(tabFromPath);

  useEffect(() => {
    setTab(tabFromPath);
  }, [tabFromPath]);

  const [leads, setLeads] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [analytics, setAnalytics] =
    useState(null);

  const [cars, setCars] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [statusPick, setStatusPick] =
    useState({});

  const [notes, setNotes] =
    useState({});

  const [dealerProfile, setDealerProfile] =
    useState(null);

  const [profileForm, setProfileForm] =
    useState({
      cities: "",
      brands: "",
      phone: "",
    });

  const [showCarModal, setShowCarModal] =
    useState(false);

  const [carForm, setCarForm] =
    useState({
      name: "",
      brand: "",
      slug: "",
      category: "SUV",
      startingPrice: "",
      topVariantPrice: "",
      overview: "",
      galleryImages: "[]",
      colors: "[]",
      variants: "[]",
      features: "[]",
      safety: "[]",
      specifications: "{}",
      dimensions: "{}",
      seo: "{}",
      isFeatured: "false",
      heroFile: null
    });

  useEffect(() => {

    const interval =
      setInterval(() => {

        if (!isAuthenticated()) {

          logout();

          navigate("/dealer/login");
        }

      }, 60000);

    return () =>
      clearInterval(interval);

  }, [navigate]);

  const loadLeads = async () => {

    const res =
      await fetch(
        `${API_URL}/api/dealer/leads`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await res.json();

    if (res.ok) {
      setLeads(data.leads || []);
      setUnreadCount(Number(data.unreadCount || 0));
    }
  };

  const markLeadRead = async (leadId) => {
    await fetch(`${API_URL}/api/dealer/leads/${leadId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUnreadCount((n) => Math.max(0, n - 1));
    setLeads((prev) =>
      prev.map((l) =>
        l._id === leadId ? { ...l, readByDealer: true } : l
      )
    );
    logOpsAudit({
      action: AUDIT_ACTIONS.LEAD_READ_DEALER,
      actorRole: "dealer",
      targetType: "lead",
      targetId: leadId,
    });
  };

  const markAllLeadsRead = async () => {
    await fetch(`${API_URL}/api/dealer/leads/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUnreadCount(0);
    setLeads((prev) => prev.map((l) => ({ ...l, readByDealer: true })));
    logOpsAudit({
      action: AUDIT_ACTIONS.LEAD_READ_ALL_DEALER,
      actorRole: "dealer",
      targetType: "lead",
      metadata: { count: leads.length },
    });
  };

  const loadAnalytics = async () => {

    const res =
      await fetch(
        `${API_URL}/api/dealer/analytics`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await res.json();

    if (res.ok) {

      setAnalytics(data);
    }
  };

  const loadDealer = async () => {
    const res = await fetch(`${API_URL}/api/dealer/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.dealer) {
      setDealerProfile(data.dealer);
      setProfileForm({
        cities: (data.dealer.cities || []).join(", "),
        brands: (data.dealer.brands || []).join(", "),
        phone: data.dealer.phone || "",
      });
    }
  };

  const saveProfile = async () => {
    const res = await fetch(`${API_URL}/api/dealer/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: profileForm.phone,
        cities: profileForm.cities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        brands: profileForm.brands
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Could not save profile");
      return;
    }
    await loadDealer();
    alert("Profile updated");
  };

  const loadCars = async () => {

    const res =
      await fetch(
        `${API_URL}/api/dealer/cars`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await res.json();

    if (res.ok) {

      setCars(data.cars || []);
    }
  };

  const refreshAll = async () => {

    setLoading(true);

    try {

      await Promise.all([
        loadLeads(),
        loadAnalytics(),
        loadCars(),
        loadDealer(),
      ]);
    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    refreshAll();

  }, []);

  const updateStatus = async (
    leadId
  ) => {

    const status =
      statusPick[leadId];

    if (!status) {

      alert("Select a status");

      return;
    }

    const res =
      await fetch(
        `${API_URL}/api/dealer/leads/${leadId}/status`,
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
      await res.json();

    if (!res.ok) {

      alert(
        data.error ||
        "Update failed"
      );

      return;
    }

    logOpsAudit({
      action: AUDIT_ACTIONS.LEAD_STATUS_CHANGED,
      actorRole: "dealer",
      targetType: "lead",
      targetId: leadId,
      metadata: { status },
    });

    await loadLeads();

    await loadAnalytics();
  };

  const quickUpdateStatus = async (leadId, status) => {
    const res = await fetch(
      `${API_URL}/api/dealer/leads/${leadId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Update failed");
      return;
    }
    logOpsAudit({
      action: AUDIT_ACTIONS.LEAD_STATUS_CHANGED,
      actorRole: "dealer",
      targetType: "lead",
      targetId: leadId,
      metadata: { status, quick: true },
    });
    await loadLeads();
    await loadAnalytics();
  };

  const addNote = async (
    leadId
  ) => {

    const text =
      notes[leadId];

    if (!text?.trim()) {

      alert("Enter a note");

      return;
    }

    const res =
      await fetch(
        `${API_URL}/api/dealer/leads/${leadId}/notes`,
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
      await res.json();

    if (!res.ok) {

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

    await loadLeads();

    await loadAnalytics();
  };

  const setListingStatus = async (
    carId,
    dealerListingStatus
  ) => {

    const res =
      await fetch(
        `${API_URL}/api/dealer/cars/${carId}/listing`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            dealerListingStatus
          })
        }
      );

    if (!res.ok) {

      const d =
        await res.json();

      alert(
        d.error ||
        "Could not update"
      );

      return;
    }

    loadCars();
  };

  const openWhatsApp = (lead) => {
    const dealerName =
      JSON.parse(localStorage.getItem("dealer") || "{}")?.name || "";

    if (!openDealerLeadWhatsApp(lead, { name: dealerName })) {
      alert("Invalid phone number");
    }
  };

  const submitNewCar = async (e) => {

    e.preventDefault();

    if (!carForm.heroFile) {

      alert("Hero image is required");

      return;
    }

    const fd =
      new FormData();

    fd.append(
      "name",
      carForm.name
    );

    fd.append(
      "brand",
      carForm.brand
    );

    fd.append(
      "slug",
      carForm.slug
    );

    fd.append(
      "category",
      carForm.category
    );

    fd.append(
      "startingPrice",
      carForm.startingPrice
    );

    fd.append(
      "topVariantPrice",
      carForm.topVariantPrice || "0"
    );

    fd.append(
      "overview",
      carForm.overview
    );

    fd.append(
      "galleryImages",
      carForm.galleryImages
    );

    fd.append(
      "colors",
      carForm.colors
    );

    fd.append(
      "variants",
      carForm.variants
    );

    fd.append(
      "features",
      carForm.features
    );

    fd.append(
      "safety",
      carForm.safety
    );

    fd.append(
      "specifications",
      carForm.specifications
    );

    fd.append(
      "dimensions",
      carForm.dimensions
    );

    fd.append(
      "seo",
      carForm.seo
    );

    fd.append(
      "isFeatured",
      carForm.isFeatured
    );

    fd.append(
      "heroImage",
      carForm.heroFile
    );

    const res =
      await fetch(
        `${API_URL}/api/dealer/cars`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          },

          body: fd
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      alert(
        data.error ||
        data.message ||
        "Create failed"
      );

      return;
    }

    setShowCarModal(false);

    setCarForm({
      ...carForm,
      name: "",
      brand: "",
      slug: "",
      startingPrice: "",
      heroFile: null
    });

    loadCars();
  };

  const handleLogout = () => {

    logout();

    navigate("/dealer/login");
  };

  if (loading) {

    return (

      <div style={loadingBox}>
        Loading dealer portal…
      </div>

    );
  }

  return (

    <div style={layout}>

      <div style={sidebar}>

        <h2 style={sbTitle}>
          EVSavari
        </h2>

        <p style={sbSub}>
          Dealer portal
        </p>

        <NavLink
          to="/dealer/leads"
          style={({ isActive }) => ({
            ...menuBtn,
            ...(isActive ? menuActive : {}),
            textDecoration: "none",
            display: "block",
          })}
        >
          📥 Leads
          {unreadCount > 0 ? (
            <span style={unreadPill}> {unreadCount} new</span>
          ) : null}
        </NavLink>

        <NavLink
          to="/dealer/dashboard"
          style={({ isActive }) => ({
            ...menuBtn,
            ...(isActive ? menuActive : {}),
            textDecoration: "none",
            display: "block",
          })}
        >
          📈 Dashboard
        </NavLink>

        <NavLink
          to="/dealer/profile"
          style={({ isActive }) => ({
            ...menuBtn,
            ...(isActive ? menuActive : {}),
            textDecoration: "none",
            display: "block",
          })}
        >
          🚗 Profile & inventory
        </NavLink>

        <button
          type="button"
          style={menuBtn}
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      <div style={main}>

        <div style={header}>

          <div>

            <h1 style={h1}>
              {tab === "leads"
                ? "Lead management"
                : tab === "inventory"
                  ? "Dealer profile"
                  : "Dealer dashboard"}
            </h1>

            <p style={sub}>
              {tab === "leads"
                ? "Contact, follow-up, and convert assigned enquiries"
                : tab === "inventory"
                  ? "Coverage, brands, and inventory listings"
                  : "Performance overview and demand signals"}
            </p>

          </div>

        </div>

        {tab === "analytics" && analytics && (

          <div style={grid4}>

            <div style={kpi}>
              <p>Total leads</p>
              <h2>
                {analytics.totalLeads}
              </h2>
            </div>

            <div style={kpi}>
              <p>Won leads</p>
              <h2>
                {analytics.wonLeads}
              </h2>
            </div>

            <div style={kpi}>
              <p>Response rate</p>
              <h2>
                {analytics.responseRate}%
              </h2>
            </div>

            {analytics.responsiveness && (
              <>
                <div style={kpi}>
                  <p>Response score</p>
                  <h2>
                    {analytics.responsiveness.responseScore ?? "—"}%
                  </h2>
                </div>
                <div style={kpi}>
                  <p>Avg first response</p>
                  <h2>
                    {analytics.responsiveness.avgFirstResponseHours ?? "—"}h
                  </h2>
                </div>
                <div style={kpi}>
                  <p>SLA breaches</p>
                  <h2>
                    {analytics.responsiveness.slaBreaches ?? 0}
                  </h2>
                </div>
              </>
            )}

            <div style={kpi}>
              <p>Active listings</p>
              <h2>

                {
                  cars.filter(
                    (c) =>
                      c.dealerListingStatus ===
                      "active"
                  ).length
                }

              </h2>
            </div>

          </div>

        )}

        {tab === "analytics" && analytics && (

          <div style={split}>

            <div style={panel}>

              <h3 style={h3}>
                Top vehicles
              </h3>

              <ul style={ul}>

                {(
                  !analytics.topVehicles ||
                  !analytics.topVehicles.length
                ) ? (

                  <li style={muted}>
                    No data
                  </li>

                ) : (

                  analytics.topVehicles.map(
                    (r, i) => (

                      <li
                        key={i}
                        style={li}
                      >

                        <span>
                          {r.name}
                        </span>

                        <strong>
                          {r.count}
                        </strong>

                      </li>

                    )
                  )

                )}

              </ul>

            </div>

            <div style={panel}>

              <h3 style={h3}>
                City distribution
              </h3>

              <ul style={ul}>

                {(
                  !analytics.cityDistribution ||
                  !analytics.cityDistribution.length
                ) ? (

                  <li style={muted}>
                    No data
                  </li>

                ) : (

                  analytics.cityDistribution.map(
                    (r, i) => (

                      <li
                        key={i}
                        style={li}
                      >

                        <span>
                          {r.city}
                        </span>

                        <strong>
                          {r.count}
                        </strong>

                      </li>

                    )
                  )

                )}

              </ul>

            </div>

          </div>

        )}

        {tab === "inventory" && (

          <>

            <div style={card}>
              <h3 style={h3}>Dealer profile</h3>
              {dealerProfile && (
                <p style={muted}>
                  {dealerProfile.name} · {dealerProfile.email}
                </p>
              )}
              <label style={{ display: "block", marginTop: "0.75rem" }}>
                Phone
                <input
                  style={input}
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      phone: e.target.value,
                    })
                  }
                />
              </label>
              <label style={{ display: "block", marginTop: "0.5rem" }}>
                Cities (comma-separated)
                <input
                  style={input}
                  value={profileForm.cities}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      cities: e.target.value,
                    })
                  }
                />
              </label>
              <label style={{ display: "block", marginTop: "0.5rem" }}>
                Brands (comma-separated)
                <input
                  style={input}
                  value={profileForm.brands}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      brands: e.target.value,
                    })
                  }
                />
              </label>
              <button
                type="button"
                style={{ ...primary, marginTop: "0.75rem" }}
                onClick={saveProfile}
              >
                Save profile
              </button>
            </div>

            <button
              type="button"
              style={primary}
              onClick={() =>
                setShowCarModal(true)
              }
            >
              Add EV listing
            </button>

            <div style={card}>

              <h3 style={h3}>
                Your listings
              </h3>

              {cars.length === 0 ? (

                <p style={muted}>
                  No listings yet.
                </p>

              ) : (

                <div style={{ overflowX: "auto" }}>

                  <table style={table}>

                    <thead>

                      <tr>

                        <th style={th}>
                          Name
                        </th>

                        <th style={th}>
                          Brand
                        </th>

                        <th style={th}>
                          Price
                        </th>

                        <th style={th}>
                          Status
                        </th>

                        <th style={th}>
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {cars.map((c) => (

                        <tr key={c._id}>

                          <td style={td}>
                            {c.name}
                          </td>

                          <td style={td}>
                            {c.brand}
                          </td>

                          <td style={td}>
                            {c.startingPrice}
                          </td>

                          <td style={td}>
                            {c.dealerListingStatus}
                          </td>

                          <td style={td}>

                            <button
                              type="button"
                              style={smallBtn}
                              onClick={() =>
                                setListingStatus(
                                  c._id,
                                  "sold"
                                )
                              }
                            >
                              Sold
                            </button>

                            <button
                              type="button"
                              style={smallBtn}
                              onClick={() =>
                                setListingStatus(
                                  c._id,
                                  "unavailable"
                                )
                              }
                            >
                              Unavailable
                            </button>

                            <button
                              type="button"
                              style={smallBtn}
                              onClick={() =>
                                setListingStatus(
                                  c._id,
                                  "active"
                                )
                              }
                            >
                              Active
                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </>

        )}

        {tab === "leads" && (

          <>

            <DealerQualityBar
              analytics={analytics}
              leads={leads}
              unreadCount={unreadCount}
            />

            {unreadCount > 0 && (
              <button
                type="button"
                style={{ ...primary, marginBottom: "1rem" }}
                onClick={markAllLeadsRead}
              >
                Mark all as read ({unreadCount})
              </button>
            )}

            {leads.length === 0 ? (

              <div style={card}>
                <p>
                  No leads assigned to your dealership yet.
                </p>
              </div>

            ) : (

              leads.map((lead) => {
                const openHrs = hoursSince(lead.createdAt);
                const isUnread = !lead.readByDealer;

                return (
                <div
                  key={lead._id}
                  className="dealer-lead-card"
                  style={{
                    ...leadCard,
                    ...(isUnread ? leadCardUnread : {}),
                  }}
                  onClick={() => {
                    if (isUnread) markLeadRead(lead._id);
                  }}
                >

                  <div style={leadTop}>

                    <div>

                      <h3 style={leadName}>
                        {lead.name}
                        {isUnread && (
                          <span style={newTag}> NEW</span>
                        )}
                      </h3>

                      <p style={meta}>
                        📞 {lead.phone}
                      </p>

                      <p style={meta}>
                        ✉️{" "}
                        {lead.email || "—"}
                      </p>

                      <p style={meta}>
                        📍{" "}
                        {lead.city || "—"}
                      </p>

                      <p style={meta}>
                        🚗{" "}
                        {lead.vehicleName ||

                          lead.carId?.name ||

                          "—"}
                      </p>

                      <p style={meta}>
                        🔗{" "}
                        {lead.sourcePage || "—"}
                      </p>

                      <p style={meta}>
                        📣 Source:{" "}
                        {lead.leadSource || "form"}
                        {lead.variantSlug
                          ? ` · variant: ${lead.variantSlug}`
                          : ""}
                      </p>

                      {lead.createdAt && (
                        <p style={meta}>
                          🕐{" "}
                          {new Date(
                            lead.createdAt
                          ).toLocaleString("en-IN")}
                          {openHrs != null && (
                            <span style={slaHint}>
                              {" "}
                              · open {openHrs}h
                            </span>
                          )}
                        </p>
                      )}

                    </div>

                    <div>

                      <span style={badge}>
                        {labelForStatus(
                          lead.status
                        )}
                      </span>

                    </div>

                  </div>

                  <div
                    style={quickRow}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {QUICK_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        style={
                          lead.status === s ? quickBtnActive : quickBtn
                        }
                        onClick={() => quickUpdateStatus(lead._id, s)}
                      >
                        {labelForStatus(s)}
                      </button>
                    ))}
                  </div>

                  <div style={row}>

                    <select
                      style={sel}
                      value={
                        statusPick[
                          lead._id
                        ] || ""
                      }
                      onChange={(e) =>
                        setStatusPick({
                          ...statusPick,

                          [lead._id]:
                            e.target.value
                        })
                      }
                    >

                      <option value="">
                        Update status…
                      </option>

                      {PIPELINE_STATUS_VALUES.filter(
                        (s) => s !== "new"
                      ).map((s) => (
                        <option key={s} value={s}>
                          {labelForStatus(s)}
                        </option>
                      ))}

                    </select>

                    <button
                      type="button"
                      style={primary}
                      onClick={() =>
                        updateStatus(
                          lead._id
                        )
                      }
                    >
                      Save status
                    </button>

                  </div>

                  <textarea
                    style={ta}
                    rows={3}
                    placeholder="Add a note…"
                    value={
                      notes[lead._id] || ""
                    }
                    onChange={(e) =>
                      setNotes({
                        ...notes,

                        [lead._id]:
                          e.target.value
                      })
                    }
                  />

                  <button
                    type="button"
                    style={secondary}
                    onClick={() =>
                      addNote(lead._id)
                    }
                  >
                    Add note
                  </button>

                  <button
                    type="button"
                    style={wa}
                    onClick={() =>
                      openWhatsApp(lead)
                    }
                  >
                    WhatsApp customer
                  </button>

                  <div style={hist}>
                    <h4 style={h4}>Operational timeline</h4>
                    <LeadTimeline
                      lead={lead}
                      compact
                      showProgress={false}
                    />
                  </div>

                  <div style={hist}>

                    <h4 style={h4}>
                      Notes
                    </h4>

                    {(
                      !lead.notes ||
                      !lead.notes.length
                    ) ? (

                      <p style={muted}>
                        No notes
                      </p>

                    ) : (

                      [...lead.notes]
                        .reverse()
                        .map(
                          (n, i) => (

                            <div
                              key={i}
                              style={noteBox}
                            >

                              <p style={{ margin: 0 }}>
                                {n.text}
                              </p>

                              <small style={muted}>

                                {n.createdAt
                                  ? new Date(
                                    n.createdAt
                                  ).toLocaleString()
                                  : ""}
                                {n.createdByDealer?.name
                                  ? ` · ${n.createdByDealer.name}`
                                  : ""}

                              </small>

                            </div>

                          )
                        )

                    )}

                  </div>

                </div>
              );
              })

            )}

            <style>{`
              @media (max-width: 640px) {
                .dealer-lead-card { padding: 14px !important; margin-bottom: 12px !important; }
                .dealer-lead-card h3 { font-size: 18px !important; }
              }
            `}</style>

          </>

        )}

      </div>

      {showCarModal && (

        <div
          style={modalBg}
          onClick={() =>
            setShowCarModal(false)
          }
        >

          <div
            style={modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              New listing
            </h3>

            <form
              onSubmit={submitNewCar}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >

              <input
                placeholder="Name"
                required
                value={carForm.name}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    name: e.target.value
                  })
                }
                style={input}
              />

              <input
                placeholder="Brand"
                required
                value={carForm.brand}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    brand: e.target.value
                  })
                }
                style={input}
              />

              <input
                placeholder="Slug (url)"
                required
                value={carForm.slug}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    slug: e.target.value
                  })
                }
                style={input}
              />

              <input
                placeholder="Starting price (number)"
                required
                value={carForm.startingPrice}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    startingPrice:
                      e.target.value
                  })
                }
                style={input}
              />

              <label style={label}>
                Hero image
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    heroFile:
                      e.target.files?.[0] ||
                      null
                  })
                }
              />

              <textarea
                placeholder="Overview (optional)"
                rows={3}
                value={carForm.overview}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    overview:
                      e.target.value
                  })
                }
                style={ta}
              />

              <div style={{ display: "flex", gap: "10px" }}>

                <button
                  type="submit"
                  style={primary}
                >
                  Publish
                </button>

                <button
                  type="button"
                  style={secondary}
                  onClick={() =>
                    setShowCarModal(false)
                  }
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}

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
  color: "#fff",
  padding: "28px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const sbTitle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "800"
};

const sbSub = {
  color: "#cbd5e1",
  margin: "0 0 16px"
};

const menuBtn = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "#fff",
  padding: "12px 14px",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: "600"
};

const menuActive = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)"
};

const main = {
  flex: 1,
  padding: "28px",
  minWidth: 0
};

const header = {
  background:
    "linear-gradient(135deg, #1e3a8a, #2563eb)",
  color: "#fff",
  padding: "24px",
  borderRadius: "20px",
  marginBottom: "22px"
};

const h1 = {
  margin: 0,
  fontSize: "30px",
  fontWeight: "800"
};

const sub = {
  margin: "8px 0 0",
  opacity: 0.9
};

const grid4 = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
  marginBottom: "20px"
};

const kpi = {
  background: "#fff",
  borderRadius: "16px",
  padding: "18px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 8px 24px rgba(15,23,42,0.05)"
};

const split = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px"
};

const panel = {
  background: "#fff",
  borderRadius: "16px",
  padding: "18px",
  border: "1px solid #e5e7eb"
};

const h3 = {
  margin: "0 0 12px",
  fontSize: "16px",
  fontWeight: "700",
  color: "#0f172a"
};

const h4 = {
  margin: "0 0 8px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#334155"
};

const ul = {
  listStyle: "none",
  margin: 0,
  padding: 0
};

const li = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "14px"
};

const muted = {
  color: "#64748b",
  fontSize: "14px"
};

const card = {
  background: "#fff",
  borderRadius: "20px",
  padding: "22px",
  marginTop: "16px",
  border: "1px solid #e5e7eb"
};

const primary = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
  marginRight: "8px",
  marginTop: "8px"
};

const secondary = {
  background: "#f1f5f9",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "10px 16px",
  fontWeight: "600",
  cursor: "pointer"
};

const wa = {
  ...secondary,
  marginTop: "8px",
  background: "#dcfce7",
  borderColor: "#86efac"
};

const leadCard = {
  ...card,
  marginBottom: "18px"
};

const leadCardUnread = {
  outline: "2px solid #2563eb",
  background: "#f8fafc",
  boxShadow: "0 0 0 1px #dbeafe",
};

const newTag = {
  fontSize: "11px",
  fontWeight: 800,
  color: "#2563eb",
  verticalAlign: "middle",
};

const unreadPill = {
  fontSize: "11px",
  background: "#2563eb",
  color: "#fff",
  padding: "2px 6px",
  borderRadius: "999px",
  marginLeft: "4px",
};

const slaHint = {
  color: "#b45309",
  fontWeight: 600,
};

const quickRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginBottom: "10px",
};

const quickBtn = {
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const quickBtnActive = {
  ...quickBtn,
  background: "#dbeafe",
  borderColor: "#2563eb",
  color: "#1d4ed8",
};

const leadTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "14px"
};

const leadName = {
  margin: "0 0 8px",
  fontSize: "22px",
  color: "#0f172a"
};

const meta = {
  margin: "4px 0",
  color: "#475569",
  fontSize: "14px"
};

const badge = {
  background: "#e0e7ff",
  color: "#3730a3",
  padding: "6px 12px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "13px"
};

const row = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  alignItems: "center",
  marginBottom: "10px"
};

const sel = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  minWidth: "200px"
};

const ta = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "10px",
  fontFamily: "inherit",
  marginBottom: "8px"
};

const hist = {
  marginTop: "14px",
  paddingTop: "12px",
  borderTop: "1px solid #e5e7eb"
};

const histRow = {
  padding: "8px 0",
  fontSize: "14px"
};

const noteBox = {
  background: "#f8fafc",
  padding: "10px 12px",
  borderRadius: "12px",
  marginBottom: "8px",
  border: "1px solid #e2e8f0"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px"
};

const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #e2e8f0",
  color: "#64748b"
};

const td = {
  padding: "10px 8px",
  borderBottom: "1px solid #f1f5f9"
};

const smallBtn = {
  ...secondary,
  marginRight: "6px",
  marginBottom: "6px",
  fontSize: "12px",
  padding: "6px 10px"
};

const modalBg = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  zIndex: 9998,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px"
};

const modal = {
  background: "#fff",
  borderRadius: "20px",
  padding: "24px",
  maxWidth: "480px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto"
};

const input = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1"
};

const label = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#334155"
};

const loadingBox = {
  minHeight: "60vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb"
};
