import { Navigate, useLocation } from "react-router-dom";

import {
  isAuthenticated,
  getRole,
  logout
} from "./auth";

/* =========================================================
   ==================== PRIVATE ROUTE =======================
   ========================================================= */

export default function PrivateRoute({
  children,
  allowedRoles = [],
}) {

  const location = useLocation();

  /* =====================================================
     ================= AUTH CHECK =========================
     ===================================================== */

  const authenticated = isAuthenticated();

  if (!authenticated) {

    logout();

    const loginPath =
      location.pathname.startsWith(
        "/dealer"
      )
        ? "/dealer/login"
        : "/login";

    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  /* =====================================================
     ================= ROLE CHECK =========================
     ===================================================== */

  const role = getRole();

  // ---------- INVALID ROLE ----------
  if (!role) {

    logout();

    const loginPath =
      location.pathname.startsWith(
        "/dealer"
      )
        ? "/dealer/login"
        : "/login";

    return (
      <Navigate
        to={loginPath}
        replace
      />
    );
  }

  // ---------- ACCESS DENIED ----------
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {

    // ---------- ADMIN ROUTES ----------
    if (role === "admin") {

      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    // ---------- SALES ROUTES ----------
    if (role === "sales") {

      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    if (role === "dealer") {

      return (
        <Navigate
          to="/dealer"
          replace
        />
      );
    }

    // ---------- FALLBACK ----------
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =====================================================
     ================= ACCESS GRANTED =====================
     ===================================================== */

  return children;
}