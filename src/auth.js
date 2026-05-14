// src/auth.js

/* =========================================================
   ===================== STORAGE KEYS =======================
   ========================================================= */

const TOKEN_KEY = "token";

const ROLE_KEY = "role";

const EXPIRY_KEY = "expiry";

/* =========================================================
   ======================= SET AUTH =========================
   ========================================================= */

export function setAuth(token, role) {

  // ---------- 24 HOURS ----------
  const expiry =
    Date.now() + 24 * 60 * 60 * 1000;

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    ROLE_KEY,
    role
  );

  localStorage.setItem(
    EXPIRY_KEY,
    expiry
  );
}

/* =========================================================
   ======================== LOGOUT ==========================
   ========================================================= */

export function logout() {

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(ROLE_KEY);

  localStorage.removeItem(EXPIRY_KEY);

  // ---------- OPTIONAL FUTURE CLEANUP ----------
  // localStorage.removeItem("compareCars");
}

/* =========================================================
   ====================== GET TOKEN =========================
   ========================================================= */

export function getToken() {

  return localStorage.getItem(
    TOKEN_KEY
  );
}

/* =========================================================
   ======================= GET ROLE =========================
   ========================================================= */

export function getRole() {

  return localStorage.getItem(
    ROLE_KEY
  );
}

/* =========================================================
   ====================== GET EXPIRY ========================
   ========================================================= */

export function getExpiry() {

  return localStorage.getItem(
    EXPIRY_KEY
  );
}

/* =========================================================
   ==================== IS AUTHENTICATED ===================
   ========================================================= */

export function isAuthenticated() {

  const token = getToken();

  const expiry = getExpiry();

  // ---------- MISSING DATA ----------
  if (!token || !expiry) {

    return false;
  }

  // ---------- SESSION EXPIRED ----------
  if (Date.now() > Number(expiry)) {

    logout();

    return false;
  }

  return true;
}

/* =========================================================
   ====================== IS ADMIN ==========================
   ========================================================= */

export function isAdmin() {

  return getRole() === "admin";
}

/* =========================================================
   ====================== IS SALES ==========================
   ========================================================= */

export function isSales() {

  return getRole() === "sales";
}