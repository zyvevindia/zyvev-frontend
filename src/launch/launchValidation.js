/**
 * Launch validation helpers — browser ops page + CLI script.
 */

import { API_URL } from "../config";
import { PRODUCTION_FAMILY_SLUGS } from "../media/familyMediaManifest";
import {
  probeApiHealth,
  probeCloudinaryHealth,
  probeLaunchFamiliesInCatalog,
} from "./healthCheck";

const ENV_CHECKS = [
  {
    key: "VITE_API_URL",
    required: false,
    hint: "Falls back to dev/prod defaults when unset",
  },
  {
    key: "VITE_CLOUDINARY_CLOUD_NAME",
    required: false,
    hint: "Default cloud: dznvmumze",
  },
  {
    key: "VITE_BEHAVIORAL_INTELLIGENCE",
    required: false,
    hint: "Set true for buyer event telemetry",
  },
  {
    key: "VITE_WHATSAPP_SALES_NUMBER",
    required: false,
    hint: "Required for WhatsApp CTAs",
  },
  {
    key: "VITE_LAUNCH_PROFILE",
    required: false,
    hint: "staging | soft-launch | public-beta",
  },
  {
    key: "VITE_GA_ID",
    required: false,
    hint: "Optional GA4 measurement ID",
  },
  {
    key: "VITE_SENTRY_DSN",
    required: false,
    hint: "Optional Sentry error monitoring",
  },
  {
    key: "VITE_SENTRY_TRACES_SAMPLE_RATE",
    required: false,
    hint: "Sentry performance sample rate (0–1)",
  },
];

export function verifyEnvironmentVariables() {
  const env = import.meta.env;
  const rows = ENV_CHECKS.map(({ key, required, hint }) => {
    const raw = env[key];
    const value = raw === undefined || raw === "" ? "" : String(raw);
    const set = value.length > 0;
    return {
      key,
      set,
      value: set ? maskSecret(key, value) : "(unset)",
      required,
      hint,
      ok: required ? set : true,
    };
  });

  const missingRequired = rows.filter((r) => r.required && !r.set);

  return {
    ok: missingRequired.length === 0,
    rows,
    apiUrl: API_URL,
    mode: env.MODE,
    prod: env.PROD,
  };
}

function maskSecret(key, value) {
  if (key.includes("SECRET") || key.includes("KEY")) {
    return value.length > 4 ? `${value.slice(0, 2)}…` : "•••";
  }
  if (key.includes("WHATSAPP") && value.length > 6) {
    return `${value.slice(0, 4)}…${value.slice(-2)}`;
  }
  return value;
}

export async function verifyApiConnectivity(fetchImpl = globalThis.fetch) {
  return probeApiHealth(fetchImpl);
}

export async function verifyCloudinaryImageUrls(fetchImpl = globalThis.fetch) {
  return probeCloudinaryHealth(fetchImpl);
}

export function verifyLaunchFamiliesExist(cars = []) {
  return probeLaunchFamiliesInCatalog(cars);
}

/**
 * Full launch validation report.
 */
export async function runLaunchValidation(fetchImpl = globalThis.fetch) {
  const env = verifyEnvironmentVariables();
  const api = await verifyApiConnectivity(fetchImpl);
  const cloudinary = await verifyCloudinaryImageUrls(fetchImpl);

  let catalog = { ok: false, cars: [], families: null, error: null };

  if (api.ok) {
    try {
      const res = await fetchImpl(`${API_URL}/cars?limit=50`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const cars = Array.isArray(data?.cars) ? data.cars : [];
        catalog = {
          ok: true,
          cars,
          families: verifyLaunchFamiliesExist(cars),
          total: data?.total ?? cars.length,
        };
      } else {
        catalog.error = `HTTP ${res.status}`;
      }
    } catch (err) {
      catalog.error = err?.message || "catalog_fetch_failed";
    }
  } else {
    catalog.error = api.error || "api_unreachable";
  }

  const ok =
    env.ok &&
    api.ok &&
    cloudinary.ok &&
    (catalog.families?.ok ?? false);

  return {
    ok,
    checkedAt: new Date().toISOString(),
    env,
    api,
    cloudinary,
    catalog,
    launchFamilies: PRODUCTION_FAMILY_SLUGS,
  };
}
