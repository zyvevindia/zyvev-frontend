/**
 * Supabase / backend env validation — safe for browser builds.
 * Missing vars do not throw; callers check `isBackendPersistenceConfigured()`.
 */

import {
  getCloudinaryEnvState,
  normalizeCloudinaryEnv,
} from "./env/cloudinaryEnv.js";

function isNodeRuntime() {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function readEnv(key) {
  // Node operational scripts: process.env (dotenv) wins over import.meta.env
  if (isNodeRuntime()) {
    const nodeVal = process.env?.[key];
    if (nodeVal !== undefined && nodeVal !== "") {
      return String(nodeVal).trim();
    }
  }

  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteVal = import.meta.env[key];
    if (viteVal !== undefined && viteVal !== "") {
      return String(viteVal).trim();
    }
  }

  if (typeof process !== "undefined" && process.env?.[key]) {
    return String(process.env[key]).trim();
  }

  return "";
}

/** Service role must never be referenced from Vite env. */
const FORBIDDEN_IN_BROWSER = [
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export function maskSecret(value = "", visible = 4) {
  const str = String(value || "");
  if (!str) return "(unset)";
  if (str.length <= visible) return "***";
  return `${str.slice(0, visible)}…`;
}

export function validateBackendEnv(options = {}) {
  const { strict = false } = options;
  const issues = [];
  const warnings = [];

  const supabaseUrl = readEnv("VITE_SUPABASE_URL").replace(/\/$/, "");
  const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl) {
    issues.push("VITE_SUPABASE_URL is not set");
  } else if (!/^https:\/\/.+\.supabase\.co\/?$/i.test(supabaseUrl)) {
    warnings.push("VITE_SUPABASE_URL does not look like a Supabase project URL");
  }

  if (!supabaseAnonKey) {
    issues.push("VITE_SUPABASE_ANON_KEY is not set");
  } else if (supabaseAnonKey.length < 20) {
    warnings.push("VITE_SUPABASE_ANON_KEY looks too short");
  }

  for (const key of FORBIDDEN_IN_BROWSER) {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key]
    ) {
      issues.push(`${key} must not be exposed to the frontend bundle`);
    }
  }

  const configured = issues.length === 0;

  if (strict && !configured) {
    throw new Error(`Backend env invalid: ${issues.join("; ")}`);
  }

  return {
    configured,
    issues,
    warnings,
    supabaseUrl,
    supabaseAnonKey,
  };
}

/**
 * Node operational script validation — never logs secret values.
 */
export function validateOperationalEnv(options = {}) {
  const {
    requireSupabase = false,
    requireServiceRole = false,
    requireCloudinary = false,
    strict = false,
  } = options;

  const issues = [];
  const warnings = [];

  const backend = validateBackendEnv();
  if (requireSupabase) {
    issues.push(...backend.issues);
  } else if (backend.issues.length) {
    warnings.push(...backend.issues.map((i) => `Supabase idle: ${i}`));
  }
  warnings.push(...backend.warnings);

  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (requireServiceRole && !serviceRoleKey) {
    issues.push(
      "SUPABASE_SERVICE_ROLE_KEY is not set (scripts only — add to .env.local, never Vite)"
    );
  }
  if (serviceRoleKey.startsWith("VITE_")) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY must not use VITE_ prefix");
  }

  if (typeof process !== "undefined" && process.env) {
    normalizeCloudinaryEnv(process.env);
  }

  const cloudinary = getCloudinaryEnvState(
    typeof process !== "undefined" ? process.env : {}
  );

  if (requireCloudinary) {
    if (!cloudinary.configured) {
      issues.push(
        "Cloudinary not configured: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in .env.local"
      );
    }
  } else if (cloudinary.hasUrl && !cloudinary.configured) {
    warnings.push("CLOUDINARY_URL present but could not derive full Cloudinary credentials");
  }

  const cloudName = readEnv("CLOUDINARY_CLOUD_NAME") || readEnv("VITE_CLOUDINARY_CLOUD_NAME");
  if (cloudName && !cloudinary.cloudName) {
    warnings.push("CLOUDINARY_CLOUD_NAME set but Cloudinary SDK config incomplete");
  }

  const configured =
    (!requireSupabase || backend.configured) &&
    (!requireServiceRole || Boolean(serviceRoleKey)) &&
    (!requireCloudinary || cloudinary.configured);

  const result = {
    configured,
    issues,
    warnings,
    supabase: backend,
    cloudinary: {
      configured: cloudinary.configured,
      cloudName: cloudinary.cloudName || cloudName || "",
      hasUrl: cloudinary.hasUrl,
      apiKeySet: Boolean(cloudinary.apiKey),
      apiSecretSet: Boolean(cloudinary.apiSecret),
    },
    serviceRoleSet: Boolean(serviceRoleKey),
  };

  if (strict && issues.length) {
    throw new Error(formatOperationalEnvErrors(issues));
  }

  return result;
}

export function formatOperationalEnvErrors(issues = []) {
  return issues.join("; ");
}

export function isBackendPersistenceConfigured() {
  return validateBackendEnv().configured;
}

export function isOperationalSupabaseAdminConfigured() {
  const env = validateOperationalEnv({
    requireSupabase: true,
    requireServiceRole: true,
  });
  return env.configured && env.issues.length === 0;
}
