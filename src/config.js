/* =========================================================
   ====================== API CONFIG =======================
   ========================================================= */

/*
  ==========================================================
  ENVIRONMENT VARIABLES
  ==========================================================

  Copy .env.example to .env.local for local overrides (gitignored).

  Development default:
  VITE_API_URL=http://localhost:5000

  Production / CI:
  Set VITE_API_URL in the deployment environment (see .env.production).

  Optional Google Analytics (GA4):
  VITE_GA_ID=G-XXXXXXXXXX
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
  "https://evsavari-api.onrender.com";

/* =========================================================
   ======================= API URL =========================
   ========================================================= */

export const API_URL = (

  ENV_API_URL ||

  (
    IS_DEV
      ? DEV_FALLBACK
      : PROD_FALLBACK
  )

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
    "evsavari-api.onrender.com",

  supportEmail:
    "support@evsavari.com",
};

export const SITE_ORIGIN =
  `https://${APP_CONFIG.domain}`;

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

  isDev:
    IS_DEV,

  isProd:
    IS_PROD,

  apiUrl:
    API_URL,
};

/* =========================================================
   ================= SEO DECISION PAGES ====================
   ========================================================= */

/**
 * When true, reserved /cars/:slug paths render SEO decision pages.
 * Static fallback: /public/seo-data/{slug}.json (build-seo-pages-json.mjs)
 */
export const SEO_PAGES_ENABLED =
  import.meta.env.VITE_SEO_PAGES === "true";

/* =========================================================
   ============ BEHAVIORAL / BUYER INTENT ====================
   ========================================================= */

/**
 * Privacy-safe anonymous buyer event tracking.
 * Requires BEHAVIORAL_INTELLIGENCE_ENABLED=true on backend.
 */
export const BEHAVIORAL_INTELLIGENCE_ENABLED =
  import.meta.env.VITE_BEHAVIORAL_INTELLIGENCE === "true";

/* =========================================================
   ====================== DEBUG LOGS =======================
   ========================================================= */

if (import.meta.env.DEV) {

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

    mode:
      import.meta.env.MODE,
  });
}