import { useEffect, useState } from "react";

import { API_URL } from "../config";

/* =========================================================
   ================= NOTIFICATION BELL =====================
   ========================================================= */

export default function NotificationBell() {

  const token = localStorage.getItem("token");

  /* ================= STATE ================= */

  const [notifications, setNotifications] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /* =====================================================
     ================= FETCH NOTIFICATIONS ================
     ===================================================== */

  const fetchNotifications = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {

        setNotifications(data || []);
      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     ================= INITIAL LOAD =======================
     ===================================================== */

  useEffect(() => {

    fetchNotifications();

  }, []);

  /* =====================================================
     ================= AUTO REFRESH =======================
     ===================================================== */

  useEffect(() => {

    const interval = setInterval(() => {

      fetchNotifications();

    }, 30000);

    return () => clearInterval(interval);

  }, []);

  /* =====================================================
     ================= MARK AS READ =======================
     ===================================================== */

  const markAsRead = async (id) => {

    try {

      await fetch(
        `${API_URL}/api/notifications/${id}/read`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((prev) =>

        prev.map((n) =>

          n._id === id

            ? {
                ...n,
                isRead: true
              }

            : n
        )
      );

    } catch (err) {

      console.error(err);
    }
  };

  /* =====================================================
     ================= UNREAD COUNT =======================
     ===================================================== */

  const unreadCount =
    notifications.filter(
      (n) => !n.isRead
    ).length;

  /* =====================================================
     ================= PRIORITY COLOR =====================
     ===================================================== */

  const getPriorityColor = (priority) => {

    switch (priority) {

      case "low":
        return "#6b7280";

      case "medium":
        return "#2563eb";

      case "high":
        return "#ea580c";

      case "urgent":
        return "#dc2626";

      default:
        return "#666";
    }
  };

  /* =====================================================
     ========================= UI =========================
     ===================================================== */

  return (

    <div style={container}>

      {/* ================= BELL ================= */}

      <button
        style={bellButton}
        onClick={() =>
          setOpen(!open)
        }
      >

        🔔

        {unreadCount > 0 && (

          <span style={badge}>

            {unreadCount}

          </span>

        )}

      </button>

      {/* ================= DROPDOWN ================= */}

      {open && (

        <div style={dropdown}>

          {/* HEADER */}

          <div style={header}>

            <h3>
              Notifications
            </h3>

          </div>

          {/* LOADING */}

          {loading ? (

            <div style={emptyState}>

              Loading...

            </div>

          ) : notifications.length === 0 ? (

            <div style={emptyState}>

              No notifications

            </div>

          ) : (

            <div style={list}>

              {notifications.map(
                (notification) => (

                  <div
                    key={notification._id}
                    style={{
                      ...notificationCard,

                          background:
                            notification.isRead
                                ? "white"
                                : "#eef4ff",

                            color: "#111827"
                    }}
                    onClick={() =>
                      markAsRead(
                        notification._id
                      )
                    }
                  >

                    {/* TITLE */}

                    <div
                      style={notificationTop}
                    >

                      <strong>

                        {
                          notification.title
                        }

                      </strong>

                      <span
                        style={{
                          ...priorityBadge,

                          background:
                            getPriorityColor(
                              notification.priority
                            )
                        }}
                      >

                        {
                          notification.priority
                        }

                      </span>

                    </div>

                    {/* MESSAGE */}

                    <p
                      style={{
                            marginTop: "8px",
                            fontSize: "14px",
                            color: "#374151"
                        }}
                    >

                      {
                        notification.message
                      }

                    </p>

                    {/* TIME */}

                    <small
                    style={{
                        opacity: 0.7,
                        color: "#6b7280"
                    }}
                    >

                      {new Date(
                        notification.createdAt
                      ).toLocaleString()}

                    </small>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const container = {
  position: "relative"
};

const bellButton = {
  position: "relative",
  border: "none",
  background: "white",
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "20px",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.12)"
};

const badge = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  background: "#dc2626",
  color: "white",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold"
};

const dropdown = {
  position: "absolute",
  top: "60px",
  right: 0,
  width: "360px",
  background: "white",
  borderRadius: "14px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.15)",
  zIndex: 9999,
  overflow: "hidden"
};

const header = {
  padding: "16px",
  borderBottom: "1px solid #eee"
};

const list = {
  maxHeight: "500px",
  overflowY: "auto"
};

const notificationCard = {
  padding: "16px",
  borderBottom: "1px solid #f1f1f1",
  cursor: "pointer",
  transition: "0.2s"
};

const notificationTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const priorityBadge = {
  color: "white",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  textTransform: "capitalize"
};

const emptyState = {
  padding: "30px",
  textAlign: "center",
  opacity: 0.7
};