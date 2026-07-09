import {
  useState,
  useEffect
} from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  setAuth,
  getRole,
  isAuthenticated
} from "./auth";

import { API_URL } from "./config";

/* =========================================================
   ======================= LOGIN ============================
   ========================================================= */

export default function Login() {

  const navigate = useNavigate();

  const location = useLocation();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  /* =====================================================
     ================= SESSION CHECK ======================
     ===================================================== */

  useEffect(() => {

    if (isAuthenticated()) {

      const role = getRole();

      if (role === "admin") {

        navigate("/admin");

      } else if (role === "sales") {

        navigate("/sales");

      } else if (role === "dealer") {

        navigate("/dealer");
      }
    }

  }, [navigate]);

  /* =====================================================
     ================= HANDLE LOGIN =======================
     ===================================================== */

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/api/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      /* ================= LOGIN FAILED ================= */
      if (!response.ok) {

        setError(
          data.error ||
          data.message ||
          "Login failed"
        );

        setLoading(false);

        return;
      }

      /* ================= SAVE AUTH ================= */
      setAuth(
        data.token,
        data.role
      );

      const role =
        data.role || getRole();

      /* =================================================
         ================ ROLE REDIRECT ==================
         ================================================= */

      // ---------- ADMIN ----------
      if (role === "admin") {

        navigate(
          location.state?.from ||
          "/admin"
        );

        return;
      }

      // ---------- SALES ----------
      if (role === "sales") {

        navigate("/sales");

        return;
      }

      // ---------- FALLBACK ----------
      navigate("/");

    } catch (err) {

      console.error(err);

      setError("Server error");

    } finally {

      setLoading(false);
    }
  };

  /* =====================================================
     ======================= UI ===========================
     ===================================================== */

  return (

    <div style={container}>

      <div style={card}>

        {/* ================= BRAND ================= */}
        <div style={brand}>

          <h1>EVSavari</h1>

          <p>
            EV Marketplace CRM Platform
          </p>

        </div>

        {/* ================= LOGIN FORM ================= */}
        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <div style={field}>

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter email"
              required
              style={input}
            />

          </div>

          {/* PASSWORD */}
          <div style={field}>

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              required
              style={input}
            />

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...button,
              opacity: loading ? 0.7 : 1
            }}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

          {/* ERROR */}
          {error && (

            <p style={errorText}>
              {error}
            </p>

          )}

        </form>

        {/* ================= DEMO USERS ================= */}
        <div style={demoBox}>

          <h4>Demo Access</h4>

          <p>
            Admin:
            admin@evsavari.com
          </p>

          <p>
            Sales:
            sales1@evsavari.com
          </p>

        </div>

        {/* ================= FOOTER ================= */}
        <div style={footer}>

          <p style={{ margin: 0, color: "#64748b" }}>
            Secure CRM & Analytics Platform
          </p>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ======================= STYLES ===========================
   ========================================================= */

const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "linear-gradient(135deg, #1e3c72, #2a5298)",
};

const card = {
  width: "380px",
  background: "white",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};

const brand = {
  textAlign: "center",
  marginBottom: "25px"
};

const field = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "15px"
};

const input = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  marginTop: "5px",
  fontSize: "14px"
};

const button = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  background: "#1e3c72",
  color: "white",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "10px"
};

const errorText = {
  color: "#dc2626",
  marginTop: "10px",
  textAlign: "center"
};

const demoBox = {
  marginTop: "20px",
  background: "#f5f7fb",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "12px",
  lineHeight: "1.7"
};

const footer = {
  textAlign: "center",
  marginTop: "15px",
  fontSize: "12px",
  opacity: 0.6
};