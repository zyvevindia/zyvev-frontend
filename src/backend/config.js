/**
 * Backend persistence configuration — Supabase (Postgres + auth + storage).
 * Env-dependent fields use getters so Node bootstrap can run before backend import.
 */

import {
  validateBackendEnv,
  isBackendPersistenceConfigured,
  validateOperationalEnv,
  formatOperationalEnvErrors,
  isOperationalSupabaseAdminConfigured,
  maskSecret,
} from "./envValidation.js";

const STATIC_TABLES = Object.freeze({
  users: "users",
  sessions: "sessions",
  compareEvents: "compare_events",
  trustFeedback: "trust_feedback",
  leads: "leads",
  vehicles: "vehicles",
  vehicleVariants: "vehicle_variants",
  vehicleMedia: "vehicle_media",
  operationalSnapshots: "operational_snapshots",
});

const STATIC_MEDIA_ROLES = Object.freeze([
  "hero",
  "listing-thumb",
  "compare-thumb",
  "og",
  "exterior",
  "interior",
  "charging-port",
]);

const STATIC_ADMIN_ROLES = Object.freeze(["admin", "sales", "editor"]);

export const BACKEND_CONFIG = Object.freeze({
  provider: "supabase",
  get configured() {
    return validateBackendEnv().configured;
  },
  get supabaseUrl() {
    return validateBackendEnv().supabaseUrl;
  },
  get supabaseAnonKey() {
    return validateBackendEnv().supabaseAnonKey;
  },
  get envIssues() {
    return validateBackendEnv().issues;
  },
  get envWarnings() {
    return validateBackendEnv().warnings;
  },
  tables: STATIC_TABLES,
  mediaRoles: STATIC_MEDIA_ROLES,
  adminRoles: STATIC_ADMIN_ROLES,
});

export {
  isBackendPersistenceConfigured,
  validateBackendEnv,
  validateOperationalEnv,
  formatOperationalEnvErrors,
  isOperationalSupabaseAdminConfigured,
  maskSecret,
};
