import {
  useState,
  useEffect
} from "react";

import {
  useNavigate,
  useLocation,
  Link
} from "react-router-dom";

import {
  setAuth,
  getRole,
  isAuthenticated
} from "../auth";

import { API_URL } from "../config";

/* =========================================================
   ===================== DEALER LOGIN ======================
   ========================================================= */

export default function DealerLogin() {

  const navigate = useNavigate();

  const location = useLocation();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    if (isAuthenticated()) {

      if (getRole() === "dealer") {

        navigate("/dealer");
      }
    }

  }, [navigate]);

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/api/dealer/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.message ||
          data.error ||
          "Login failed"
        );

        setLoading(false);

        return;
      }

      setAuth(
        data.token,
        "dealer"
      );

      const from =
        location.state?.from ||
        "/dealer";

      navigate(from);

    } catch (err) {

      console.error(err);

      setError("Server error");
    } finally {

      setLoading(false);
    }
  };

  return (

    <div style={wrap}>

      <div style={card}>

        <h1 style={title}>
          Dealer portal
        </h1>

        <p style={sub}>
          EVSavari partner sign-in
        </p>

        <form
          onSubmit={handleLogin}
          style={form}
        >

          <label style={label}>
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            style={input}
            autoComplete="username"
          />

          <label style={label}>
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            style={input}
            autoComplete="current-password"
          />

          {error && (

            <p style={err}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={btn}
          >
            {loading
              ? "Signing in…"
              : "Sign in"}
          </button>

        </form>

        <p style={footer}>

          <Link
            to="/login"
            style={link}
          >
            Staff login
          </Link>

          {" · "}

          <Link
            to="/"
            style={link}
          >
            Home
          </Link>

        </p>

      </div>

    </div>

  );
}

const wrap = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#f5f7fb"
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "#fff",
  borderRadius: "24px",
  padding: "32px",
  boxShadow:
    "0 16px 40px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb"
};

const title = {
  margin: "0 0 8px",
  fontSize: "26px",
  fontWeight: "800",
  color: "#0f172a"
};

const sub = {
  margin: "0 0 24px",
  color: "#64748b",
  fontSize: "14px"
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const label = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#334155",
  marginTop: "8px"
};

const input = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "15px"
};

const err = {
  color: "#b91c1c",
  fontSize: "14px",
  margin: "8px 0 0"
};

const btn = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer"
};

const footer = {
  marginTop: "20px",
  textAlign: "center",
  fontSize: "14px",
  color: "#64748b"
};

const link = {
  color: "#2563eb",
  fontWeight: "600",
  textDecoration: "none"
};
