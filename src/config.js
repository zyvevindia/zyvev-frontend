/* =========================================================
   ====================== API CONFIG =======================
   ========================================================= */

/*
  ==========================================================
  ENVIRONMENT VARIABLES
  ==========================================================

  Development:
  VITE_API_URL=http://localhost:5000

  Production:
  VITE_API_URL=https://api.evsavari.com

  Example .env:
  VITE_API_URL=http://localhost:5000

  Example .env.production:
  VITE_API_URL=https://api.evsavari.com
*/

/* =========================================================
   ====================== ENV VALUES =======================
   ========================================================= */

const ENV_API_URL =
  import.meta.env.VITE_API_URL;

const IS_DEV =
  import.meta.env.DEV;

const IS_PROD =
  import.meta.env.PROD;

/* =========================================================
   ====================== FALLBACKS ========================
   ========================================================= */

const DEV_FALLBACK =
  "http://localhost:5000";

const PROD_FALLBACK =
  "https://api.evsavari.com";

/* =========================================================
   ======================= API URL =========================
   ========================================================= */

export const API_URL = (

  ENV_API_URL ||

  (IS_DEV
    ? DEV_FALLBACK
    : PROD_FALLBACK)

).replace(/\/$/, "");

/* =========================================================
   ==================== APP METADATA =======================
   ========================================================= */

export const APP_CONFIG = {

  appName: "EVSavari",

  appDescription:
    "India’s Electric Vehicle Marketplace",

  environment:
    IS_DEV
      ? "development"
      : "production",

  version: "1.0.0",

  domain:
    "evsavari.com",

  apiDomain:
    "api.evsavari.com",

  supportEmail:
    "support@evsavari.com",
};

/* =========================================================
   ====================== API ROUTES =======================
   ========================================================= */

export const API_ROUTES = {

  cars:
    `${API_URL}/cars`,

  leads:
    `${API_URL}/leads`,

  views:
    `${API_URL}/views`,

  adminLogin:
    `${API_URL}/api/admin/login`,

  adminUsers:
    `${API_URL}/api/admin/users`,

  adminCars:
    `${API_URL}/api/admin/cars`,
};

/* =========================================================
   ==================== ENVIRONMENT HELPERS =================
   ========================================================= */

export const ENVIRONMENT = {

  isDev: IS_DEV,

  isProd: IS_PROD,

  apiUrl: API_URL,
};

/* =========================================================
   ====================== DEBUG LOGS =======================
   ========================================================= */

if (IS_DEV) {

  console.log(

    "%c⚡ EVSavari Environment",

    "color:#2563eb;font-weight:bold;font-size:14px"
  );

  console.log({

    environment:
      APP_CONFIG.environment,

    apiUrl:
      API_URL,

    version:
      APP_CONFIG.version,
  });
}