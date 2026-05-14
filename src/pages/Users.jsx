import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import CreateSalesUser from "../components/CreateSalesUser";

import {
  getToken,
  logout
} from "../auth";

/* =========================================================
   ======================= USERS PAGE =======================
   ========================================================= */

export default function Users() {

  const navigate = useNavigate();

  const token = getToken();

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =====================================================
     ================= FETCH USERS ========================
     ===================================================== */

  const fetchUsers = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/users",
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
          "Failed to load users"
        );

        setLoading(false);

        return;
      }

      setUsers(data || []);

    } catch (err) {

      console.error(err);

      setError("Server error");

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     ================= INITIAL LOAD =======================
     ===================================================== */

  useEffect(() => {

    fetchUsers();

  }, []);

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

        <h2>Loading users...</h2>

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

        <h2>Zyvev</h2>

        <button
          style={menuButton}
          onClick={() => navigate("/admin")}
        >
          📊 Dashboard
        </button>

        <button
          style={{
            ...menuButton,
            background: "#1e3c72"
          }}
        >
          👥 Users
        </button>

        <button
          style={menuButton}
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

            <h1>👥 User Management</h1>

            <p>
              Manage admin & sales users
            </p>

          </div>

        </div>

        {/* ================= CREATE USER ================= */}
        <CreateSalesUser
          token={token}
          onUserCreated={(user) =>
            setUsers(prev => [
              user,
              ...prev
            ])
          }
        />

        {/* ================= ERROR ================= */}
        {error && (

          <div style={errorBox}>
            {error}
          </div>

        )}

        {/* ================= USERS TABLE ================= */}
        <div style={card}>

          <div style={cardHeader}>

            <h3>All Users</h3>

            <span>
              Total: {users.length}
            </span>

          </div>

          {users.length === 0 ? (

            <p>No users found</p>

          ) : (

            <table style={table}>

              <thead>

                <tr>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Role</th>

                  <th>Status</th>

                  <th>Created</th>

                </tr>

              </thead>

              <tbody>

                {users.map((user) => (

                  <tr key={user._id}>

                    {/* NAME */}
                    <td>
                      {user.name || "-"}
                    </td>

                    {/* EMAIL */}
                    <td>
                      {user.email}
                    </td>

                    {/* ROLE */}
                    <td>

                      <span
                        style={{
                          ...badge,
                          background:
                            user.role === "admin"
                              ? "#1e3c72"
                              : "#0f9d58"
                        }}
                      >
                        {user.role}
                      </span>

                    </td>

                    {/* STATUS */}
                    <td>

                      <span
                        style={{
                          ...badge,
                          background:
                            user.isActive
                              ? "#0f9d58"
                              : "#999"
                        }}
                      >
                        {user.isActive
                          ? "Active"
                          : "Disabled"}
                      </span>

                    </td>

                    {/* CREATED */}
                    <td>

                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : "-"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

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

const menuButton = {
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

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const badge = {
  color: "white",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold"
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "20px"
};

const loadingContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};